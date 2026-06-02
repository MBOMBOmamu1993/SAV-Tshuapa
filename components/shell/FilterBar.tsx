"use client";

import { usePathname } from "next/navigation";
import { useFilters } from "@/lib/state/filters";
import { useSav } from "@/lib/client/api";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SavIcon, type SavIconName } from "@/components/ui/SavIcon";
import { cascadeOptions, type GeoTuple } from "@/lib/geo";
import { PeriodFilter } from "./PeriodFilter";

/** Petite icône colorée (17 px) affichée devant chaque label de filtre (spec 03). */
type LabelIcon = { name: SavIconName; solid: string; soft: string };
const FILTER_ICON: Record<string, LabelIcon> = {
  province: { name: "pin", solid: "#0093d5", soft: "#d8eefb" },
  antenne: { name: "pin", solid: "#1f9d57", soft: "#dcf3e7" },
  zone: { name: "pin", solid: "#7c3aed", soft: "#eee2fd" },
  aire: { name: "clinicCheck", solid: "#0d9488", soft: "#d6f2ee" },
  periode: { name: "calendar", solid: "#f59e0b", soft: "#fdeecd" },
};

const PILL: Record<string, string> = {
  "/": "Synthèse exécutive",
  "/identification-cs": "Identification · Centre de santé",
  "/identification-relais": "Identification · Relais",
  "/planification": "Planification",
  "/resultats": "Résultats de récupération",
  "/supervision": "Supervision des équipes",
  "/telecharger-rapport": "Télécharger Rapport",
};

function FieldLabel({ children, onReset, active, labelIcon }: { children: React.ReactNode; onReset?: () => void; active?: boolean; labelIcon?: LabelIcon }) {
  return (
    <div className="flex items-center justify-between px-0.5">
      <label className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.09em] text-slate-500">
        {labelIcon ? <SavIcon name={labelIcon.name} solid={labelIcon.solid} soft={labelIcon.soft} className="h-[17px] w-[17px] shrink-0" /> : null}
        {children}
      </label>
      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          disabled={!active}
          title="Réinitialiser ce filtre"
          className="inline-flex h-[15px] w-[15px] items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-oms-600 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
        >
          <Icon name="refresh" className="h-[11px] w-[11px]" strokeWidth={2.4} />
        </button>
      ) : null}
    </div>
  );
}

function Select({ label, icon, labelIcon, from, to, value, onChange, onReset, options, placeholder }: {
  label: string; icon: IconName; labelIcon?: LabelIcon; from: string; to: string;
  value: string | null; onChange: (v: string | null) => void; onReset?: () => void; options: string[]; placeholder: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-[3px]">
      <FieldLabel onReset={onReset} active={!!value} labelIcon={labelIcon}>{label}</FieldLabel>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-oms-500">
        <span className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md text-white" style={{ background: `linear-gradient(145deg, ${from}, ${to})` }}>
          <Icon name={icon} className="h-[13px] w-[13px]" strokeWidth={2} />
        </span>
        <select className="w-full cursor-pointer bg-transparent text-[12.5px] font-bold text-navy-700 outline-none" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">{placeholder}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    </div>
  );
}

export function FilterBar() {
  const pathname = usePathname();
  const f = useFilters();
  const { data } = useSav();
  const opt = data?.filters;
  const pill = PILL[pathname] ?? "Tableau de bord";

  const tuples: GeoTuple[] = (opt?.geo as GeoTuple[]) ?? [];
  const geo = cascadeOptions(tuples, { province: f.province, antenne: f.antenne, zone: f.zone, aire: f.aire });
  const anyActive = !!(f.province || f.antenne || f.zone || f.aire || f.months.length);

  return (
    <div className="relative z-20 shrink-0 border-b border-slate-200 bg-white">
      <div className="px-4 py-2.5">
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-extrabold uppercase tracking-[0.04em] text-white shadow-[0_4px_14px_-6px_rgba(0,32,92,.5)]"
            style={{ background: "linear-gradient(90deg,#00205c,#0a3a86)" }}>
            {pill}
          </span>
          <button
            type="button"
            onClick={() => f.reset()}
            disabled={!anyActive}
            title="Réinitialiser tous les filtres"
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-bold text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-oms-500 hover:text-oms-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="refresh" className="h-[13px] w-[13px]" strokeWidth={2.2} />
            Réinitialiser les filtres
          </button>
        </div>
        <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Select label="Province" icon="map-pin" labelIcon={FILTER_ICON.province} from="#19c2b1" to="#0d9488" placeholder="Toutes"
            value={f.province} onChange={(v) => f.set({ province: v, antenne: null, zone: null, aire: null })} onReset={() => f.resetField("province")} options={geo.provinces} />
          <Select label="Antenne" icon="tower" labelIcon={FILTER_ICON.antenne} from="#36b3ec" to="#0093d5" placeholder="Toutes"
            value={f.antenne} onChange={(v) => f.set({ antenne: v, zone: null, aire: null })} onReset={() => f.resetField("antenne")} options={geo.antennes} />
          <Select label="Zone de santé" icon="building" labelIcon={FILTER_ICON.zone} from="#9d5cf5" to="#7c3aed" placeholder="Toutes"
            value={f.zone} onChange={(v) => f.set({ zone: v, aire: null })} onReset={() => f.resetField("zone")} options={geo.zones} />
          <Select label="Aire de santé" icon="clinic" labelIcon={FILTER_ICON.aire} from="#2bbd6b" to="#1f9d57" placeholder="Toutes"
            value={f.aire} onChange={(v) => f.set({ aire: v })} onReset={() => f.resetField("aire")} options={geo.aires} />
          <div className="flex min-w-0 flex-col gap-[3px]">
            <FieldLabel onReset={() => f.resetField("months")} active={f.months.length > 0} labelIcon={FILTER_ICON.periode}>Période</FieldLabel>
            <PeriodFilter value={f.months} available={opt?.months ?? []} onChange={(m) => f.set({ months: m })} />
          </div>
        </div>
      </div>
    </div>
  );
}
