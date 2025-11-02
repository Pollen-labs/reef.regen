import { supabaseAdmin } from "@/lib/supabase-admin";

export function toBaseHandle(input: string): string {
  return (input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function ensureUniqueHandle(base: string, existingId?: string): Promise<string> {
  const b = toBaseHandle(base || "");
  const fallback = "reef-user";
  if (!b) return fallback;
  let candidate = b;
  let suffix = 0;
  // Loop until a unique handle is found (case-insensitive), ignoring the existing profile if provided
  // Supabase returns PGRST116 when no rows, which we treat as available
  /* eslint no-constant-condition: 0 */
  while (true) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, handle")
      .ilike("handle", candidate)
      .maybeSingle();
    if (error && (error as any).code !== "PGRST116") throw error;
    if (!data || (existingId && data.id === existingId)) return candidate;
    suffix += 1;
    candidate = `${b}-${suffix}`;
  }
}

