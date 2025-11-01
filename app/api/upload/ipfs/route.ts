import { NextRequest, NextResponse } from "next/server";
import { ipfsRpcAdd } from "@/lib/filebase";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as unknown as File | null;
    if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });
    const name = (form.get("name") as string) || (file as any)?.name || "upload.bin";
    const { cid, url } = await ipfsRpcAdd(file, name);
    return NextResponse.json({ ok: true, cid, url, name });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Upload failed" }, { status: 500 });
  }
}

