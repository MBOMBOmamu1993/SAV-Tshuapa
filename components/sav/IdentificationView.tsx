"use client";

import { Card, SectionBar } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import EChart from "@/components/charts/EChart";
import { AntigenTrancheBars, MissedAntigenTable, MissedGeoTable } from "@/components/sav/widgets";
import { fmtNum } from "@/lib/client/format";
import { TRANCHES } from "@/config/sav.config";
import type { GeoMissedRow, AntigenStat } from "@/lib/sav/types";

export interface IdentData {
  byZone: GeoMissedRow[];
  byAire: GeoMissedRow[];
  antigens: AntigenStat[];
  topAires: GeoMissedRow[];
}

/** Top 5 des aires par nombre d'enfants manqués, empilé par tranche d'âge. */
function TopAiresChart({ rows }: { rows: GeoMissedRow[] }) {
  const ordered = [...rows].reverse();
  return (
    <EChart
      height={Math.max(160, rows.length * 38 + 40)}
      option={{
        color: TRANCHES.map((t) => t.color),
        grid: { left: 4, right: 16, top: 26, bottom: 6, containLabel: true },
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        legend: { top: 0, textStyle: { fontSize: 10 } },
        xAxis: { type: "value", axisLabel: { fontSize: 10 }, splitLine: { lineStyle: { color: "#f1f5f9" } } },
        yAxis: { type: "category", data: ordered.map((r) => r.name), axisLabel: { fontSize: 10, width: 120, overflow: "truncate" } },
        series: TRANCHES.map((t) => ({
          name: t.short, type: "bar", stack: "x",
          data: ordered.map((r) => r.byTranche[t.key]),
          label: undefined,
        })),
      }}
    />
  );
}

export function IdentificationView({
  data, source, geoNote,
}: { data: IdentData; source: "cs" | "relais"; geoNote: string }) {
  const tot = data.byZone.reduce((a, r) => ({
    id: a.id + r.identifies, zero: a.zero + r.zero, sous: a.sous + r.sous, doses: a.doses + r.dosesManquees,
  }), { id: 0, zero: 0, sous: 0, doses: 0 });
  const acteurs = source === "cs" ? "Infirmiers Titulaires (centres de santé)" : "Relais communautaires";

  return (
    <div className="space-y-4">
      <section>
        <SectionBar icon="child">Enfants manqués identifiés — {acteurs}</SectionBar>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <KpiCard icon="child" tone="navy" label="Enfants identifiés" value={fmtNum(tot.id)} sub={geoNote} />
          <KpiCard icon="person" tone="bad" label="Zéro dose" value={fmtNum(tot.zero)} sub="PENTA 1 non reçu" />
          <KpiCard icon="people" tone="warn" label="Sous-vaccinés" value={fmtNum(tot.sous)} sub="PENTA 3 non reçu" />
          <KpiCard icon="syringe" tone="violet" label="Doses manquées" value={fmtNum(tot.doses)} sub="Toutes valences" />
        </div>
      </section>

      <section>
        <SectionBar icon="map">Enfants manqués par zone de santé (tranche d'âge)</SectionBar>
        <Card><MissedGeoTable rows={data.byZone} geoLabel="Zone de santé" /></Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        <Card>
          <div className="card-title mb-2">Doses manquées par antigène et tranche d'âge</div>
          <AntigenTrancheBars stats={data.antigens} kind="missed" />
        </Card>
        <Card>
          <div className="card-title mb-2">Détail des doses manquées par antigène</div>
          <MissedAntigenTable stats={data.antigens} />
        </Card>
      </section>

      <section>
        <SectionBar icon="clinic">Enfants manqués par aire de santé (tranche d'âge)</SectionBar>
        <Card><MissedGeoTable rows={data.byAire} geoLabel="Aire de santé" showZone /></Card>
      </section>

      <section>
        <SectionBar icon="trophy">Top 5 des aires de santé avec le plus grand nombre d'enfants manqués</SectionBar>
        <Card><TopAiresChart rows={data.topAires} /></Card>
      </section>
    </div>
  );
}
