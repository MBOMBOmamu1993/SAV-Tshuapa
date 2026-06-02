/**
 * Moteur analytique SAV : transforme le modèle normalisé (seed/live) filtré en
 * un bundle prêt pour l'affichage (KPI, tableaux, graphiques) et le rapport.
 */
import {
  ANTIGENS, TRANCHES, COTATION_COLOR, COTATION_LABEL, COTATION_ORDER,
  cotationFor, ALERT_THRESHOLDS, type TrancheKey, type CotationLevel,
} from "@/config/sav.config";
import { canonAntenne, dedupeLabels, eqGeo, norm } from "@/lib/geo";
import type {
  SavSeed, IdentRecord, PlanRecord, ResultRecord, SupervRecord,
  SavBundle, AntigenStat, GeoMissedRow, PlanAireRow, PlanSessionDetail, ResultGeoRow, SupervBundle,
} from "./types";

export interface Filters {
  province?: string | null;
  antenne?: string | null;
  zone?: string | null;
  aire?: string | null;
  months?: string[] | null;
}

const TRK = TRANCHES.map((t) => t.key);
const emptyTranche = (): Record<TrancheKey, number> => ({ "0-11": 0, "12-23": 0, "24-59": 0 });
const emptyAnt = (): Record<string, number> => Object.fromEntries(ANTIGENS.map((a) => [a.key, 0]));
const pct = (a: number, b: number): number | null => (b > 0 ? Math.round((a / b) * 1000) / 10 : null);
const r1 = (n: number | null): number | null => (n === null ? null : Math.round(n * 10) / 10);

interface GeoLike { province: string | null; antenne: string | null; zone: string | null; aire: string | null; month?: string | null }

function matches(r: GeoLike, f: Filters): boolean {
  if (f.province && !eqGeo(r.province, f.province)) return false;
  if (f.antenne && !eqGeo(canonAntenne(r.antenne), canonAntenne(f.antenne))) return false;
  if (f.zone && !eqGeo(r.zone, f.zone)) return false;
  if (f.aire && !eqGeo(r.aire, f.aire)) return false;
  if (f.months && f.months.length && !(r.month && f.months.includes(r.month))) return false;
  return true;
}

/* --------------------------- Déduplication (spec 01) --------------------------- */
/** Clé d'unicité d'une aire : zone + aire normalisées (évite les collisions
 *  d'aires homonymes situées dans deux zones différentes). */
function aireKey(r: { zone: string | null; aire: string | null }): string {
  return `${norm(r.zone ?? "")}|${norm(r.aire ?? "")}`;
}

/**
 * Conserve un seul enregistrement par aire de santé = le plus RÉCENT (champ
 * `date`) ; à date égale, le plus « complet » (selon `sizeOf`).
 * Utilisé pour identCs, identRelais et planif (PAS pour resultats ni superv).
 */
function dedupeByAire<T extends { zone: string | null; aire: string | null; date: string | null }>(
  records: T[],
  sizeOf: (r: T) => number,
): T[] {
  const best = new Map<string, T>();
  for (const r of records) {
    const k = aireKey(r);
    if (!k || k === "|") continue;
    const cur = best.get(k);
    if (!cur) { best.set(k, r); continue; }
    const dNew = r.date ?? "";
    const dCur = cur.date ?? "";
    if (dNew > dCur || (dNew === dCur && sizeOf(r) > sizeOf(cur))) best.set(k, r);
  }
  return Array.from(best.values());
}

/** Type de session normalisé depuis la sous-feuille `sessions` (spec 02). */
function sessionType(t: string | null): "avancee" | "mobile" | "fixe" {
  const x = (t ?? "").toLowerCase();
  if (x.includes("avanc")) return "avancee";
  if (x.includes("mobile")) return "mobile";
  return "fixe"; // "Fixe", "Autre"/précisé, vide
}

/* --------------------------- Identification --------------------------- */
function aggMissed(records: IdentRecord[], keyFn: (r: IdentRecord) => string, zoneFn?: (r: IdentRecord) => string | null): GeoMissedRow[] {
  const map = new Map<string, GeoMissedRow>();
  for (const r of records) {
    const name = keyFn(r);
    if (!name) continue;
    let row = map.get(name);
    if (!row) {
      row = { name, zone: zoneFn ? zoneFn(r) : undefined, identifies: 0, zero: 0, sous: 0, dosesManquees: 0, byTranche: emptyTranche(), byAntigen: emptyAnt() };
      map.set(name, row);
    }
    for (const c of r.enfants) {
      row.identifies += 1;
      if (c.zero) row.zero += 1;
      if (c.sous) row.sous += 1;
      row.byTranche[c.tranche] += 1;
      for (const a of ANTIGENS) {
        if (c.missed[a.key]) { row.byAntigen[a.key] += 1; row.dosesManquees += 1; }
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.identifies - a.identifies);
}

function antigenMissed(records: IdentRecord[]): AntigenStat[] {
  return ANTIGENS.map((a) => {
    const missed = emptyTranche();
    for (const r of records) for (const c of r.enfants) if (c.missed[a.key]) missed[c.tranche] += 1;
    const missedTotal = TRK.reduce((s, t) => s + missed[t], 0);
    return { key: a.key, label: a.label, missed, missedTotal, recovered: emptyTranche(), recoveredTotal: 0, taux: null };
  });
}

/* ------------------------------ Résultats ------------------------------ */
function aggResult(records: ResultRecord[], keyFn: (r: ResultRecord) => string, identBy: Map<string, number>, missedBy: Map<string, number>, zoneFn?: (r: ResultRecord) => string | null): ResultGeoRow[] {
  const map = new Map<string, ResultGeoRow>();
  for (const r of records) {
    const name = keyFn(r);
    if (!name) continue;
    let row = map.get(name);
    if (!row) {
      row = { name, zone: zoneFn ? zoneFn(r) : undefined, byTranche: emptyTranche(), total: 0, identifies: 0, missed: 0, taux: null, byAntigen: emptyAnt() };
      map.set(name, row);
    }
    row.byTranche["0-11"] += r.t0;
    row.byTranche["12-23"] += r.t1;
    row.byTranche["24-59"] += r.t2;
    row.total += r.doses;
    for (const a of ANTIGENS) row.byAntigen[a.key] += r.byAnt[a.key].a0 + r.byAnt[a.key].a1 + r.byAnt[a.key].a2;
  }
  for (const row of map.values()) {
    row.identifies = identBy.get(norm(row.name)) ?? 0;
    row.missed = missedBy.get(norm(row.name)) ?? 0;
    row.taux = pct(row.total, row.missed);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

function antigenRecovered(records: ResultRecord[], identAnt: AntigenStat[]): AntigenStat[] {
  const identByKey = new Map(identAnt.map((a) => [a.key, a]));
  return ANTIGENS.map((a) => {
    const recovered = emptyTranche();
    for (const r of records) {
      recovered["0-11"] += r.byAnt[a.key].a0;
      recovered["12-23"] += r.byAnt[a.key].a1;
      recovered["24-59"] += r.byAnt[a.key].a2;
    }
    const recoveredTotal = TRK.reduce((s, t) => s + recovered[t], 0);
    const missedStat = identByKey.get(a.key);
    const missedTotal = missedStat?.missedTotal ?? 0;
    return {
      key: a.key, label: a.label,
      missed: missedStat?.missed ?? emptyTranche(), missedTotal,
      recovered, recoveredTotal, taux: pct(recoveredTotal, missedTotal),
    };
  });
}

/* ----------------------------- Supervision ----------------------------- */
function buildSuperv(records: SupervRecord[]): SupervBundle {
  const visites = records.length;
  const scores = records.map((r) => r.score).filter((s): s is number => s !== null);
  const scoreMoyen = scores.length ? r1(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const cotation = scoreMoyen !== null ? cotationFor(scoreMoyen) : null;

  const counts: Record<CotationLevel, number> = { tres_bon: 0, bon: 0, moyen: 0, faible: 0 };
  for (const sc of scores) counts[cotationFor(sc)] += 1;
  const cotations = COTATION_ORDER.map((level) => ({
    level, label: COTATION_LABEL[level], count: counts[level],
    pct: scores.length ? Math.round((counts[level] / scores.length) * 100) : 0, color: COTATION_COLOR[level],
  }));

  const qKeys = records.length ? Object.keys(records[0].answers) : [];
  const questions = qKeys.map((q) => {
    let oui = 0, non = 0, na = 0;
    for (const r of records) {
      const v = r.answers[q];
      if (v === "Oui") oui++; else if (v === "Non") non++; else na++;
    }
    return { question: q, oui, non, na, pct: pct(oui, oui + non) };
  });

  const diffMap = new Map<string, number>();
  for (const r of records) for (const d of r.difficultes) diffMap.set(d, (diffMap.get(d) ?? 0) + 1);
  const difficultes = Array.from(diffMap.entries())
    .map(([name, count]) => ({ name, count, pct: visites ? Math.round((count / visites) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);

  const aireMap = new Map<string, { zone: string | null; scores: number[]; visites: number }>();
  for (const r of records) {
    const k = r.aire ?? "—";
    if (!aireMap.has(k)) aireMap.set(k, { zone: r.zone, scores: [], visites: 0 });
    const e = aireMap.get(k)!;
    e.visites += 1;
    if (r.score !== null) e.scores.push(r.score);
  }
  const perAire = Array.from(aireMap.entries()).map(([name, e]) => ({
    name, zone: e.zone, visites: e.visites,
    score: e.scores.length ? r1(e.scores.reduce((a, b) => a + b, 0) / e.scores.length) : null,
  })).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  const sites = new Set(records.map((r) => norm(r.site ?? ""))).size;
  return { visites, sites, scoreMoyen, cotation, cotations, questions, difficultes, perAire };
}

/* ------------------------------ Bundle ------------------------------ */
export function buildBundle(data: SavSeed, filters: Filters, meta: { live: boolean; generatedAt: string }): SavBundle {
  const f = filters;
  // Déduplication (spec 01) : 1 seul formulaire par aire de santé pour
  // l'identification (CS/relais) et la planification. Résultats et supervision
  // ne sont PAS dédupliqués (plusieurs sessions/visites par aire sont légitimes).
  const identCs = dedupeByAire(data.identCs.filter((r) => matches(r, f)), (r) => r.enfants.length);
  const identRel = dedupeByAire(data.identRelais.filter((r) => matches(r, f)), (r) => r.enfants.length);
  const planif = dedupeByAire(data.planif.filter((r) => matches(r, f)), (r) => r.sessionsPlan);
  const resultats = data.resultats.filter((r) => matches(r, f));
  const superv = data.superv.filter((r) => matches(r, f));

  // Identification CS (référence pour les taux de récupération).
  const csByZone = aggMissed(identCs, (r) => r.zone ?? "—");
  const csByAire = aggMissed(identCs, (r) => r.aire ?? "—", (r) => r.zone);
  const csAntigens = antigenMissed(identCs);
  const csTop = [...csByAire].sort((a, b) => b.identifies - a.identifies).slice(0, 5);

  const relByZone = aggMissed(identRel, (r) => r.zone ?? "—");
  const relByAire = aggMissed(identRel, (r) => r.aire ?? "—", (r) => r.zone);
  const relAntigens = antigenMissed(identRel);
  const relTop = [...relByAire].sort((a, b) => b.identifies - a.identifies).slice(0, 5);
  const relaisActifs = new Set(identRel.map((r) => norm(r.structure ?? r.village ?? ""))).size;

  // Identifiés (enfants) et doses manquées par aire/zone — clé normalisée.
  const identByAire = new Map<string, number>();
  const missedByAire = new Map<string, number>();
  for (const row of csByAire) { identByAire.set(norm(row.name), row.identifies); missedByAire.set(norm(row.name), row.dosesManquees); }
  const identByZone = new Map<string, number>();
  const missedByZone = new Map<string, number>();
  for (const row of csByZone) { identByZone.set(norm(row.name), row.identifies); missedByZone.set(norm(row.name), row.dosesManquees); }

  const totalIdentifies = csByZone.reduce((s, r) => s + r.identifies, 0);
  const totalZero = csByZone.reduce((s, r) => s + r.zero, 0);
  const totalSous = csByZone.reduce((s, r) => s + r.sous, 0);
  const totalDosesManquees = csByZone.reduce((s, r) => s + r.dosesManquees, 0);

  // Résultats.
  const resByZone = aggResult(resultats, (r) => r.zone ?? "—", identByZone, missedByZone);
  const resByAire = aggResult(resultats, (r) => r.aire ?? "—", identByAire, missedByAire, (r) => r.zone);
  const resAntigens = antigenRecovered(resultats, csAntigens);
  const totalVaccines = resultats.reduce((s, r) => s + r.doses, 0);
  const parTranche = emptyTranche();
  for (const r of resultats) { parTranche["0-11"] += r.t0; parTranche["12-23"] += r.t1; parTranche["24-59"] += r.t2; }
  const tauxParZone = resByZone.map((z) => ({ name: z.name, taux: z.taux }));
  const topFaibles = [...resByAire].filter((a) => a.taux !== null).sort((a, b) => (a.taux ?? 0) - (b.taux ?? 0)).slice(0, 5);

  // Planification — toutes les aires connues (identification ∪ planification ∪ résultats).
  const aireZone = new Map<string, string | null>();
  const allAires = new Set<string>();
  const register = (name: string | null, zone: string | null) => {
    if (!name) return;
    allAires.add(name);
    if (!aireZone.has(norm(name))) aireZone.set(norm(name), zone);
  };
  for (const r of identCs) register(r.aire, r.zone);
  for (const r of identRel) register(r.aire, r.zone);
  for (const r of planif) register(r.aire, r.zone);
  for (const r of resultats) register(r.aire, r.zone);

  const planByAire = new Map<string, { sessions: number; avancees: number; mobiles: number; attendus: number }>();
  for (const r of planif) {
    const k = norm(r.aire ?? "");
    if (!k) continue;
    const e = planByAire.get(k) ?? { sessions: 0, avancees: 0, mobiles: 0, attendus: 0 };
    e.sessions += r.sessionsPlan; e.avancees += r.avancees; e.mobiles += r.mobiles; e.attendus += r.attendus;
    planByAire.set(k, e);
  }
  const planAires: PlanAireRow[] = dedupeLabels(Array.from(allAires)).map((aire) => {
    const k = norm(aire);
    const p = planByAire.get(k);
    const identifies = identByAire.get(k) ?? 0;
    const attendus = p?.attendus ?? 0;
    return {
      aire, zone: aireZone.get(k) ?? null,
      hasProgram: !!p && p.sessions > 0,
      sessions: p?.sessions ?? 0, avancees: p?.avancees ?? 0, mobiles: p?.mobiles ?? 0,
      attendus, identifies, ratio: pct(attendus, identifies),
    };
  }).sort((a, b) => Number(b.hasProgram) - Number(a.hasProgram) || b.sessions - a.sessions);

  const airesAvecProg = planAires.filter((a) => a.hasProgram).length;
  const totalSessions = planif.reduce((s, r) => s + r.sessionsPlan, 0);
  const totalAvancees = planif.reduce((s, r) => s + r.avancees, 0);
  const totalMobiles = planif.reduce((s, r) => s + r.mobiles, 0);
  const totalAttendus = planif.reduce((s, r) => s + r.attendus, 0);

  // Sessions par type (spec 02) : agréger directement depuis la sous-feuille
  // `sessions` (champ « Type de session ») pour ne dépendre d'aucun champ
  // calculé Kobo. Repli sur les champs parents si pas de sous-feuille.
  let sAv = 0, sMo = 0, sFx = 0;
  for (const p of planif) {
    if (p.sessions.length) {
      for (const ss of p.sessions) {
        const t = sessionType(ss.type);
        if (t === "avancee") sAv++; else if (t === "mobile") sMo++; else sFx++;
      }
    } else {
      sAv += p.avancees; sMo += p.mobiles;
      sFx += Math.max(0, p.sessionsPlan - p.avancees - p.mobiles);
    }
  }

  // Détail des sessions planifiées (table « détail des sessions », spec 03).
  const sessionDetails: PlanSessionDetail[] = [];
  for (const p of planif) {
    for (const ss of p.sessions) {
      const typeKey = sessionType(ss.type);
      sessionDetails.push({
        aire: p.aire ?? "—", zone: p.zone, n: ss.n,
        date: ss.date, type: ss.type,
        typeLabel: typeKey === "avancee" ? "Avancée" : typeKey === "mobile" ? "Mobile" : "Fixe",
        lieu: ss.lieu, attendus: ss.attendus,
      });
    }
  }
  sessionDetails.sort((a, b) =>
    (a.date ?? "").localeCompare(b.date ?? "") || a.aire.localeCompare(b.aire) || a.n - b.n,
  );

  // KPI synthèse.
  const kpi = {
    identifies: totalIdentifies,
    zeroDose: totalZero,
    sousVaccines: totalSous,
    dosesManquees: totalDosesManquees,
    identifiesRelais: relByZone.reduce((s, r) => s + r.identifies, 0),
    sessionsPlan: totalSessions,
    attendus: totalAttendus,
    ratioAttendus: pct(totalAttendus, totalIdentifies),
    airesPlanifiees: airesAvecProg,
    airesTotal: planAires.length,
    airesSansProgramme: planAires.length - airesAvecProg,
    vaccines: totalVaccines,
    tauxRecuperation: pct(totalVaccines, totalDosesManquees),
  };

  // Filtres / géo.
  const allRecords: GeoLike[] = [...data.identCs, ...data.identRelais, ...data.planif, ...data.resultats, ...data.superv];
  const geo = Array.from(new Map(allRecords.map((r) => {
    const key = [r.province, canonAntenne(r.antenne), r.zone, r.aire].join("|");
    return [key, { province: r.province, antenne: canonAntenne(r.antenne), zone: r.zone, aire: r.aire }];
  })).values());
  const months = Array.from(new Set(allRecords.map((r) => r.month).filter((m): m is string => !!m))).sort();

  return {
    meta: {
      generatedAt: meta.generatedAt,
      months: f.months && f.months.length ? f.months.slice().sort() : months,
      live: meta.live,
      sources: [
        { key: "ident_cs", label: "Identification IT", rows: identCs.length, ok: true },
        { key: "ident_relais", label: "Identification relais", rows: identRel.length, ok: true },
        { key: "planif", label: "Planification", rows: planif.length, ok: true },
        { key: "resultats", label: "Résultats", rows: resultats.length, ok: true },
        { key: "superv", label: "Supervision", rows: superv.length, ok: true },
      ],
    },
    filters: {
      provinces: dedupeLabels(geo.map((g) => g.province)),
      antennes: dedupeLabels(geo.map((g) => g.antenne)),
      zones: dedupeLabels(geo.map((g) => g.zone)),
      aires: dedupeLabels(geo.map((g) => g.aire)),
      months, geo,
    },
    kpi,
    cs: { byZone: csByZone, byAire: csByAire, antigens: csAntigens, topAires: csTop },
    relais: { byZone: relByZone, byAire: relByAire, antigens: relAntigens, topAires: relTop, relaisActifs },
    planif: {
      aires: planAires,
      proportionAvecProgramme: pct(airesAvecProg, planAires.length),
      sessionsParType: { fixe: sFx, avancee: sAv, mobile: sMo },
      sessionDetails,
      totalSessions, totalAttendus,
    },
    resultats: {
      byZone: resByZone, byAire: resByAire, antigens: resAntigens,
      tauxParZone, topFaibles, totalVaccines, parTranche,
    },
    superv: buildSuperv(superv),
  };
}
