import { createClient } from "@supabase/supabase-js";

// Service-role client for server-only operations that must bypass RLS,
// e.g. uploading generated PDFs to Storage. Never import this into
// client components.
export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
