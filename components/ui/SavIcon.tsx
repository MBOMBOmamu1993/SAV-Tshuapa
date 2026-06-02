import type { SVGProps } from "react";

/**
 * Jeu d'icônes médicales BICOLORES pour le tableau de bord SAV.
 * Style : tuile douce (teinte pastel `soft`) + glyphe plein (couleur saturée `solid`),
 * calqué sur le modèle Power BI (cf. assets/sav-icons.js et apercu_design.html).
 * Chaque icône est un <svg viewBox="0 0 48 48"> autoporteur (la tuile fait office de pastille).
 */
export type SavIconName =
  | "child" | "syringe" | "childCheck" | "clinicCheck" | "clinicX" | "percent"
  | "calendar" | "target" | "zeroDose" | "shield" | "relais" | "recovery" | "pin" | "report";

const G: Record<SavIconName, (s: string, soft: string) => JSX.Element> = {
  /* Enfant debout — total enfants identifiés */
  child: (s) => (
    <>
      <circle cx="24" cy="14.5" r="4.4" fill={s} />
      <path d="M16.5 24.5c0-3 3.2-5.2 7.5-5.2s7.5 2.2 7.5 5.2l-2 8.2a1.6 1.6 0 0 1-1.6 1.2h-1.1v5.6a1.7 1.7 0 0 1-3.4 0V33.9h-1.1a1.6 1.6 0 0 1-1.6-1.2l-2.2-8.2Z" fill={s} />
    </>
  ),
  /* Seringue — doses récupérées / vaccination */
  syringe: (s, soft) => (
    <>
      <path d="M30.8 12.2l5 5" stroke={s} strokeWidth={2.6} strokeLinecap="round" />
      <path d="M33.3 9.7l5 5" stroke={s} strokeWidth={2.6} strokeLinecap="round" />
      <path d="M14.6 28.4 28.9 14.1l5 5L19.6 33.4l-5.6 1.3a1 1 0 0 1-1.2-1.2l1.8-5.1Z" fill={s} />
      <path d="M18 24l4 4M22.5 19.5l4 4" stroke={soft} strokeWidth={1.8} strokeLinecap="round" />
    </>
  ),
  /* Enfant vacciné (figure + pastille check) */
  childCheck: (s, soft) => (
    <>
      <circle cx="21" cy="14.5" r="4.2" fill={s} />
      <path d="M13.8 25c0-2.9 3-5 7.2-5s7.2 2.1 7.2 5l-1.9 7.8a1.5 1.5 0 0 1-1.5 1.1h-1v5.5a1.6 1.6 0 0 1-3.3 0V34h-1a1.5 1.5 0 0 1-1.5-1.1L13.8 25Z" fill={s} />
      <circle cx="34" cy="32" r="7.5" fill={soft} stroke={s} strokeWidth={2} />
      <path d="m30.8 32 2.1 2.1 4.3-4.3" stroke={s} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  /* Centre de santé AVEC programme (croix médicale + check) */
  clinicCheck: (s) => (
    <>
      <path d="M11 38V21l13-7 13 7v17" fill="none" stroke={s} strokeWidth={2.6} strokeLinejoin="round" />
      <path d="M24 20.5v8M20 24.5h8" stroke={s} strokeWidth={2.6} strokeLinecap="round" />
      <circle cx="34.5" cy="33.5" r="7" fill={s} />
      <path d="m31.4 33.6 2 2 4-4.2" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  /* Centre de santé SANS programme (croix médicale + croix d'absence) */
  clinicX: (s) => (
    <>
      <path d="M11 38V21l13-7 13 7v17" fill="none" stroke={s} strokeWidth={2.6} strokeLinejoin="round" />
      <path d="M24 20.5v8M20 24.5h8" stroke={s} strokeWidth={2.6} strokeLinecap="round" />
      <circle cx="34.5" cy="33.5" r="7" fill={s} />
      <path d="m32 31 5 5M37 31l-5 5" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" fill="none" />
    </>
  ),
  /* Badge pourcentage — proportion */
  percent: (s) => (
    <>
      <circle cx="24" cy="24" r="13" fill="none" stroke={s} strokeWidth={2.6} />
      <circle cx="19.5" cy="19.5" r="2.6" fill={s} />
      <circle cx="28.5" cy="28.5" r="2.6" fill={s} />
      <path d="m18 30 12-12" stroke={s} strokeWidth={2.6} strokeLinecap="round" />
    </>
  ),
  /* Calendrier — sessions planifiées */
  calendar: (s, soft) => (
    <>
      <rect x="11" y="13" width="26" height="24" rx="4" fill="none" stroke={s} strokeWidth={2.6} />
      <path d="M11 19h26" stroke={s} strokeWidth={2.6} />
      <path d="M17 10v5M31 10v5" stroke={s} strokeWidth={2.6} strokeLinecap="round" />
      <rect x="16" y="24" width="6" height="5" rx="1.2" fill={s} />
      <rect x="26" y="24" width="6" height="5" rx="1.2" fill={soft} stroke={s} strokeWidth={1.4} />
    </>
  ),
  /* Cible — enfants attendus */
  target: (s) => (
    <>
      <circle cx="24" cy="24" r="12.5" fill="none" stroke={s} strokeWidth={2.6} />
      <circle cx="24" cy="24" r="7" fill="none" stroke={s} strokeWidth={2.6} />
      <circle cx="24" cy="24" r="2.6" fill={s} />
    </>
  ),
  /* Bouclier alerte — zéro dose / enfant à risque */
  zeroDose: (s, soft) => (
    <>
      <path d="M24 10l11 4v8c0 7-4.7 12-11 14-6.3-2-11-7-11-14v-8l11-4Z" fill={soft} stroke={s} strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M24 18v7" stroke={s} strokeWidth={2.8} strokeLinecap="round" />
      <circle cx="24" cy="30" r="1.7" fill={s} />
    </>
  ),
  /* Sous-vaccinés — bouclier partiel */
  shield: (s, soft) => (
    <>
      <path d="M24 10l11 4v8c0 7-4.7 12-11 14-6.3-2-11-7-11-14v-8l11-4Z" fill={soft} stroke={s} strokeWidth={2.4} strokeLinejoin="round" />
      <path d="m19 24 3.4 3.4L30 20" stroke={s} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  /* Communauté / relais — plusieurs personnes */
  relais: (s, soft) => (
    <>
      <circle cx="17" cy="18" r="4.2" fill={s} />
      <circle cx="31" cy="18" r="4.2" fill={soft} stroke={s} strokeWidth={2} />
      <path d="M9 35c0-4.4 3.6-7.4 8-7.4s8 3 8 7.4Z" fill={s} />
      <path d="M25 35c0-4.4 2.6-7.4 6-7.4s6 3 6 7.4Z" fill={soft} stroke={s} strokeWidth={2} />
    </>
  ),
  /* Récupération — flèche montante */
  recovery: (s, soft) => (
    <>
      <circle cx="24" cy="24" r="13" fill={soft} />
      <path d="M16 28l5-5 4 3 7-8" stroke={s} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M28 14h6v6" stroke={s} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  /* Repère géographique — aires de santé */
  pin: (s, soft) => (
    <>
      <path d="M24 39s-9-8.1-9-15a9 9 0 0 1 18 0c0 6.9-9 15-9 15Z" fill={soft} stroke={s} strokeWidth={2.4} strokeLinejoin="round" />
      <circle cx="24" cy="23" r="3.6" fill={s} />
    </>
  ),
  /* Document rapport */
  report: (s, soft) => (
    <>
      <path d="M15 9h12l8 8v22H15Z" fill={soft} stroke={s} strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M27 9v8h8" fill="none" stroke={s} strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M20 26h10M20 31h10M20 21h5" stroke={s} strokeWidth={2.2} strokeLinecap="round" />
    </>
  ),
};

export function SavIcon({
  name,
  solid,
  soft,
  ...props
}: { name: SavIconName; solid: string; soft: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <rect x="1.5" y="1.5" width="45" height="45" rx="13" fill={soft} />
      {G[name](solid, soft)}
    </svg>
  );
}
