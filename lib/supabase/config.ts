const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const SUPABASE_URL = url;
export const SUPABASE_KEY = key;

// The starter .env ships "YOUR-..." placeholders; those count as "not configured".
export const supabaseConfigured =
  url.startsWith('https://') && !url.includes('YOUR-') && key !== '' && !key.startsWith('YOUR-');
