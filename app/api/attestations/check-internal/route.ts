import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET /api/attestations/check-internal?address=0x..&value=ID
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = (searchParams.get('address') || '').trim();
  const value = (searchParams.get('value') || '').trim();
  if (!address || !value) return NextResponse.json({ exists: false }, { status: 200 });

  // Resolve profile id by wallet address (case-insensitive)
  const { data: prof, error: perr } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .ilike('wallet_address', address)
    .maybeSingle();
  if (perr) return NextResponse.json({ error: perr.message }, { status: 500 });
  const profileId = prof?.id as string | undefined;
  if (!profileId) return NextResponse.json({ exists: false }, { status: 200 });

  const { count, error } = await supabaseAdmin
    .from('attestation')
    .select('attestation_id', { count: 'exact', head: true })
    .eq('profile_id', profileId)
    .eq('internal_identifier', value);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ exists: (count ?? 0) > 0 }, { status: 200 });
}

