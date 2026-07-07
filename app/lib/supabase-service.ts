import { createClient } from '@supabase/supabase-js';

// Service role client — bypasses RLS entirely.
// Only use server-side (API routes). Never expose to the browser.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
