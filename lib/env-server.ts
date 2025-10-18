export const serverEnv = {
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  filebaseBucket: process.env.FILEBASE_BUCKET || "",
};

export function ensureServerEnv() {
  if (!serverEnv.supabaseUrl) throw new Error("SUPABASE_URL is not configured");
  if (!serverEnv.supabaseServiceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
}

export function ensureFilebaseEnv() {
  if (!process.env.FILEBASE_ACCESS_KEY_ID || !process.env.FILEBASE_SECRET_ACCESS_KEY) {
    throw new Error("FILEBASE_* credentials are not configured");
  }
  if (!serverEnv.filebaseBucket) {
    throw new Error("FILEBASE_BUCKET is not configured");
  }
}
