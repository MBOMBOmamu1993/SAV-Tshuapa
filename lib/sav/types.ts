import type { TrancheKey, CotationLevel } from "@/config/sav.config";

export type RawRow = Record<string, unknown>;

/* ----------------------- Modèle normalisé (seed + live) ----------------------- */

export interface ChildRecord {
  age: number;
  tranche: TrancheKey;
  sexe: string | null;
  /** Antigène manqué ? (clé antigène → vrai si dose manquée). */
  missed: Record<string, boolean>;
  zero: boolean;
  sous: boolean;
}

export interface IdentRecord {
  source: "cs" | "relais";
  province: string | null;
  antenne: string | null;
  zone: string | null;
  aire: string | null;
  structure: string | null;
  village: string | null;
  date: string | null;
  month: string | null;
  totalIdentifies: number;
  totalZero: number;
  totalSous: number;
  enfants: ChildRecord[];
}

export interface PlanSession {
  n: number;
  date: string | null;
  type: string | null;
  lieu: string | null;
  attendus: number;
  equipe: string | null;
}
export interface PlanRecord {
  province: string | null;
  antenne: string | null;
  zone: string | null;
  aire: string | null;
  date: string | null;
  month: string | null;
  sessionsPlan: number;
  attendus: number;
  avancees: number;
  mobiles: number;
  sessions: PlanSession[];
}

export interface ResultRecord {
  province: string | null;
  antenne: string | null;
  zone: string | null;
  aire: string | null;
  site: string | null;
  typeSession: string | null;
  vaccinateur: string | null;
  date: string | null;
  month: string | null;
  t0: number;
  t1: number;
  t2: number;
  doses: number;
  /** Par antigène → doses par tranche d'âge. */
  byAnt: Record<string, { a0: number; a1: number; a2: number }>;
}

export interface SupervRecord {
  province: string | null;
  antenne: string | null;
  zone: string | null;
  aire: string | null;
  site: string | null;
  typeSite: string | null;
  date: string | null;
  month: string | null;
  superviseur: string | null;
  score: number | null;
  oui: number;
  non: number;
  answers: Record<string, string | null>;
  difficultes: string[];
}

export interface SavSeed {
  identCs: IdentRecord[];
  identRelais: IdentRecord[];
  planif: PlanRecord[];
  resultats: ResultRecord[];
  superv: SupervRecord[];
  generatedAt?: string;
}

/* ------------------------------- Bundle (API) ------------------------------- */

export interface AntigenStat {
  key: string;
  label: string;
  /** Doses manquées par tranche (identification). */
  missed: Record<TrancheKey, number>;
  missedTotal: number;
  /** Doses récupérées par tranche (résultats). */
  recovered: Record<TrancheKey, number>;
  recoveredTotal: number;
  /** Taux de récupération = récupérés / manqués × 100. */
  taux: number | null;
}

export interface GeoMissedRow {
  name: string;
  zone?: string | null;
  identifies: number;
  zero: number;
  sous: number;
  dosesManquees: number;
  byTranche: Record<TrancheKey, number>;
  byAntigen: Record<string, number>;
}

export interface PlanAireRow {
  aire: string;
  zone: string | null;
  hasProgram: boolean;
  sessions: number;
  avancees: number;
  mobiles: number;
  attendus: number;
  identifies: number;
  ratio: number | null;
}

export interface PlanSessionDetail {
  aire: string;
  zone: string | null;
  n: number;
  date: string | null;
  /** Type brut (« Type de session » Kobo). */
  type: string | null;
  /** Type normalisé pour l'affichage : Avancée / Mobile / Fixe. */
  typeLabel: string;
  lieu: string | null;
  attendus: number;
}

export interface ResultGeoRow {
  name: string;
  zone?: string | null;
  byTranche: Record<TrancheKey, number>;
  /** Doses récupérées (administrées). */
  total: number;
  /** Enfants identifiés (registre IT) — contexte. */
  identifies: number;
  /** Doses manquées (dénominateur du taux). */
  missed: number;
  /** Taux de récupération = doses récupérées / doses manquées × 100. */
  taux: number | null;
  byAntigen: Record<string, number>;
}

export interface SupervBundle {
  visites: number;
  sites: number;
  scoreMoyen: number | null;
  cotation: CotationLevel | null;
  cotations: { level: CotationLevel; label: string; count: number; pct: number; color: string }[];
  questions: { question: string; oui: number; non: number; na: number; pct: number | null }[];
  difficultes: { name: string; count: number; pct: number }[];
  perAire: { name: string; zone: string | null; score: number | null; visites: number }[];
}

export interface SavKpi {
  identifies: number;
  zeroDose: number;
  sousVaccines: number;
  dosesManquees: number;
  identifiesRelais: number;
  sessionsPlan: number;
  attendus: number;
  ratioAttendus: number | null;
  airesPlanifiees: number;
  airesTotal: number;
  airesSansProgramme: number;
  vaccines: number;
  tauxRecuperation: number | null;
}

export interface SavBundle {
  meta: {
    generatedAt: string;
    months: string[];
    live: boolean;
    sources: { key: string; label: string; rows: number; ok: boolean; error?: string }[];
  };
  filters: {
    provinces: string[];
    antennes: string[];
    zones: string[];
    aires: string[];
    months: string[];
    geo: { province: string | null; antenne: string | null; zone: string | null; aire: string | null }[];
  };
  kpi: SavKpi;
  /** Identification au CS (par les IT). */
  cs: {
    byZone: GeoMissedRow[];
    byAire: GeoMissedRow[];
    antigens: AntigenStat[];
    topAires: GeoMissedRow[];
  };
  /** Identification communautaire (relais). */
  relais: {
    byZone: GeoMissedRow[];
    byAire: GeoMissedRow[];
    antigens: AntigenStat[];
    topAires: GeoMissedRow[];
    relaisActifs: number;
  };
  /** Planification. */
  planif: {
    aires: PlanAireRow[];
    proportionAvecProgramme: number | null;
    sessionsParType: { fixe: number; avancee: number; mobile: number };
    sessionDetails: PlanSessionDetail[];
    totalSessions: number;
    totalAttendus: number;
  };
  /** Résultats. */
  resultats: {
    byZone: ResultGeoRow[];
    byAire: ResultGeoRow[];
    antigens: AntigenStat[];
    tauxParZone: { name: string; taux: number | null }[];
    topFaibles: ResultGeoRow[];
    totalVaccines: number;
    parTranche: Record<TrancheKey, number>;
  };
  superv: SupervBundle;
}
