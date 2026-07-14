import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client for use in Client Components ("use client").
 * Reads the session from browser cookies set by the server helpers below.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
