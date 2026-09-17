import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SITE_SETTINGS_TABLE = 'site_settings';
export const SITE_ASSET_BUCKET = 'site-assets';

// The application stays usable in local-preview mode until project variables are supplied.
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const isSupabaseConfigured = Boolean(supabase);

export async function loadCloudSettings<T>() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(SITE_SETTINGS_TABLE)
    .select('content')
    .eq('id', 'main')
    .maybeSingle();

  if (error) throw error;
  return (data?.content as T | undefined) ?? null;
}

export async function persistCloudSettings<T>(settings: T) {
  if (!supabase) return false;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  const { error } = await supabase
    .from(SITE_SETTINGS_TABLE)
    .upsert(
      { id: 'main', content: settings, updated_at: new Date().toISOString() },
      { onConflict: 'id' },
    );

  if (error) throw error;
  return true;
}

function cleanFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-');
}

export async function uploadCloudAsset(file: File) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const path = `${id}-${cleanFileName(file.name)}`;
  const { error } = await supabase.storage
    .from(SITE_ASSET_BUCKET)
    .upload(path, file, { cacheControl: '3600', contentType: file.type, upsert: false });

  if (error) throw error;
  return `remote:${path}`;
}

export function getCloudAssetUrl(reference: string) {
  if (!supabase || !reference.startsWith('remote:')) return undefined;
  const path = reference.slice('remote:'.length);
  return supabase.storage.from(SITE_ASSET_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function removeCloudAsset(reference: string) {
  if (!supabase || !reference.startsWith('remote:')) return;
  const { error } = await supabase.storage.from(SITE_ASSET_BUCKET).remove([reference.slice('remote:'.length)]);
  if (error) throw error;
}