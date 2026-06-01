"use client";

import { DataGate } from "@/components/ui/DataGate";
import { Card, SectionBar } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import Donut from "@/components/charts/Donut";
import HBar from "@/components/charts/HBar";
import { fmtNum, fmtPct } from "@/lib/client/format";
import { COTATION_LABEL, cotationFor, COTATION_COLOR, tauxColor } from "@/config/sav.config";

export default function SupervisionPage() {
  return (
    <DataGate>
      {(d) => {
        const s = d.superv;
        const cot = s.scoreMoyen !== null ? cotationFor(s.scoreMoyen) : null;
        const questions = [...s.questions].sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0));
        return (
          <div className="space-y-4">
            <section>
              <SectionBar icon="shield">Indicateurs de supervision des équipes</SectionBar>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <KpiCard icon="clipboard" tone="navy" label="Visites de supervision" value={fmtNum(s.visites)} sub={`${s.sites} sites distincts`} />
                <KpiCard icon="up" tone={cot === "faible" ? "bad" : "good"} label="Score qualité moyen" value={fmtPct(s.scoreMoyen)} sub="Réponses « Oui » / applicables" />
                <KpiCard icon="trophy" tone="brand" label="Appréciation globale" value={cot ? COTATION_LABEL[cot] : "—"} sub="Selon le score qualité" />
                <KpiCard icon="alert" tone={s.difficultes.length ? "warn" : "good"} label="Difficultés signalées" value={fmtNum(s.difficultes.reduce((a, x) => a + x.count, 0))} sub="Toutes catégories" />
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              <Card>
                <div className="card-title mb-2">Appréciation des sites supervisés (score qualité)</div>
                <div className="grid grid-cols-5 items-center gap-2">
                  <div className="col-span-2">
                    <Donut height={160} data={s.cotations.map((c) => ({ name: c.label, value: c.count, color: c.color }))} centerLabel={fmtPct(s.scoreMoyen)} />
                  </div>
                  <div className="col-span-3 space-y-1.5">
                    {s.cotations.map((c) => (
                      <div key={c.level} className="flex items-center gap-1.5 text-[11.5px]">
                        <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: c.color }} />
                        <span className="text-surface-700 flex-1">{c.label}</span>
                        <span className="font-semibold text-surface-900 tabular-nums">{c.count}</span>
                        <span className="text-surface-500 tabular-nums w-9 text-right">({c.pct}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
              <Card>
                <div className="card-title mb-2">Principales difficultés rencontrées</div>
                {s.difficultes.length ? (
                  <HBar data={s.difficultes.map((x) => ({ name: x.name, value: x.pct }))} colorByCotation={false} />
                ) : <div className="text-[12px] text-surface-500 py-6 text-center">Aucune difficulté signalée.</div>}
              </Card>
            </section>

            <section>
              <SectionBar icon="clip">Conformité par question de supervision (% de réponses « Oui »)</SectionBar>
              <Card>
                <div className="overflow-x-auto">
                  <table className="dtable">
                    <thead><tr><th className="name" style={{ textAlign: "left" }}>Point de contrôle</th><th>Oui</th><th>Non</th><th>N/A</th><th>% conformité</th></tr></thead>
                    <tbody>
                      {questions.map((q) => (
                        <tr key={q.question}>
                          <td className="name" style={{ textAlign: "left" }}>{q.question}</td>
                          <td>{q.oui}</td><td>{q.non}</td><td>{q.na}</td>
                          <td style={{ fontWeight: 800, color: tauxColor(q.pct) }}>{q.pct === null ? "—" : `${q.pct}%`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>

            <section>
              <SectionBar icon="clinic">Score qualité par aire de santé</SectionBar>
              <Card>
                <div className="overflow-x-auto">
                  <table className="dtable">
                    <thead><tr><th className="name">Aire de santé</th><th>Zone</th><th>Visites</th><th>Score qualité</th><th>Appréciation</th></tr></thead>
                    <tbody>
                      {s.perAire.map((a) => {
                        const c = a.score !== null ? cotationFor(a.score) : null;
                        return (
                          <tr key={a.name}>
                            <td className="name">{a.name}</td><td>{a.zone ?? "—"}</td><td>{a.visites}</td>
                            <td style={{ fontWeight: 800, color: tauxColor(a.score) }}>{a.score === null ? "—" : `${a.score}%`}</td>
                            <td>{c ? <span className="badge-appr" style={{ background: COTATION_COLOR[c] + "22", color: COTATION_COLOR[c] }}>{COTATION_LABEL[c]}</span> : "—"}</td>
                          </tr>
                        );
                      })}
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
