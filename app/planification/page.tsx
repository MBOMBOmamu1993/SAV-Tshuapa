"use client";

import { DataGate } from "@/components/ui/DataGate";
import { Card, SectionBar } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import Donut from "@/components/charts/Donut";
import { fmtNum, fmtPct } from "@/lib/client/format";
import { tauxColor } from "@/config/sav.config";

export default function PlanificationPage() {
  return (
    <DataGate>
      {(d) => {
        const p = d.planif;
        const avec = p.aires.filter((a) => a.hasProgram);
        const sans = p.aires.filter((a) => !a.hasProgram);
        return (
          <div className="space-y-4">
            <section>
              <SectionBar icon="calendar">Couverture de la planification</SectionBar>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <KpiCard icon="clinic" tone={sans.length ? "warn" : "good"} label="AS avec programme" value={`${avec.length}/${p.aires.length}`} sub={`${fmtPct(p.proportionAvecProgramme)} couvertes`} />
                <KpiCard icon="alert" tone={sans.length ? "bad" : "good"} label="AS sans programme" value={fmtNum(sans.length)} sub="À planifier en priorité" />
                <KpiCard icon="calendar" tone="navy" label="Sessions planifiées" value={fmtNum(p.totalSessions)} sub="Tous types confondus" />
                <KpiCard icon="child" tone="brand" label="Enfants attendus" value={fmtNum(p.totalAttendus)} sub="Cible de récupération" />
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              <Card>
                <div className="card-title mb-2">Proportion des aires de santé avec programme de vaccination</div>
                <div className="grid grid-cols-5 items-center gap-2">
                  <div className="col-span-2">
                    <Donut height={170} data={[
                      { name: "Avec programme", value: avec.length, color: "#1f9d57" },
                      { name: "Sans programme", value: sans.length, color: "#e23636" },
                    ]} centerLabel={`${fmtPct(p.proportionAvecProgramme)}`} />
                  </div>
                  <div className="col-span-3 space-y-2 text-[12.5px]">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ background: "#1f9d57" }} /><span className="flex-1">Aires avec programme</span><b>{avec.length}</b></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ background: "#e23636" }} /><span className="flex-1">Aires sans programme</span><b>{sans.length}</b></div>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="card-title mb-2">Nombre de sessions prévues par type</div>
                <table className="dtable">
                  <thead><tr><th className="name">Type de session</th><th>Nombre</th></tr></thead>
                  <tbody>
                    <tr><td className="name">Fixe</td><td>{p.sessionsParType.fixe}</td></tr>
                    <tr><td className="name">Avancée</td><td>{p.sessionsParType.avancee}</td></tr>
                    <tr><td className="name">Mobile</td><td>{p.sessionsParType.mobile}</td></tr>
                  </tbody>
                  <tfoot><tr><td className="name">Total</td><td>{p.totalSessions}</td></tr></tfoot>
                </table>
              </Card>
            </section>

            <section>
              <SectionBar icon="map">Aires de santé avec et sans programme de vaccination</SectionBar>
              <Card>
                <div className="overflow-x-auto">
                  <table className="dtable">
                    <thead>
                      <tr>
                        <th className="name">Aire de santé</th><th>Zone de santé</th><th>Programme</th>
                        <th>Sessions</th><th>Avancées</th><th>Mobiles</th><th>Enfants attendus</th><th>Identifiés</th><th>Ratio att./id.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.aires.map((a) => (
                        <tr key={a.aire}>
                          <td className="name">{a.aire}</td>
                          <td>{a.zone ?? "—"}</td>
                          <td>{a.hasProgram
                            ? <span className="badge-appr" style={{ background: "#eafaf1", color: "#178a44" }}>Oui</span>
                            : <span className="badge-appr" style={{ background: "#fff1f1", color: "#c81e1e" }}>Non</span>}</td>
                          <td>{a.sessions || "—"}</td><td>{a.avancees || "—"}</td><td>{a.mobiles || "—"}</td>
                          <td>{a.attendus || "—"}</td><td>{a.identifies || "—"}</td>
                          <td style={{ fontWeight: 700, color: tauxColor(a.ratio) }}>{a.ratio === null ? "—" : `${a.ratio}%`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          </div>
        );
      }}
    </DataGate>
  );
}
