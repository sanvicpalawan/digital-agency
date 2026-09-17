-- merQato.digital Supabase bootstrap
-- Run this complete script in Supabase Dashboard > SQL Editor.
-- First create the administrator in Authentication > Users, then insert their user ID below.

create extension if not exists pgcrypto;

create table if not exists public.site_settings (
  id text primary key default 'main' check (id = 'main'),
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
alter table public.site_admins enable row level security;

-- Security-definer function keeps the list of administrator IDs inaccessible to the browser.
create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.site_admins where user_id = auth.uid()
  );
$$;

revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to anon, authenticated;

drop policy if exists "Public can read live site settings" on public.site_settings;
create policy "Public can read live site settings"
on public.site_settings for select
to anon, authenticated
using (true);

drop policy if exists "Only site admins can create site settings" on public.site_settings;
create policy "Only site admins can create site settings"
on public.site_settings for insert
to authenticated
with check (public.is_site_admin());

drop policy if exists "Only site admins can update site settings" on public.site_settings;
create policy "Only site admins can update site settings"
on public.site_settings for update
to authenticated
using (public.is_site_admin())
with check (public.is_site_admin());

drop policy if exists "Only site admins can delete site settings" on public.site_settings;
create policy "Only site admins can delete site settings"
on public.site_settings for delete
to authenticated
using (public.is_site_admin());

-- The default local design is seeded as a blank object. The first authenticated save
-- from the backoffice replaces it with the full site configuration.
insert into public.site_settings (id, content)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-assets',
  'site-assets',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4', 'video/webm']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view published site assets" on storage.objects;
create policy "Public can view published site assets"
on storage.objects for select
to public
using (bucket_id = 'site-assets');

drop policy if exists "Site admins can upload site assets" on storage.objects;
create policy "Site admins can upload site assets"
on storage.objects for insert
to authenticated
with check (bucket_id = 'site-assets' and public.is_site_admin());

drop policy if exists "Site admins can update site assets" on storage.objects;
create policy "Site admins can update site assets"
on storage.objects for update
to authenticated
using (bucket_id = 'site-assets' and public.is_site_admin())
with check (bucket_id = 'site-assets' and public.is_site_admin());

drop policy if exists "Site admins can remove site assets" on storage.objects;
create policy "Site admins can remove site assets"
on storage.objects for delete
to authenticated
using (bucket_id = 'site-assets' and public.is_site_admin());

-- After creating an Auth user, authorize it. Replace the UUID and run once:
-- insert into public.site_admins (user_id) values ('YOUR_AUTH_USER_UUID');