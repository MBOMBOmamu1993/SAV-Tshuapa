import { NextResponse } from "next/server";
import { flushSavCache, getSavData } from "@/lib/sav/kobo-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  flushSavCache();
  const data = await getSavData({ force: true });
  return NextResponse.json({ ok: true, live: data.live, generatedAt: data.generatedAt });
}
