"use client";

import { useState } from "react";
import { SectionBar } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { SavIcon } from "@/components/ui/SavIcon";
import { useSav } from "@/lib/client/api";
import { useFilters, filtersToQuery } from "@/lib/state/filters";
import { fmtNum, fmtPct } from "@/lib/client/format";

const PAL = { marine: "#00205c", cyan: "#0093d5", vert: "#1f9d57", bleu: "#0093d5", jaune: "#f59e0b", rouge: "#e23636" };

function MiniKpis({ items }: { items: { v: string; l: string; c: string }[] }) {
  return <div className="rap-kpis">{items.map((k, i) => <div key={i} className="rap-kpi"><div className="rap-kpi-v" style={{ color: k.c }}>{k.v}</div><div className="rap-kpi-l">{k.l}</div></div>)}</div>;
}
function MiniBars({ vals, colors }: { vals: number[]; colors: string[] }) {
  const max = Math.max(...vals, 1);
  return <div className="rap-bars">{vals.map((v, i) => <div key={i} className="rap-bar" style={{ height: `${Math.max(8, (v / max) * 100)}%`, background: colors[i % colors.length] }} />)}</div>;
}
function Cover({ emb, meta }: { emb: string; meta: string }) {
  return <div className="rap-cover"><div className="rap-cover-emb">{emb}</div><div className="rap-cover-meta">{meta}</div></div>;
}
function taux(v: number) { return v >= 90 ? PAL.vert : v >= 75 ? PAL.bleu : v >= 50 ? PAL.jaune : PAL.rouge; }

function SlideThumb({ no, title, sub, body }: { no: string; title: string; sub?: string; body: React.ReactNode }) {
  return (
    <div className="rap-slide">
      <div className="rap-band">
        <img src="/logo/oms-white.png" className="rap-oms" alt="OMS" />
        <img src="/logo/pev.png" className="rap-oms" alt="PEV" />
        <div className="rap-band-txt"><div className="rap-title">{title}</div>{sub ? <div className="rap-sub">{sub}</div> : null}</div>
        <div className="rap-no">{no}</div>
      </div>
      <div className="rap-body">{body}</div>
    </div>
  );
}

export default function TelechargerRapportPage() {
  const { data } = useSav();
  const filters = useFilters();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function download() {
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/rapports${filtersToQuery(filters)}`);
      if (!res.ok) {
        let msg = "Le rapport n'a pas pu être généré. Veuillez réessayer dans un instant.";
        try { const j = await res.json(); if (j?.error) msg = j.error; } catch { /* non-JSON */ }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "Rapport_automatique_SAV_Tshuapa.pptx";
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const k = data?.kpi;
  const tauxZones = (data?.resultats.tauxParZone ?? []).filter((z) => z.taux !== null).map((z) => z.taux as number);
  const antMissed = data ? [...data.cs.antigens].sort((a, b) => b.missedTotal - a.missedTotal).slice(0, 6).map((a) => a.missedTotal) : [];

  return (
    <div className="space-y-4">
      <div className="card card-pad flex items-center gap-3" style={{ background: "linear-gradient(90deg,#e7ecf6,#fff)" }}>
        <SavIcon name="report" solid="#00205c" soft="#cdd9ee" className="w-11 h-11 shrink-0 drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)]" />
        <div className="flex-1">
          <div className="text-[14px] font-extrabold text-navy-700">Rapport automatique SAV — Récupération des enfants</div>
          <div className="text-[11.5px] text-surface-700">Présentation PowerPoint enrichie (graphiques épurés, commentaires « Lecture PEV », logos OMS &amp; PEV) — générée à partir des données filtrées du tableau de bord.</div>
        </div>
      </div>

      {err ? <div className="rounded-lg border border-danger-200 bg-danger-50/50 px-3 py-2 text-[12px] text-danger-700">Erreur : {err}</div> : null}

      <div className="card card-pad">
        <div className="flex items-start gap-3">
          <SavIcon name="syringe" solid="#0093d5" soft="#cfe9f8" className="w-12 h-12 shrink-0 drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)]" />
          <div className="min-w-0">
            <div className="text-[13px] font-bold leading-snug text-navy-700">Rapport automatique SAV — Tshuapa</div>
            <div className="mt-1 text-[11px] leading-snug text-surface-600">
              11 diapositives : couverture, synthèse exécutive, identification IT &amp; relais, doses manquées par antigène,
              aires prioritaires, planification, résultats &amp; taux de récupération, supervision qualité, recommandations
              et narration automatique. Le rapport respecte les filtres (zone, aire, période) actifs.
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button onClick={download} disabled={busy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[11.5px] font-bold text-white disabled:opacity-60" style={{ background: "#0093d5" }}>
            <Icon name={busy ? "refresh" : "download"} className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
            {busy ? "Génération…" : "Télécharger .pptx"}
          </button>
          <span className="text-[10px] font-semibold text-surface-400">11 diapos</span>
        </div>
      </div>

      <section>
        <SectionBar icon="doc">Aperçu des diapositives</SectionBar>
        <div className="rap-grid">
          <SlideThumb no="01" title="Récupération des enfants — Tshuapa" sub="Semaine Africaine de la Vaccination"
            body={<Cover emb="RAPPORT SAV" meta={`${data?.filters.zones.join(" & ") || "Tshuapa"} · ${data ? fmtNum(k!.identifies) : "—"} identifiés`} />} />
          <SlideThumb no="02" title="Synthèse exécutive" sub="Identification · planification · récupération"
            body={<MiniKpis items={[
              { v: data ? fmtNum(k!.identifies) : "—", l: "Identifiés", c: PAL.bleu },
              { v: data ? fmtNum(k!.zeroDose) : "—", l: "Zéro dose", c: PAL.rouge },
              { v: data ? fmtNum(k!.vaccines) : "—", l: "Vaccinés", c: PAL.vert },
              { v: data ? fmtPct(k!.tauxRecuperation) : "—", l: "Taux récup.", c: PAL.jaune },
            ]} />} />
          <SlideThumb no="04" title="Doses manquées par antigène" sub="Centres de santé (IT)"
            body={<MiniBars vals={antMissed.length ? antMissed : [0]} colors={[PAL.rouge]} />} />
          <SlideThumb no="07" title="Taux de récupération par zone" sub="Vaccinés / identifiés"
            body={<MiniBars vals={tauxZones.length ? tauxZones : [0]} colors={(tauxZones.length ? tauxZones : [0]).map(taux)} />} />
          <SlideThumb no="06" title="Planification de la récupération" sub="AS avec / sans programme"
            body={<MiniKpis items={[
              { v: data ? `${k!.airesPlanifiees}/${k!.airesTotal}` : "—", l: "AS planifiées", c: PAL.bleu },
              { v: data ? fmtNum(k!.sessionsPlan) : "—", l: "Sessions", c: PAL.marine },
              { v: data ? fmtNum(k!.attendus) : "—", l: "Attendus", c: PAL.vert },
              { v: data ? fmtNum(k!.airesSansProgramme) : "—", l: "Sans prog.", c: PAL.rouge },
            ]} />} />
          <SlideThumb no="11" title="Narration & décisions" sub="Recommandations opérationnelles"
            body={<div className="rap-list"><div>✓ Microplanification renforcée</div><div>✓ Sessions avancées / mobiles ciblées</div><div>✓ Recherche active communautaire</div></div>} />
        </div>
      </section>
    </div>
  );
}
