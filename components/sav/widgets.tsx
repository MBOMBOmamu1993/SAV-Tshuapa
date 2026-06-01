"use client";

import EChart from "@/components/charts/EChart";
import { ANTIGENS, TRANCHES, tauxColor, type TrancheKey } from "@/config/sav.config";
import { wrapText } from "@/lib/client/format";
import type { AntigenStat, GeoMissedRow, ResultGeoRow } from "@/lib/sav/types";

/** Barres verticales : nombre par antigène (manqués ou récupérés). */
export function AntigenBars({ stats, kind, height = 280 }: { stats: AntigenStat[]; kind: "missed" | "recovered"; height?: number }) {
  const vals = stats.map((s) => (kind === "missed" ? s.missedTotal : s.recoveredTotal));
  const color = kind === "missed" ? "#e23636" : "#1f9d57";
  return (
    <EChart
      height={height}
      option={{
        grid: { left: 4, right: 12, top: 18, bottom: 46, containLabel: true },
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        xAxis: { type: "category", data: stats.map((s) => s.label), axisLabel: { fontSize: 9, rotate: 55, interval: 0 } },
        yAxis: { type: "value", axisLabel: { fontSize: 10 }, splitLine: { lineStyle: { color: "#f1f5f9" } } },
        series: [{
          type: "bar", data: vals, itemStyle: { color, borderRadius: [3, 3, 0, 0] },
          label: { show: true, position: "top", fontSize: 9, color: "#475569", formatter: (p: { value: number }) => (p.value ? p.value : "") },
        }],
      }}
    />
  );
}

/** Barres empilées par tranche d'âge et antigène. */
export function AntigenTrancheBars({ stats, kind, height = 300 }: { stats: AntigenStat[]; kind: "missed" | "recovered"; height?: number }) {
  return (
    <EChart
      height={height}
      option={{
        color: TRANCHES.map((t) => t.color),
        grid: { left: 4, right: 12, top: 28, bottom: 46, containLabel: true },
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        legend: { top: 0, textStyle: { fontSize: 10 } },
        xAxis: { type: "category", data: stats.map((s) => s.label), axisLabel: { fontSize: 9, rotate: 55, interval: 0 } },
        yAxis: { type: "value", axisLabel: { fontSize: 10 }, splitLine: { lineStyle: { color: "#f1f5f9" } } },
        series: TRANCHES.map((t) => ({
          name: t.short, type: "bar", stack: "x",
          data: stats.map((s) => (kind === "missed" ? s.missed[t.key] : s.recovered[t.key])),
        })),
      }}
    />
  );
}

/** Barres horizontales de taux de récupération (%) par entité. */
export function TauxBars({ data, height }: { data: { name: string; taux: number | null }[]; height?: number }) {
  const clean = data.filter((d) => d.taux !== null) as { name: string; taux: number }[];
  const h = height ?? Math.max(140, clean.length * 30 + 40);
  const ordered = [...clean].reverse();
  return (
    <EChart
      height={h}
      option={{
        grid: { left: 4, right: 48, top: 8, bottom: 8, containLabel: true },
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, confine: true,
          formatter: (p: { name: string; value: number }[]) => `${wrapText(p[0].name, 40, "<br/>")}<br/><b>${p[0].value}%</b>` },
        xAxis: { type: "value", max: 100, axisLabel: { formatter: "{value}%", fontSize: 10 }, splitLine: { lineStyle: { color: "#f1f5f9" } } },
        yAxis: { type: "category", data: ordered.map((d) => d.name), axisLabel: { fontSize: 10, width: 130, overflow: "truncate" } },
        series: [{
          type: "bar", data: ordered.map((d) => ({ value: d.taux, itemStyle: { color: tauxColor(d.taux), borderRadius: [0, 3, 3, 0] } })),
          barWidth: "62%", label: { show: true, position: "right", fontSize: 10, fontWeight: "bold", formatter: "{c}%", color: "#334155" },
        }],
      }}
    />
  );
}

/** Tableau enfants manqués par entité géographique × tranche d'âge. */
export function MissedGeoTable({ rows, geoLabel, showZone = false }: { rows: GeoMissedRow[]; geoLabel: string; showZone?: boolean }) {
  const tot = rows.reduce((a, r) => ({
    identifies: a.identifies + r.identifies, zero: a.zero + r.zero, sous: a.sous + r.sous, doses: a.doses + r.dosesManquees,
    t0: a.t0 + r.byTranche["0-11"], t1: a.t1 + r.byTranche["12-23"], t2: a.t2 + r.byTranche["24-59"],
  }), { identifies: 0, zero: 0, sous: 0, doses: 0, t0: 0, t1: 0, t2: 0 });
  return (
    <div className="overflow-x-auto">
      <table className="dtable">
        <thead>
          <tr>
            <th className="name">{geoLabel}</th>
            {showZone ? <th>Zone de santé</th> : null}
            <th>Identifiés</th><th>Zéro dose</th><th>Sous-vaccinés</th>
            <th>0–11 m</th><th>12–23 m</th><th>24–59 m</th><th>Doses manquées</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td className="name">{r.name}</td>
              {showZone ? <td>{r.zone ?? "—"}</td> : null}
              <td>{r.identifies}</td>
              <td style={{ color: r.zero ? "#c81e1e" : undefined, fontWeight: r.zero ? 700 : undefined }}>{r.zero}</td>
              <td style={{ color: r.sous ? "#c87b04" : undefined, fontWeight: r.sous ? 700 : undefined }}>{r.sous}</td>
              <td>{r.byTranche["0-11"]}</td><td>{r.byTranche["12-23"]}</td><td>{r.byTranche["24-59"]}</td>
              <td>{r.dosesManquees}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="name">Total</td>
            {showZone ? <td>—</td> : null}
            <td>{tot.identifies}</td><td>{tot.zero}</td><td>{tot.sous}</td>
            <td>{tot.t0}</td><td>{tot.t1}</td><td>{tot.t2}</td><td>{tot.doses}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/** Tableau enfants manqués par antigène × tranche d'âge. */
export function MissedAntigenTable({ stats }: { stats: AntigenStat[] }) {
  const t = (k: TrancheKey) => stats.reduce((a, s) => a + s.missed[k], 0);
  return (
    <div className="overflow-x-auto">
      <table className="dtable">
        <thead><tr><th className="name">Antigène</th><th>0–11 m</th><th>12–23 m</th><th>24–59 m</th><th>Total manqués</th></tr></thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.key}>
              <td className="name">{s.label}</td>
              <td>{s.missed["0-11"]}</td><td>{s.missed["12-23"]}</td><td>{s.missed["24-59"]}</td>
              <td style={{ fontWeight: 700, color: s.missedTotal ? "#c81e1e" : undefined }}>{s.missedTotal}</td>
            </tr>
          ))}
        </tbody>
        <tfoot><tr><td className="name">Total</td><td>{t("0-11")}</td><td>{t("12-23")}</td><td>{t("24-59")}</td><td>{stats.reduce((a, s) => a + s.missedTotal, 0)}</td></tr></tfoot>
      </table>
    </div>
  );
}

/** Tableau récupération par entité × tranche + taux. */
export function RecoveryGeoTable({ rows, geoLabel, showZone = false }: { rows: ResultGeoRow[]; geoLabel: string; showZone?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="dtable">
        <thead>
          <tr>
            <th className="name">{geoLabel}</th>
            {showZone ? <th>Zone</th> : null}
            <th>0–11 m</th><th>12–23 m</th><th>24–59 m</th><th>Doses récupérées</th><th>Doses manquées</th><th>Taux récup.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td className="name">{r.name}</td>
              {showZone ? <td>{r.zone ?? "—"}</td> : null}
              <td>{r.byTranche["0-11"]}</td><td>{r.byTranche["12-23"]}</td><td>{r.byTranche["24-59"]}</td>
              <td style={{ fontWeight: 700 }}>{r.total}</td><td>{r.missed || "—"}</td>
              <td style={{ fontWeight: 800, color: tauxColor(r.taux) }}>{r.taux === null ? "—" : `${r.taux}%`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
