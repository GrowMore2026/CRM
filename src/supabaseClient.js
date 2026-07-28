import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const SUPABASE_CONFIGURED_EXTERNALLY = Boolean(url && anonKey)

export const SUPABASE_URL = url || ''
export const SUPABASE_ANON_KEY = anonKey || ''

if (
  import.meta.env.DEV &&
  !SUPABASE_CONFIGURED_EXTERNALLY &&
  (import.meta.env.VITE_SUPABASE_URL !== undefined ||
    import.meta.env.VITE_SUPABASE_ANON_KEY !== undefined)
) {
  console.error(
    '[supabase] Set both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env (copy from Dashboard → API).'
  )
}

try {
  const parsed = new URL(SUPABASE_URL);
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('invalid protocol');
  }
} catch {
  console.error('[supabase] Invalid VITE_SUPABASE_URL:', SUPABASE_URL);
}

/**
 * PostgREST table name exposed at `/rest/v1/<this>`.
 * Use `client` if your Postgres table is singular; default matches typical `clients` tables.
 */
export const CLIENTS_TABLE =
  import.meta.env.VITE_SUPABASE_CLIENTS_TABLE?.trim() || 'clients'

/** App uses table reads/writes only (no Supabase Auth). Disable auth realtime/storage to avoid extra connections. */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})
