"use client";

import { useState } from "react";
import { DataGate } from "@/components/ui/DataGate";
import { Card, SectionBar } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { AntigenBars, RecoveryGeoTable, TauxBars } from "@/components/sav/widgets";
import { fmtNum, fmtPct } from "@/lib/client/format";
import { ANTIGENS, TRANCHES, tauxColor } from "@/config/sav.config";
import type { SavBundle } from "@/lib/sav/types";

function ResultsBody({ d }: { d: SavBundle }) {
  const r = d.resultats;
  const [ant, setAnt] = useState<string>("__all");

  // Taux par zone : global ou pour un antigène donné (récupérés_antigène / manqués_antigène).
  const missedByZoneAnt = new Map<string, Record<string, number>>();
  for (const z of d.cs.byZone) missedByZoneAnt.set(z.name, z.byAntigen);
  const recByZoneAnt = new Map<string, Record<string, number>>();
  for (const z of r.byZone) recByZoneAnt.set(z.name, z.byAntigen);

  const tauxParZone = r.byZone.map((z) => {
    if (ant === "__all") return { name: z.name, taux: z.taux };
    const rec = recByZoneAnt.get(z.name)?.[ant] ?? 0;
    const miss = missedByZoneAnt.get(z.name)?.[ant] ?? 0;
    return { name: z.name, taux: miss > 0 ? Math.round((rec / miss) * 1000) / 10 : null };
  });

  const antStat = ant === "__all" ? null : r.antigens.find((a) => a.key === ant) ?? null;

  return (
    <div className="space-y-4">
      <section>
        <SectionBar icon="syringe">Résultats de la récupération des enfants</SectionBar>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <KpiCard icon="syringe" tone="good" label="Doses récupérées" value={fmtNum(r.totalVaccines)} sub="Doses administrées" />
          <KpiCard icon="child" tone="brand" label="Doses 0–11 mois" value={fmtNum(r.parTranche["0-11"])} sub="Tranche prioritaire" />
          <KpiCard icon="childCheck" tone="violet" label="Doses 12–23 mois" value={fmtNum(r.parTranche["12-23"])} sub="Rattrapage" />
          <KpiCard icon="recovery" tone="teal" label="Doses 24–59 mois" value={fmtNum(r.parTranche["24-59"])} sub="Rattrapage tardif" />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        <Card>
          <div className="card-title mb-2">Enfants vaccinés par antigène</div>
          <AntigenBars stats={r.antigens} kind="recovered" />
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-2">
            <div className="card-title">Taux de récupération par zone de santé et antigène</div>
            <select className="input !h-7 !w-auto !text-[11px]" value={ant} onChange={(e) => setAnt(e.target.value)}>
              <option value="__all">Tous antigènes</option>
              {ANTIGENS.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
            </select>
          </div>
          <TauxBars data={tauxParZone} />
          {antStat ? (
            <div className="mt-2 text-[11.5px] text-surface-700">
              {antStat.label} — doses récupérées : <b>{antStat.recoveredTotal}</b> · doses manquées : <b>{antStat.missedTotal}</b> · taux : <b style={{ color: tauxColor(antStat.taux) }}>{antStat.taux === null ? "—" : `${antStat.taux}%`}</b>
            </div>
          ) : null}
        </Card>
      </section>

      <section>
        <SectionBar icon="map">Enfants vaccinés par zone de santé (tranche d'âge) et taux</SectionBar>
        <Card><RecoveryGeoTable rows={r.byZone} geoLabel="Zone de santé" /></Card>
      </section>

      <section>
        <SectionBar icon="clinic">Taux de récupération par aire de santé (tranche d'âge)</SectionBar>
        <Card><RecoveryGeoTable rows={r.byAire} geoLabel="Aire de santé" showZone /></Card>
      </section>

      <section>
        <SectionBar icon="down">Top 5 des aires de santé au taux de récupération le plus faible</SectionBar>
        <Card>
          <div className="overflow-x-auto">
            <table className="dtable">
              <thead><tr><th className="name">Aire de santé</th><th>Zone</th><th>Doses récupérées</th><th>Doses manquées</th><th>Taux de récupération</th></tr></thead>
              <tbody>
                {r.topFaibles.map((a) => (
                  <tr key={a.name}>
                    <td className="name">{a.name}</td><td>{a.zone ?? "—"}</td><td>{a.total}</td><td>{a.missed || "—"}</td>
                    <td style={{ fontWeight: 800, color: tauxColor(a.taux) }}>{a.taux === null ? "—" : `${a.taux}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}

export default function ResultatsPage() {
  return <DataGate>{(d) => <ResultsBody d={d} />}</DataGate>;
}
