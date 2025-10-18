import { NextRequest, NextResponse } from "next/server";
import { ensureFilebaseEnv, serverEnv } from "@/lib/env-server";
import { buildGatewayUrl, putObjectToFilebase } from "@/lib/filebase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    ensureFilebaseEnv();
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "file field is required" }, { status: 400 });
    const arrayBuffer = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    const ext = (file.name || "").split(".").pop() || "bin";
    const key = `attest/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { cid } = await putObjectToFilebase({
      bucket: serverEnv.filebaseBucket,
      key,
      body: buf,
      contentType: file.type || "application/octet-stream",
    });
    const url = cid ? buildGatewayUrl(cid) : null;
    return NextResponse.json({ ok: true, key, cid, url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}

