"use client";

import { Card, SectionBar } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { DataGate } from "@/components/ui/DataGate";
import Donut from "@/components/charts/Donut";
import { fmtNum, fmtPct } from "@/lib/client/format";
import { tauxColor, ALERT_THRESHOLDS } from "@/config/sav.config";
import type { SavBundle } from "@/lib/sav/types";

function pctTxt(v: number | null): string {
  return v === null ? "—" : `${v}%`;
}

function Narration({ d }: { d: SavBundle }) {
  const k = d.kpi;
  const topMissedAnt = [...d.cs.antigens].sort((a, b) => b.missedTotal - a.missedTotal).slice(0, 2).map((a) => a.label);
  const faibles = d.resultats.topFaibles.slice(0, 3).map((a) => a.name);
  const lignes: { t: string; p: string }[] = [
    {
      t: "Situation générale",
      p: `Au cours de la période, ${fmtNum(k.identifies)} enfants ont été identifiés comme étant en conflit avec le calendrier vaccinal au niveau des centres de santé, dont ${fmtNum(k.zeroDose)} zéro dose et ${fmtNum(k.sousVaccines)} sous-vaccinés. Les relais communautaires ont identifié ${fmtNum(k.identifiesRelais)} enfants supplémentaires. Les antigènes les plus manqués sont ${topMissedAnt.join(" et ") || "—"}.`,
    },
    {
      t: "Planification",
      p: `${pctTxt(d.planif.proportionAvecProgramme)} des aires de santé disposent d'un programme de récupération (${k.airesPlanifiees}/${k.airesTotal}). ${k.airesSansProgramme} aire(s) de santé sans programme doivent être priorisées avant la prochaine séance. ${fmtNum(k.sessionsPlan)} sessions ont été planifiées pour ${fmtNum(k.attendus)} enfants attendus (ratio attendus/identifiés : ${pctTxt(k.ratioAttendus)}).`,
    },
    {
      t: "Résultats",
      p: `Le taux global de récupération est de ${pctTxt(k.tauxRecuperation)} (${fmtNum(k.vaccines)} enfants vaccinés / doses administrées). Les faibles performances concernent principalement ${faibles.join(", ") || "—"}.`,
    },
    {
      t: "Décision",
      p: "Renforcer la microplanification, organiser des sessions avancées/mobiles ciblées dans les aires à faible taux et intensifier la recherche active communautaire des enfants invisibles dans les registres.",
    },
  ];
  return (
    <div className="space-y-2">
      {lignes.map((l) => (
        <div key={l.t} className="flex gap-3 rounded-lg border border-surface-200 bg-white p-3">
          <div className="w-[140px] shrink-0 text-[12px] font-extrabold text-navy-700">{l.t}</div>
          <div className="text-[12px] text-surface-800 leading-snug">{l.p}</div>
        </div>
      ))}
    </div>
  );
}

export default function SynthesePage() {
  return (
    <DataGate>
      {(d) => {
        const k = d.kpi;
        const alerts = [
          { sit: "Récupération faible", seuil: `< ${ALERT_THRESHOLDS.recuperationFaible} %`, val: pctTxt(k.tauxRecuperation), action: "Microplan de rattrapage ciblé", bad: (k.tauxRecuperation ?? 100) < ALERT_THRESHOLDS.recuperationFaible },
          { sit: "Planification insuffisante", seuil: `< ${ALERT_THRESHOLDS.planificationInsuffisante} % des identifiés`, val: pctTxt(k.ratioAttendus), action: "Ajouter sessions avancées / mobiles", bad: (k.ratioAttendus ?? 100) < ALERT_THRESHOLDS.planificationInsuffisante },
          { sit: "AS sans programme", seuil: "≥ 1", val: fmtNum(k.airesSansProgramme), action: "Planifier immédiatement", bad: k.airesSansProgramme > 0 },
        ];
        return (
          <div className="space-y-4">
            {/* KPI principaux */}
            <section>
              <SectionBar icon="bars">Synthèse exécutive — vue d'ensemble</SectionBar>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <KpiCard icon="child" tone="brand" label="Enfants identifiés" value={fmtNum(k.identifies)} sub="Au niveau des centres de santé" />
                <KpiCard icon="syringe" tone="good" label="Doses récupérées" value={fmtNum(k.vaccines)} sub="Doses administrées (récupération)" />
                <KpiCard icon="recovery" tone="violet" label="Taux de récupération" value={pctTxt(k.tauxRecuperation)} sub="Doses récup. / doses manquées" />
                <KpiCard icon="clinicX" tone={k.airesSansProgramme > 0 ? "bad" : "good"} label="AS non planifiées" value={fmtNum(k.airesSansProgramme)} sub={`sur ${k.airesTotal} aires de santé`} />
              </div>
            </section>

            {/* Indicateurs détaillés (dictionnaire) */}
            <section>
              <SectionBar icon="component">Indicateurs clés de la récupération</SectionBar>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <KpiCard icon="zeroDose" tone="bad" label="Enfants zéro dose" value={fmtNum(k.zeroDose)} sub="PENTA 1 non reçu" />
                <KpiCard icon="shield" tone="warn" label="Enfants sous-vaccinés" value={fmtNum(k.sousVaccines)} sub="PENTA 3 non reçu, PENTA 1 reçu" />
                <KpiCard icon="syringe" tone="violet" label="Doses manquées" value={fmtNum(k.dosesManquees)} sub="Toutes valences confondues" />
                <KpiCard icon="relais" tone="teal" label="Identifiés par les relais" value={fmtNum(k.identifiesRelais)} sub="Recherche communautaire" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-2.5">
                <KpiCard icon="calendar" tone="navy" label="Sessions planifiées" value={fmtNum(k.sessionsPlan)} sub="Toutes aires de santé" />
                <KpiCard icon="target" tone="brand" label="Enfants attendus" value={fmtNum(k.attendus)} sub="Cible de la planification" />
                <KpiCard icon="percent" tone="violet" label="Ratio attendus / identifiés" value={pctTxt(k.ratioAttendus)} sub="Cohérence planification" />
                <KpiCard icon="clinicCheck" tone="good" label="AS avec programme" value={`${k.airesPlanifiees}/${k.airesTotal}`} sub={`${pctTxt(d.planif.proportionAvecProgramme)} couvertes`} />
              </div>
            </section>

            {/* Répartition + alertes */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              <Card>
                <div className="card-title mb-2">Répartition des enfants identifiés (centres de santé)</div>
                <div className="grid grid-cols-5 items-center gap-2">
                  <div className="col-span-2">
                    <Donut height={160} data={[
                      { name: "Zéro dose", value: k.zeroDose, color: "#e23636" },
                      { name: "Sous-vaccinés", value: k.sousVaccines, color: "#f59e0b" },
                      { name: "Autres manquants", value: Math.max(0, k.identifies - k.zeroDose - k.sousVaccines), color: "#0093d5" },
                    ]} centerLabel={`${fmtNum(k.identifies)}\nenfants`} />
                  </div>
                  <div className="col-span-3 space-y-1.5 text-[12px]">
                    <Row c="#e23636" l="Enfants zéro dose" v={`${fmtNum(k.zeroDose)} (${fmtPct(k.identifies ? (k.zeroDose / k.identifies) * 100 : null)})`} />
                    <Row c="#f59e0b" l="Enfants sous-vaccinés" v={`${fmtNum(k.sousVaccines)} (${fmtPct(k.identifies ? (k.sousVaccines / k.identifies) * 100 : null)})`} />
                    <Row c="#0093d5" l="Autres enfants manqués" v={fmtNum(Math.max(0, k.identifies - k.zeroDose - k.sousVaccines))} />
                  </div>
                </div>
              </Card>
              <Card>
                <div className="card-title mb-2">Alertes clés automatiques</div>
                <table className="dtable">
                  <thead><tr><th className="name">Alerte</th><th>Seuil</th><th>Valeur</th><th>Action</th></tr></thead>
                  <tbody>
                    {alerts.map((a) => (
                      <tr key={a.sit}>
                        <td className="name">{a.sit}</td>
                        <td>{a.seuil}</td>
                        <td style={{ fontWeight: 800, color: a.bad ? "#c81e1e" : "#178a44" }}>{a.val}</td>
                        <td style={{ textAlign: "left" }}>{a.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </section>

            {/* Narration automatique */}
            <section>
              <SectionBar icon="doc">Narration automatique du rapport</SectionBar>
              <Narration d={d} />
            </section>
          </div>
        );
      }}
    </DataGate>
  );
}

function Row({ c, l, v }: { c: string; l: string; v: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: c }} />
      <span className="text-surface-700 flex-1">{l}</span>
      <span className="font-semibold text-surface-900 tabular-nums">{v}</span>
    </div>
  );
}
