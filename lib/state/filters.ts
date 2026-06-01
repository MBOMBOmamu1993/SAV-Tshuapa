"use client";

import { create } from "zustand";

export interface FiltersState {
  province: string | null;
  antenne: string | null;
  zone: string | null;
  aire: string | null;
  months: string[];
  set: (patch: Partial<Omit<FiltersState, "set" | "reset" | "resetField">>) => void;
  reset: () => void;
  resetField: (field: "province" | "antenne" | "zone" | "aire" | "months") => void;
}

export const useFilters = create<FiltersState>((set) => ({
  province: null,
  antenne: null,
  zone: null,
  aire: null,
  months: [],
  set: (patch) => set(patch),
  reset: () => set({ province: null, antenne: null, zone: null, aire: null, months: [] }),
  resetField: (field) =>
    set((s) => {
      switch (field) {
        case "province": return { province: null, antenne: null, zone: null, aire: null };
        case "antenne": return { antenne: null, zone: null, aire: null };
        case "zone": return { zone: null, aire: null };
        case "aire": return { aire: null };
        case "months": return { months: [] };
        default: return s;
      }
    }),
}));

export type QueryFilters = Pick<FiltersState, "province" | "antenne" | "zone" | "aire" | "months">;

export function filtersToQuery(f: QueryFilters): string {
  const p = new URLSearchParams();
  if (f.province) p.set("province", f.province);
  if (f.antenne) p.set("antenne", f.antenne);
  if (f.zone) p.set("zone", f.zone);
  if (f.aire) p.set("aire", f.aire);
  if (f.months && f.months.length) p.set("months", f.months.join(","));
  const s = p.toString();
  return s ? `?${s}` : "";
}
