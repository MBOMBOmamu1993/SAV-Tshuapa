/**
 * Normalisation des exports Kobo (XLSX multi-feuilles) vers le modèle SAV.
 * Réutilisé par le client live ; le seed est déjà au bon format.
 */
import { ANTIGENS, type TrancheKey } from "@/config/sav.config";
import type { ChildRecord, IdentRecord, PlanRecord, ResultRecord, SupervRecord, RawRow } from "./types";

export function s(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const t = String(v).trim();
  return t === "" ? null : t;
}
export function n(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  const x = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(x) ? x : 0;
}
export function monthOf(d: string | null): string | null {
  if (!d) return null;
  const m = d.match(/(\d{4})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}` : null;
}
export function trancheOf(age: number): TrancheKey {
  if (age <= 11) return "0-11";
  if (age <= 23) return "12-23";
  return "24-59";
}

/** Ordre des colonnes « X manqué ? » dans la sous-feuille « enfants ». */
const CHILD_ANT: [string, string][] = [
  ["BCG manqué ?", "bcg"], ["VPO 1 manqué ?", "vpo1"], ["Penta 1 manqué ?", "penta1"], ["Pneumo 1 manqué ?", "pcv1"],
  ["Rotasiil 1 manqué ?", "rota1"], ["VPO 2 manqué ?", "vpo2"], ["Penta 2 manqué ?", "penta2"], ["Pneumo 2 manqué ?", "pcv2"],
  ["Rotasiil 2 manqué ?", "rota2"], ["VPO 3 manqué ?", "vpo3"], ["VPI 1 manqué ?", "vpi1"], ["Penta 3 manqué ?", "penta3"],
  ["Pneumo 3 manqué ?", "pcv3"], ["Rotasiil 3 manqué ?", "rota3"], ["VAP 1 manqué ?", "vap1"], ["VAP 2 manqué ?", "vap2"],
  ["VAP 3 manqué ?", "vap3"], ["VPI 2 manqué ?", "vpi2"], ["VAR/RR 1 manqué ?", "rr1"], ["VAA manqué ?", "vaa"],
  ["VAR/RR 2 manqué ?", "rr2"], ["VAP 4 manqué ?", "vap4"],
];

function pick(r: RawRow, keys: string[]): unknown {
  for (const k of keys) if (r[k] !== undefined && r[k] !== null && r[k] !== "") return r[k];
  return null;
}

export function normalizeIdent(parents: RawRow[], children: RawRow[], source: "cs" | "relais"): IdentRecord[] {
  const by = new Map<string, RawRow[]>();
  for (const c of children) {
    const uu = s(c["_submission__uuid"]) ?? "";
    if (!by.has(uu)) by.set(uu, []);
    by.get(uu)!.push(c);
  }
  return parents.map((p) => {
    const uu = s(p["_uuid"]) ?? "";
    const enfants: ChildRecord[] = (by.get(uu) ?? []).map((c) => {
      const missed: Record<string, boolean> = {};
      for (const [h, k] of CHILD_ANT) missed[k] = s(c[h]) === "Oui";
      const age = n(pick(c, ["Âge de l’enfant (en mois)", "Âge de l’enfant en mois"]));
      return {
        age, tranche: trancheOf(age), sexe: s(c["Sexe"]),
        missed, zero: !!missed["penta1"], sous: !!missed["penta3"] && !missed["penta1"],
      };
    });
    const date = s(pick(p, ["Date d’identification", "Date de la visite", "today"]));
    return {
      source,
      province: s(p["Province"]), antenne: s(p["Antenne PEV"]),
      zone: s(p["Zone de santé"]), aire: s(p["Aire de santé"]),
      structure: s(pick(p, ["ESS / Centre de santé", "Nom du village"])),
      village: s(p["Nom du village"]),
      date, month: monthOf(date),
      totalIdentifies: n(p["total_enfants_identifies"]),
      totalZero: n(p["total_zero_dose"]),
      totalSous: n(p["total_sous_vaccines"]),
      enfants,
    };
  });
}

export function normalizePlan(parents: RawRow[], sessions: RawRow[]): PlanRecord[] {
  const by = new Map<string, RawRow[]>();
  for (const c of sessions) {
    const uu = s(c["_submission__uuid"]) ?? "";
    if (!by.has(uu)) by.set(uu, []);
    by.get(uu)!.push(c);
  }
  return parents.map((p) => {
    const uu = s(p["_uuid"]) ?? "";
    const sess = (by.get(uu) ?? []).map((c) => ({
      n: n(c["N°"]), date: s(c["Date prévue pour la session"]), type: s(c["Type de session"]),
      lieu: s(c["Nom du lieu ou du site où la session sera implantée"]),
      attendus: n(c["Nombre total d’enfants attendus"]),
      equipe: s(c["Noms des membres de l’équipe de vaccination"]),
    }));
    const date = s(p["today"]);
    return {
      province: s(p["Province"]), antenne: s(p["Antenne PEV"]),
      zone: s(p["Zone de santé"]), aire: s(p["Aire de santé"]),
      date, month: monthOf(date),
      sessionsPlan: n(p["total_sessions_planifiees"]),
      attendus: n(p["total_enfants_attendus"]),
      avancees: n(p["total_sessions_avancees"]),
      mobiles: n(p["total_sessions_mobiles"]),
      sessions: sess,
    };
  });
}

export function normalizeResult(rows: RawRow[]): ResultRecord[] {
  return rows.map((p) => {
    const byAnt: Record<string, { a0: number; a1: number; a2: number }> = {};
    for (const a of ANTIGENS) {
      byAnt[a.key] = {
        a0: n(p[`${a.resLabel} — 0 à 11 mois`]),
        a1: n(p[`${a.resLabel} — 12 à 23 mois`]),
        a2: n(p[`${a.resLabel} — 24 à 59 mois`]),
      };
    }
    const date = s(pick(p, ["Date de la session", "today"]));
    return {
      province: s(p["Province"]), antenne: s(p["Antenne PEV"]),
      zone: s(p["Zone de santé"]), aire: s(p["Aire de santé"]),
      site: s(p["Nom du site"]), typeSession: s(p["Type de session"]),
      vaccinateur: s(p["Nom du vaccinateur"]), date, month: monthOf(date),
      t0: n(p["total_0_11"]), t1: n(p["total_12_23"]), t2: n(p["total_24_59"]),
      doses: n(p["total_doses"]), byAnt,
    };
  });
}

const SUP_YESNO = [
  "Le site figure-t-il dans le plan de récupération ?", "Les listes des enfants à récupérer sont-elles disponibles ?",
  "Vaccinateur présent ?", "Pointeur/enregistreur présent ?", "Mobilisateur/RECO présent ?",
  "La PCV des vaccins est-elle bonne ?", "Les accumulateurs sont-ils correctement conditionnés ?",
  "Les vaccins sont-ils correctement conservés ?", "Le porte-vaccins est-il bien fermé et à l’ombre ?",
  "Les parents sont-ils bien accueillis ?", "Les parents reçoivent-ils des explications sur les vaccins ?",
  "Les rendez-vous sont-ils donnés aux parents  ?", "Les enfants récupérés nécessitant un suivi sont-ils identifiés ?",
  "Respect du calendrier vaccinal", "Respect des voies d’administration", "Respect des sites d’injection",
  "Les seringues sont-elles recapuchonnées ?", "Fiches de pointage disponibles ?", "Registre de vaccination disponible ?",
  "Les RECO sont-ils présents ?", "La sensibilisation communautaire a-t-elle été réalisée ?", "La recherche active des enfants est-elle réalisée ?",
];
const SUP_DIFF = ["Rupture de vaccins", "Insuffisance des intrants", "Faible mobilisation", "Difficulté d’accès", "Retard de l’équipe", "Refus des parents", "Problème de transport", "Problème ODK", "Autre"];

export function normalizeSuperv(rows: RawRow[]): SupervRecord[] {
  return rows.map((p) => {
    let oui = 0, non = 0;
    const answers: Record<string, string | null> = {};
    for (const q of SUP_YESNO) {
      const v = s(p[q]);
      answers[q] = v;
      if (v === "Oui") oui++;
      else if (v === "Non") non++;
    }
    const difficultes = SUP_DIFF.filter((d) => n(p[`Difficultés rencontrées/${d}`]) === 1);
    const score = oui + non > 0 ? Math.round((oui / (oui + non)) * 1000) / 10 : null;
    const date = s(pick(p, ["* Date de supervision", "Date de soumission", "today"]));
    return {
      province: s(pick(p, ["* Province", "Province"])), antenne: s(pick(p, ["* Antenne PEV", "Antenne PEV"])),
      zone: s(pick(p, ["* Zone de Santé", "Zone de santé"])), aire: s(pick(p, ["* Aire de Santé", "Aire de santé"])),
      site: s(p["* Nom du site supervisé"]), typeSite: s(p["* Type de site"]),
      date, month: monthOf(date), superviseur: s(pick(p, ["* Nom du superviseur ", "Nom du superviseur"])),
      score, oui, non, answers, difficultes,
    };
  });
}
