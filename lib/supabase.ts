// Supabase client factories. v1 has no auth — reads use the anon key,
// `/api/alerts/run` uses the service-role key for the inserts/updates it
// needs. Factories are functions (not module-level singletons) so import
// time stays cheap and missing-env errors surface at the actual call site.
//
// IMPORTANT: env-var access uses literal `process.env.NEXT_PUBLIC_FOO`.
// Next.js statically inlines those at build/dev-server start; dynamic
// access (`process.env[name]`) does NOT get replaced and resolves to
// undefined in client bundles.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

let _browser: SupabaseClient | null = null;

/** Singleton browser client — reads only, anon key, no session. */
export function browserClient(): SupabaseClient {
  if (_browser) return _browser;
  _browser = createClient(
    required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return _browser;
}

/** Server-side client with the anon key. Use from RSC and route handlers. */
export function serverAnonClient(): SupabaseClient {
  return createClient(
    required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    { auth: { persistSession: false } },
  );
}

/** Server-side client with the service-role key — `/api/alerts/run` only. */
export function serverServiceClient(): SupabaseClient {
  return createClient(
    required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
    { auth: { persistSession: false } },
  );
}
