/**
 * Client de données SAV.
 *
 * L'activité (Semaine Africaine de la Vaccination) étant terminée, la source
 * de référence est le SEED figé (data/sav-seed.json), garanti disponible.
 * Lorsqu'une authentification Kobo est configurée, on tente une resynchro
 * « live » des exports XLSX (mêmes export-settings que la supervision
 * conjointe) ; en cas de succès, les données live remplacent le seed.
 */
import pRetry, { AbortError } from "p-retry";
import * as XLSX from "xlsx";
import { ENV, koboAuthHeader, hasKoboAuth } from "@/lib/server/env";
import { SAV_SOURCES, koboExportUrl, type SavSource } from "@/config/sav.config";
import seedJson from "@/data/sav-seed.json";
import type { RawRow, SavSeed } from "./types";
import { normalizeIdent, normalizePlan, normalizeResult, normalizeSuperv } from "./normalize";

const TIMEOUT_MS = 45_000;
const MAX_ATTEMPTS = 3;

type CacheEntry = { at: number; value: SavSeed; live: boolean };
let cache: CacheEntry | null = null;

export function getSeed(): SavSeed {
  return seedJson as unknown as SavSeed;
}

async function fetchBuffer(url: string): Promise<ArrayBuffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "User-Agent": "SAV-Tshuapa/1.0", ...koboAuthHeader() },
      cache: "no-store",
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new AbortError(`Kobo ${res.status} — ${url}`);
      throw new Error(`Kobo ${res.status} ${res.statusText} — ${url}`);
    }
    return await res.arrayBuffer();
  } finally {
    clearTimeout(timer);
  }
}

/** Renvoie toutes les feuilles d'un classeur sous forme de lignes JSON. */
function readSheets(buf: ArrayBuffer): Record<string, RawRow[]> {
  const wb = XLSX.read(buf, { type: "array" });
  const out: Record<string, RawRow[]> = {};
  for (const name of wb.SheetNames) {
    out[name] = XLSX.utils.sheet_to_json<RawRow>(wb.Sheets[name], { defval: null, raw: false });
  }
  return out;
}

/** Sépare la feuille « parent » (la plus large) de la sous-feuille répétée. */
function splitSheets(sheets: Record<string, RawRow[]>, childName: string): { parents: RawRow[]; children: RawRow[] } {
  const names = Object.keys(sheets);
  const child = names.find((nm) => nm.toLowerCase().includes(childName)) ?? null;
  const parentName = names.find((nm) => nm !== child) ?? names[0];
  return { parents: sheets[parentName] ?? [], children: child ? sheets[child] ?? [] : [] };
}

async function fetchSource(src: SavSource): Promise<Record<string, RawRow[]>> {
  const url = koboExportUrl(src, ENV.KOBO_BASE_URL);
  const buf = await pRetry(() => fetchBuffer(url), { retries: MAX_ATTEMPTS - 1, minTimeout: 1000, maxTimeout: 4000 });
  return readSheets(buf);
}

async function fetchLive(): Promise<SavSeed> {
  const byKey = Object.fromEntries(SAV_SOURCES.map((s) => [s.key, s]));
  const [cs, relais, planif, resultats, superv] = await Promise.all([
    fetchSource(byKey["ident_cs"]),
    fetchSource(byKey["ident_relais"]),
    fetchSource(byKey["planif"]),
    fetchSource(byKey["resultats"]),
    fetchSource(byKey["superv"]),
  ]);
  const csS = splitSheets(cs, "enfant");
  const relS = splitSheets(relais, "enfant");
  const planS = splitSheets(planif, "session");
  const resName = Object.keys(resultats)[0];
  const supName = Object.keys(superv)[0];
  return {
    identCs: normalizeIdent(csS.parents, csS.children, "cs"),
    identRelais: normalizeIdent(relS.parents, relS.children, "relais"),
    planif: normalizePlan(planS.parents, planS.children),
    resultats: normalizeResult(resultats[resName] ?? []),
    superv: normalizeSuperv(superv[supName] ?? []),
    generatedAt: new Date().toISOString(),
  };
}

export interface SavData {
  seed: SavSeed;
  live: boolean;
  generatedAt: string;
}

/** Récupère les données SAV (live si possible, sinon seed) avec cache TTL. */
export async function getSavData(opts: { force?: boolean } = {}): Promise<SavData> {
  if (!opts.force && cache && (Date.now() - cache.at) / 1000 <= ENV.CACHE_TTL_SECONDS) {
    return { seed: cache.value, live: cache.live, generatedAt: new Date(cache.at).toISOString() };
  }
  if (hasKoboAuth()) {
    try {
      const live = await fetchLive();
      const hasRows = live.identCs.length || live.resultats.length || live.planif.length;
      if (hasRows) {
        cache = { at: Date.now(), value: live, live: true };
        return { seed: live, live: true, generatedAt: live.generatedAt! };
      }
    } catch {
      /* repli silencieux sur le seed */
    }
  }
  const seed = getSeed();
  cache = { at: Date.now(), value: seed, live: false };
  return { seed, live: false, generatedAt: seed.generatedAt ?? new Date().toISOString() };
}

export function flushSavCache(): void {
  cache = null;
}
