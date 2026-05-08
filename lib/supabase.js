import { createClient } from '@supabase/supabase-js';

let publicConfigPromise;
let browserClient;

function getInitialUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
}

function getInitialKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'local-anon-key';
}

async function fetchPublicConfig() {
  if (typeof window === 'undefined') {
    return {
      supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || getInitialUrl(),
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || getInitialKey(),
    };
  }
  if (!publicConfigPromise) {
    publicConfigPromise = fetch('/api/config')
      .then(resp => resp.ok ? resp.json() : null)
      .catch(() => null);
  }
  return publicConfigPromise;
}

export const isSupabaseConfigured = Boolean(getInitialUrl() && getInitialKey());

export const supabase = createClient(getInitialUrl(), getInitialKey());

export async function getSupabaseClient() {
  if (browserClient) return browserClient;
  const config = await fetchPublicConfig();
  browserClient = createClient(
    config?.supabaseUrl || getInitialUrl(),
    config?.supabaseAnonKey || getInitialKey()
  );
  return browserClient;
}

export function getServerSupabase(accessToken) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase server credentials are not configured.');
  }

  return createClient(
    supabaseUrl,
    supabaseKey,
    accessToken
      ? {
          global: {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        }
      : undefined
  );
}
