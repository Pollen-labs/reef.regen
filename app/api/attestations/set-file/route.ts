import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Body = {
  uid?: string | null;
  attestation_id?: string | null;
  file_cid?: string | null;
  file_gateway_url?: string | null;
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const file_cid = body.file_cid ?? null;
  const file_gateway_url = body.file_gateway_url ?? null;
  if (!file_cid && !file_gateway_url) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    if (body.attestation_id) {
      const { error } = await supabaseAdmin
        .from("attestations")
        .update({ file_cid, file_gateway_url })
        .eq("id", body.attestation_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, by: "id" });
    }
    if (body.uid) {
      const { error } = await supabaseAdmin
        .from("attestations")
        .update({ file_cid, file_gateway_url })
        .eq("uid", body.uid);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, by: "uid" });
    }
    return NextResponse.json({ error: "Provide uid or attestation_id" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}

