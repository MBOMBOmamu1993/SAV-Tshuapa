/* =========================================================================
   report-data.ts — Types + construction dynamique du rapport automatique SAV.
   Le moteur de rendu (lib/reports/pptx.ts) est réutilisé tel quel.
   Contenu calqué sur le modèle PDF « Rapport automatique SAV ».
   ========================================================================= */
import { ANTIGENS, TRANCHES } from "@/config/sav.config";
import type { SavBundle } from "@/lib/sav/types";

/* ----------------------------- Palette PEV/OMS ---------------------------- */
export const PAL = {
  marine: "00205c", marine2: "013a86", cyan: "0093d5", vert: "1f9d57", bleu: "0093d5",
  jaune: "f59e0b", rouge: "e23636", bordeaux: "7b2d3a", gris: "94a3b8", grisClair: "e2e8f0",
  ink: "16243d", muted: "5b6b86", line: "e3e9f2", soft: "f4f7fb", white: "FFFFFF", amberText: "b06f00",
} as const;

/** Couleur d'un taux de récupération (%). */
export const scoreColor = (v: number): string => (v >= 90 ? PAL.vert : v >= 75 ? PAL.bleu : v >= 50 ? PAL.jaune : PAL.rouge);
export const concColor = (v: number): string => (v >= 95 && v <= 105 ? PAL.vert : v < 95 ? PAL.jaune : PAL.rouge);

/* --------------------------------- Types ---------------------------------- */
export type Tone = "blue" | "red" | "green" | "amber";
export type NoteKind = "read" | "warn" | "alert";
export type PillTone = "green" | "amber" | "red" | "blue";

export interface Pill { pill: true; t: string; c: PillTone }
export type Cell = string | Pill;
export interface Row { cells: Cell[]; total?: boolean }
export interface Table { cols: string[]; rows: Row[] }
export interface Kpi { v: string; l: string; s?: string; tone?: Tone }
export interface Bar { l: string; v: number; l2?: string; c?: string }
export interface Series { name: string; color: string; values: number[] }
export interface Grouped { cats: string[]; series: Series[] }
export type ColorToken = "score" | "conc" | "cyan";
export interface ChartOpt { max?: number; unit?: string; colorFn?: ColorToken }
export type SideBlock =
  | { kind: "table"; table: Table }
  | { kind: "kpis"; items: Kpi[] }
  | { kind: "legend"; h: string; p: string };

export interface Slide {
  type: "cover" | "exec" | "barSide" | "bigBar" | "table" | "tableBar" | "gauges" | "hbarList" | "funnel" | "matrix" | "process" | "conclusion";
  tag?: string; title: string; sub?: string; no?: string;
  kicker?: string; meta?: string[]; kpis?: Kpi[]; src?: string;
  message?: string; cols?: { h: string; items: string[] }[]; lead?: string;
  chartTitle?: string; bars?: Bar[]; grouped?: Grouped; chartOpt?: ChartOpt;
  side?: SideBlock[]; tableTitle?: string; tableCols?: string[]; tableRows?: Row[];
  cols2?: string[]; rows?: Row[]; extra?: { tables?: Table[]; legend?: { h: string; p: string } };
  gauges?: { v: number; l: string; fn?: ColorToken }[];
  lists?: { h: string; data: Bar[]; opt?: { colorFn?: ColorToken; max?: number } }[];
  fSteps?: { l: string; v: string; c?: string }[]; fTable?: Table;
  cells?: { h: string; p: string; act: string; color: string }[];
  pSteps?: { h: string; p: string }[]; sources?: { h: string; p: string }[];
  points?: string[]; outputs?: { h: string; cols: string[]; rows: Row[] };
  note?: string; noteKind?: NoteKind;
}

export interface Deck { period: string; gen: string; footer: string; fileLabel: string; slides: Slide[] }

/* ------------------------------- Raccourcis ------------------------------- */
const pill = (t: string, c: PillTone): Pill => ({ pill: true, t, c });
const row = (...cells: Cell[]): Row => ({ cells });
const totalRow = (...cells: Cell[]): Row => ({ cells, total: true });
const P = PAL;
const num = (n: number) => n.toLocaleString("fr-FR");
const pc = (v: number | null) => (v === null ? "—" : `${v} %`);

/* ========================================================================= */
/*                  CONSTRUCTION DU DECK SAV (dynamique)                      */
/* ========================================================================= */
export function buildSavDeck(b: SavBundle, period: string): Deck {
  const k = b.kpi;
  const footer = "Récupération des enfants en conflit avec le calendrier vaccinal — SAV Tshuapa";

  // Antigènes les plus manqués (identification CS).
  const antSorted = [...b.cs.antigens].sort((a, x) => x.missedTotal - a.missedTotal);
  const topAnt = antSorted.slice(0, 2).map((a) => a.label).join(" et ") || "—";
  const faibles = b.resultats.topFaibles.slice(0, 3).map((a) => a.name).join(", ") || "—";

  const slides: Slide[] = [];

  /* 01 — Couverture */
  slides.push({
    type: "cover", tag: "Couverture", kicker: "RAPPORT AUTOMATIQUE · SAV",
    title: "Récupération des enfants en conflit avec le calendrier vaccinal — Tshuapa",
    meta: [`Province : Tshuapa  ·  ${b.filters.zones.join(" & ") || "Toutes zones"}`, `Période : ${period}  ·  Semaine Africaine de la Vaccination`],
    kpis: [
      { v: num(k.identifies), l: "Enfants identifiés" },
      { v: num(k.vaccines), l: "Doses récupérées" },
      { v: pc(k.tauxRecuperation), l: "Taux récupération" },
      { v: String(k.airesSansProgramme), l: "AS non planifiées" },
    ],
    src: "Source : exports ODK / KoboToolbox (5 formulaires SAV) · Généré automatiquement",
  });

  /* 02 — Synthèse exécutive */
  slides.push({
    type: "exec", tag: "Synthèse", title: "Synthèse exécutive automatique",
    sub: "Vue d'ensemble de l'identification, de la planification et de la récupération",
    kpis: [
      { v: num(k.identifies), l: "Enfants identifiés", s: "centres de santé", tone: "blue" },
      { v: num(k.zeroDose), l: "Zéro dose", s: "PENTA 1 non reçu", tone: "red" },
      { v: num(k.sousVaccines), l: "Sous-vaccinés", s: "PENTA 3 non reçu", tone: "amber" },
      { v: num(k.dosesManquees), l: "Doses manquées", s: "toutes valences", tone: "amber" },
      { v: num(k.sessionsPlan), l: "Sessions planifiées", s: `${num(k.attendus)} attendus`, tone: "blue" },
      { v: `${k.airesPlanifiees}/${k.airesTotal}`, l: "AS avec programme", s: pc(b.planif.proportionAvecProgramme), tone: k.airesSansProgramme ? "amber" : "green" },
      { v: num(k.vaccines), l: "Doses récupérées", s: "doses administrées", tone: "green" },
      { v: pc(k.tauxRecuperation), l: "Taux récupération", s: "doses récup. / manquées", tone: (k.tauxRecuperation ?? 0) >= 75 ? "green" : "amber" },
    ],
    message: `${num(k.identifies)} enfants ont été identifiés en conflit avec le calendrier vaccinal (${num(k.zeroDose)} zéro dose, ${num(k.sousVaccines)} sous-vaccinés). Les antigènes les plus manqués sont ${topAnt}. ${pc(b.planif.proportionAvecProgramme)} des aires de santé disposent d'un programme de récupération ; le taux global de récupération atteint ${pc(k.tauxRecuperation)}.`,
    noteKind: k.airesSansProgramme > 0 ? "warn" : "read",
    cols: [
      { h: "Lecture automatique", items: [
        "Identifier les zones concentrant les enfants manqués.",
        "Vérifier la cohérence identifiés / attendus.",
        "Comparer les taux par antigène et tranche d'âge.",
        "Déclencher les alertes AS non planifiées / faible taux.",
      ] },
      { h: "Alertes clés", items: [
        `Récupération faible (< 50 %) : ${pc(k.tauxRecuperation)}.`,
        `Planification (< 70 %) : ratio ${pc(k.ratioAttendus)}.`,
        `AS sans programme : ${k.airesSansProgramme}.`,
        `Antigènes critiques : ${topAnt}.`,
      ] },
    ],
  });

  /* 03 — Identification IT : enfants manqués par ZS */
  slides.push({
    type: "bigBar", tag: "Identification IT", title: "Identification au centre de santé par les IT",
    sub: "Enfants manqués par zone de santé",
    chartTitle: "Enfants manqués identifiés par zone de santé",
    bars: b.cs.byZone.slice(0, 12).map((z) => ({ l: z.name, v: z.identifies, c: P.cyan })),
    chartOpt: { max: Math.max(10, ...b.cs.byZone.map((z) => z.identifies)) },
    note: `La zone de santé de ${b.cs.byZone[0]?.name ?? "—"} concentre ${b.cs.byZone[0]?.identifies ?? 0} enfants manqués. Les antigènes les plus manqués sont ${topAnt}. Aires à prioriser : ${b.cs.topAires.slice(0, 3).map((a) => a.name).join(", ") || "—"}.`,
    noteKind: "read",
  });

  /* 04 — Identification IT : doses manquées par antigène */
  slides.push({
    type: "bigBar", tag: "Identification IT", title: "Doses manquées par antigène (centres de santé)",
    sub: "Toutes tranches d'âge confondues",
    chartTitle: "Nombre de doses manquées par antigène",
    bars: antSorted.slice(0, 14).map((a) => ({ l: a.label, v: a.missedTotal, c: P.rouge })),
    chartOpt: { max: Math.max(5, ...antSorted.map((a) => a.missedTotal)) },
    note: `Les valences les plus manquées appellent un briefing des vaccinateurs sur le calendrier et la vérification de la disponibilité des doses.`,
    noteKind: "warn",
  });

  /* 05 — Top 5 AS manquées (IT) + relais */
  slides.push({
    type: "hbarList", tag: "Priorisation", title: "Aires de santé prioritaires — enfants manqués",
    lists: [
      { h: "Top 5 AS — centres de santé (IT)", data: b.cs.topAires.slice(0, 5).map((a) => ({ l: a.name, v: a.identifies })), opt: { colorFn: "cyan", max: Math.max(5, ...b.cs.topAires.map((a) => a.identifies)) } },
      { h: "Top 5 AS — relais communautaires", data: b.relais.topAires.slice(0, 5).map((a) => ({ l: a.name, v: a.identifies })), opt: { colorFn: "cyan", max: Math.max(5, ...b.relais.topAires.map((a) => a.identifies), 1) } },
    ],
    note: `Les relais ont identifié ${num(k.identifiesRelais)} enfants supplémentaires (${b.relais.relaisActifs} relais actifs). Toute discordance IT/relais déclenche une validation conjointe.`,
    noteKind: "read",
  });

  /* 06 — Planification */
  const sansProg = b.planif.aires.filter((a) => !a.hasProgram).slice(0, 8);
  slides.push({
    type: "tableBar", tag: "Planification", title: "Planification de la récupération",
    sub: "Aires de santé avec / sans programme et sessions prévues",
    tableTitle: "Aires de santé sans programme (à planifier)",
    tableCols: ["Aire de santé", "Zone", "Identifiés"],
    tableRows: sansProg.length ? sansProg.map((a) => row(a.aire, a.zone ?? "—", String(a.identifies))) : [row("Toutes les AS sont planifiées", "—", "—")],
    chartTitle: "Sessions prévues par type",
    bars: [
      { l: "Fixe", v: b.planif.sessionsParType.fixe, c: P.bleu },
      { l: "Avancée", v: b.planif.sessionsParType.avancee, c: P.vert },
      { l: "Mobile", v: b.planif.sessionsParType.mobile, c: P.jaune },
    ],
    chartOpt: { max: Math.max(5, b.planif.totalSessions) },
    note: `${pc(b.planif.proportionAvecProgramme)} des aires de santé disposent d'un programme (${k.airesPlanifiees}/${k.airesTotal}). ${k.airesSansProgramme} AS sans programme doivent être planifiées avant le démarrage.`,
    noteKind: k.airesSansProgramme > 0 ? "alert" : "read",
  });

  /* 07 — Résultats : taux de récupération par zone */
  slides.push({
    type: "bigBar", tag: "Résultats", title: "Résultats de la récupération — taux par zone de santé",
    sub: "Enfants vaccinés / enfants identifiés",
    chartTitle: "Taux de récupération par zone de santé (%)",
    bars: b.resultats.tauxParZone.filter((z) => z.taux !== null).map((z) => ({ l: z.name, v: z.taux as number })),
    chartOpt: { max: 100, colorFn: "score" },
    note: `Taux global de récupération : ${pc(k.tauxRecuperation)} (${num(k.vaccines)} enfants vaccinés). Les faibles performances concernent ${faibles}.`,
    noteKind: (k.tauxRecuperation ?? 0) < 50 ? "alert" : "read",
  });

  /* 08 — Résultats : taux par aire (top faibles) */
  slides.push({
    type: "table", tag: "Résultats", title: "Aires de santé à faible performance",
    chartTitle: "Top 5 des aires au taux de récupération le plus faible",
    cols2: ["Aire de santé", "Zone", "Doses récup.", "Doses manquées", "Taux récup."],
    rows: b.resultats.topFaibles.length
      ? b.resultats.topFaibles.map((a) => row(a.name, a.zone ?? "—", String(a.total), String(a.missed || "—"), { pill: true, t: a.taux === null ? "—" : `${a.taux} %`, c: (a.taux ?? 0) >= 75 ? "green" : (a.taux ?? 0) >= 50 ? "amber" : "red" }))
      : [row("Aucune donnée de résultat", "—", "—", "—", "—")],
    note: "Pour chaque AS à faible taux : analyser les causes (refus, absence, distance, rupture, faible mobilisation) et organiser une session avancée/mobile dans les 7 jours.",
    noteKind: "warn",
  });

  /* 09 — Supervision & qualité */
  const diff = b.superv.difficultes.slice(0, 6);
  slides.push({
    type: "tableBar", tag: "Qualité", title: "Contrôle qualité et supervision des équipes",
    sub: "Constats terrain et score qualité",
    tableTitle: "Principales difficultés rencontrées",
    tableCols: ["Difficulté", "Sites", "%"],
    tableRows: diff.length ? diff.map((x) => row(x.name, String(x.count), `${x.pct} %`)) : [row("Aucune difficulté signalée", "—", "—")],
    chartTitle: "Score qualité — appréciation des sites",
    bars: b.superv.cotations.map((c) => ({ l: c.label, v: c.count, c: c.color.replace("#", "") })),
    chartOpt: { max: Math.max(2, ...b.superv.cotations.map((c) => c.count)) },
    note: `${b.superv.visites} visites de supervision sur ${b.superv.sites} sites. Score qualité moyen : ${pc(b.superv.scoreMoyen)}. Score = réponses « Oui » / questions applicables × 100.`,
    noteKind: "read",
  });

  /* 10 — Recommandations opérationnelles (matrice) */
  slides.push({
    type: "matrix", tag: "Recommandations", title: "Recommandations opérationnelles automatiques",
    cells: [
      { h: "AS avec beaucoup d'enfants manqués", p: "Organiser une session avancée ou mobile dans les 7 jours.", act: "Microplan ciblé", color: P.marine },
      { h: "Taux de récupération < 50 %", p: "Analyser les causes : refus, absence, distance, rupture, faible mobilisation.", act: "Analyse des causes", color: P.rouge },
      { h: "Antigène très manqué", p: "Briefer les équipes sur le calendrier et vérifier la disponibilité des doses.", act: "Briefing vaccinateurs", color: P.bleu },
      { h: "AS sans programme / discordance IT-relais", p: "Compléter le microplan, renseigner la date et organiser une validation conjointe.", act: "Validation conjointe", color: P.vert },
    ],
    note: "Valider les données ODK chaque jour, rafraîchir le tableau de bord, puis générer automatiquement le PowerPoint pour le briefing de coordination.",
    noteKind: "read",
  });

  /* 11 — Narration & conclusion */
  slides.push({
    type: "conclusion", tag: "Conclusion", title: "Narration automatique & décisions",
    points: [
      `Situation : ${num(k.identifies)} enfants identifiés, dont ${num(k.zeroDose)} zéro dose et ${num(k.sousVaccines)} sous-vaccinés.`,
      `Planification : ${pc(b.planif.proportionAvecProgramme)} des AS disposent d'un programme ; ${k.airesSansProgramme} AS à prioriser.`,
      `Résultats : taux global de récupération de ${pc(k.tauxRecuperation)} ; faibles performances à ${faibles}.`,
      "Décision : renforcer la microplanification, organiser des sessions avancées/mobiles ciblées et intensifier la recherche active communautaire.",
    ],
    outputs: {
      h: "Sorties automatiques et utilisation",
      cols: ["Sortie", "Utilisation"],
      rows: [
        row("Top 5 AS manquées", "Priorisation terrain"),
        row("Antigènes critiques", "Briefing vaccinateurs"),
        row("AS sans programme", "Planification immédiate"),
        row("AS à faible taux", "Supervision ciblée"),
      ],
    },
    note: "Rapport généré automatiquement à partir des données validées — extraction → calcul des indicateurs → mise à jour des visuels → export PowerPoint.",
    noteKind: "read",
  });

  return { period, gen: new Date().toISOString(), footer, fileLabel: "SAV Tshuapa", slides };
}
