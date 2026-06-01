/**
 * Configuration du tableau de bord SAV Tshuapa — Récupération des enfants en
 * conflit avec le calendrier vaccinal (Semaine Africaine de la Vaccination).
 *
 * 5 composantes (formulaires KoboToolbox du même projet que la supervision
 * conjointe — même TOKEN / username / instance) :
 *   1. Identification EZD & ESV par Centre de santé (IT)
 *   2. Identification EZD & ESV par les Relais communautaires
 *   3. Planification des sessions de vaccination
 *   4. Résultats de la vaccination par équipe
 *   5. Supervision des équipes
 */

export const KOBO_BASE_URL = "https://eu.kobotoolbox.org";

export type SavSourceKey = "ident_cs" | "ident_relais" | "planif" | "resultats" | "superv";

export interface SavSource {
  key: SavSourceKey;
  label: string;
  short: string;
  assetUid: string;
  exportUid: string;
}

/** Sources Kobo (export-settings XLSX figés fournis par le PEV/OMS Tshuapa). */
export const SAV_SOURCES: SavSource[] = [
  { key: "ident_cs", label: "SAV — Identification EZD & ESV par Centre de santé", short: "Identification IT", assetUid: "auKr7bzjsRNoohpveySTVA", exportUid: "esvjFiKSo7tfMQMcpxvrYga" },
  { key: "ident_relais", label: "SAV — Identification EZD & ESV par Relais", short: "Identification relais", assetUid: "asJpNSD7cpyqDyrkrUp7kL", exportUid: "esULo4gSfeEmuKBn4n3dgg5" },
  { key: "resultats", label: "SAV — Résultats vaccination par équipe", short: "Résultats", assetUid: "akKgEGx4H4ngXpf6jecCnG", exportUid: "esVv8TpVCDXyWzDy5reV3LE" },
  { key: "superv", label: "SAV — Supervision des équipes", short: "Supervision", assetUid: "aNbqyLNEssNK8SJjP5C52Z", exportUid: "esJpDYBSSBSB4GAFkxYWs4x" },
  { key: "planif", label: "SAV — Planification session de vaccination", short: "Planification", assetUid: "aTULFAgubcP55V7VsSbcer", exportUid: "esMPxESLfJK4Dsh4ediJdBb" },
];

export function koboExportUrl(src: { assetUid: string; exportUid: string }, base = KOBO_BASE_URL): string {
  return `${base}/api/v2/assets/${src.assetUid}/export-settings/${src.exportUid}/data.xlsx`;
}
export function koboDataUrl(src: { assetUid: string }, base = KOBO_BASE_URL): string {
  return `${base}/api/v2/assets/${src.assetUid}/data.json`;
}

/* ------------------------------- Antigènes ------------------------------- */
export interface Antigen {
  key: string;
  label: string;
  /** Libellé tel qu'utilisé dans le formulaire « Résultats » (colonnes tranche d'âge). */
  resLabel: string;
}

/** Ordre officiel du calendrier vaccinal (cf. formulaires SAV). */
export const ANTIGENS: Antigen[] = [
  { key: "bcg", label: "BCG", resLabel: "BCG" },
  { key: "vpo1", label: "VPO 1", resLabel: "VPO 1" },
  { key: "penta1", label: "Penta 1", resLabel: "Penta 1" },
  { key: "pcv1", label: "Pneumo 1", resLabel: "Pneumo 1" },
  { key: "rota1", label: "Rota 1", resLabel: "Rotasiil 1" },
  { key: "vpo2", label: "VPO 2", resLabel: "VPO 2" },
  { key: "penta2", label: "Penta 2", resLabel: "Penta 2" },
  { key: "pcv2", label: "Pneumo 2", resLabel: "Pneumo 2" },
  { key: "rota2", label: "Rota 2", resLabel: "Rotasiil 2" },
  { key: "vpo3", label: "VPO 3", resLabel: "VPO 3" },
  { key: "vpi1", label: "VPI 1", resLabel: "VPI 1" },
  { key: "penta3", label: "Penta 3", resLabel: "Penta 3" },
  { key: "pcv3", label: "Pneumo 3", resLabel: "Pneumo 3" },
  { key: "rota3", label: "Rota 3", resLabel: "Rotasiil 3" },
  { key: "vap1", label: "VAP 1", resLabel: "VAP 1" },
  { key: "vap2", label: "VAP 2", resLabel: "VAP 2" },
  { key: "vap3", label: "VAP 3", resLabel: "VAP 3" },
  { key: "vpi2", label: "VPI 2", resLabel: "VPI 2" },
  { key: "rr1", label: "VAR/RR 1", resLabel: "VAR/RR 1" },
  { key: "vaa", label: "VAA", resLabel: "VAA" },
  { key: "rr2", label: "VAR/RR 2", resLabel: "VAR/RR 2" },
  { key: "vap4", label: "VAP 4", resLabel: "VAP 4" },
];

export const ANTIGEN_LABEL: Record<string, string> = Object.fromEntries(ANTIGENS.map((a) => [a.key, a.label]));

/* ------------------------------ Tranches d'âge ---------------------------- */
export type TrancheKey = "0-11" | "12-23" | "24-59";
export interface Tranche {
  key: TrancheKey;
  label: string;
  short: string;
  color: string;
}
export const TRANCHES: Tranche[] = [
  { key: "0-11", label: "0 à 11 mois", short: "0–11 m", color: "#0093d5" },
  { key: "12-23", label: "12 à 23 mois", short: "12–23 m", color: "#7c3aed" },
  { key: "24-59", label: "24 à 59 mois", short: "24–59 m", color: "#f59e0b" },
];
export const TRANCHE_LABEL: Record<TrancheKey, string> = { "0-11": "0 à 11 mois", "12-23": "12 à 23 mois", "24-59": "24 à 59 mois" };

/* ----------------------- Seuils d'appréciation (taux) --------------------- */
export type CotationLevel = "tres_bon" | "bon" | "moyen" | "faible";
export const COTATION_THRESHOLDS: { level: CotationLevel; label: string; min: number; color: string }[] = [
  { level: "tres_bon", label: "Très bon", min: 90, color: "#1f9d57" },
  { level: "bon", label: "Bon", min: 75, color: "#0093d5" },
  { level: "moyen", label: "Moyen", min: 60, color: "#f59e0b" },
  { level: "faible", label: "Faible", min: 0, color: "#e23636" },
];
export function cotationFor(pct: number | null): CotationLevel {
  if (pct === null || !Number.isFinite(pct)) return "faible";
  for (const t of COTATION_THRESHOLDS) if (pct >= t.min) return t.level;
  return "faible";
}
export const COTATION_LABEL: Record<CotationLevel, string> = { tres_bon: "Très bon", bon: "Bon", moyen: "Moyen", faible: "Faible" };
export const COTATION_COLOR: Record<CotationLevel, string> = { tres_bon: "#1f9d57", bon: "#0093d5", moyen: "#f59e0b", faible: "#e23636" };
export const COTATION_ORDER: CotationLevel[] = ["tres_bon", "bon", "moyen", "faible"];

/** Seuils d'alerte (cf. modèle de rapport automatique SAV). */
export const ALERT_THRESHOLDS = {
  recuperationFaible: 50, // taux de récupération < 50 % → microplan de rattrapage
  planificationInsuffisante: 70, // attendus / identifiés < 70 %
};

/** Couleur d'un taux de récupération (%). */
export const tauxColor = (v: number | null): string => {
  if (v === null || !Number.isFinite(v)) return "#94a3b8";
  return v >= 90 ? "#1f9d57" : v >= 75 ? "#0093d5" : v >= 50 ? "#f59e0b" : "#e23636";
};
