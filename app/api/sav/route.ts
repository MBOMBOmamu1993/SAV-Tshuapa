import { NextRequest, NextResponse } from "next/server";
import { getSavData } from "@/lib/sav/kobo-client";
import { buildBundle, type Filters } from "@/lib/sav/analytics";
import { ENV } from "@/lib/server/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const force = sp.get("force") === "1";
  try {
    const data = await getSavData({ force });
    const bundle = buildBundle(data.seed, filters, { live: data.live, generatedAt: data.generatedAt });
    return NextResponse.json(bundle, {
      headers: { "Cache-Control": `public, max-age=0, s-maxage=${ENV.CACHE_TTL_SECONDS}, stale-while-revalidate=60` },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}
