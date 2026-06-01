import { NextRequest, NextResponse } from "next/server";
import { getSavData } from "@/lib/sav/kobo-client";
import { buildBundle, type Filters } from "@/lib/sav/analytics";
import { buildSavDeck } from "@/lib/reports/report-data";
import { buildSavReport } from "@/lib/reports/pptx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
function periodLabel(months: string[]): string {
  if (!months.length) return "Toute la période";
  const fmt = (m: string) => {
    const x = m.match(/(\d{4})-(\d{2})/);
    if (!x) return m;
    const mi = parseInt(x[2], 10) - 1;
    return `${(MOIS[mi] ?? "").replace(/^./, (c) => c.toUpperCase())} ${x[1]}`;
  };
  const sorted = [...months].sort();
  return sorted.length === 1 ? fmt(sorted[0]) : `${fmt(sorted[0])} – ${fmt(sorted[sorted.length - 1])}`;
}

function multi(sp: URLSearchParams, key: string): string[] {
  const out: string[] = [];
  for (const v of sp.getAll(key)) for (const part of v.split(",")) { const t = part.trim(); if (t) out.push(t); }
  return out;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const filters: Filters = {
    province: sp.get("province"),
    antenne: sp.get("antenne"),
    zone: sp.get("zone"),
    aire: sp.get("aire"),
    months: multi(sp, "months"),
  };
  try {
    const data = await getSavData();
    const bundle = buildBundle(data.seed, filters, { live: data.live, generatedAt: data.generatedAt });
    const period = periodLabel(bundle.meta.months);
    const deck = buildSavDeck(bundle, period);
    const buffer = await buildSavReport(deck);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="Rapport_automatique_SAV_Tshuapa.pptx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `La génération du rapport a échoué. (${err instanceof Error ? err.message : String(err)})` },
      { status: 502 }
    );
  }
}
