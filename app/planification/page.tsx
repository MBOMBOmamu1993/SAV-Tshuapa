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
                <KpiCard icon="clinicCheck" tone="navy" label="Total aires de santé" value={fmtNum(p.aires.length)} sub="Couvertes par le SAV" />
                <KpiCard icon="clinicCheck" tone="good" label="AS avec programme" value={fmtNum(avec.length)} sub="Programme de vaccination" />
                <KpiCard icon="clinicX" tone={sans.length ? "warn" : "good"} label="AS sans programme" value={fmtNum(sans.length)} sub="À planifier en priorité" />
                <KpiCard icon="percent" tone="violet" label="Proportion avec programme" value={fmtPct(p.proportionAvecProgramme)} sub={`${avec.length} / ${p.aires.length} aires`} />
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
                    <tr><td className="name">Avancée</td><td>{p.sessionsParType.avancee}</td></tr>
                    <tr><td className="name">Fixe</td><td>{p.sessionsParType.fixe}</td></tr>
                    <tr><td className="name">Mobile</td><td>{p.sessionsParType.mobile}</td></tr>
                  </tbody>
                  <tfoot><tr><td className="name">Total</td><td>{p.totalSessions}</td></tr></tfoot>
                </table>
                <div className="mt-2 text-[11.5px] text-surface-700">
                  Types issus de la sous-feuille « sessions » (Avancée / Fixe / Mobile), agrégés après déduplication des formulaires.
                </div>
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

            <section>
              <SectionBar icon="clipboard">Programme de vaccination par aire de santé — détail des sessions</SectionBar>
              <Card>
                <div className="overflow-x-auto">
                  <table className="dtable">
                    <thead>
                      <tr>
                        <th>N°</th><th className="name">Aire de santé</th><th>Date prévue</th>
                        <th>Type</th><th>Site d'implantation</th><th>Enfants attendus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.sessionDetails.length ? p.sessionDetails.map((sdet, i) => (
                        <tr key={`${sdet.aire}-${sdet.n}-${i}`}>
                          <td>{sdet.n || i + 1}</td>
                          <td className="name">{sdet.aire}</td>
                          <td>{sdet.date ?? "—"}</td>
                          <td>{sdet.typeLabel}</td>
                          <td>{sdet.lieu ?? "—"}</td>
                          <td>{sdet.attendus || "—"}</td>
                        </tr>
                      )) : (
                        <tr><td className="name" colSpan={6}>Aucune session détaillée disponible.</td></tr>
                      )}
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
