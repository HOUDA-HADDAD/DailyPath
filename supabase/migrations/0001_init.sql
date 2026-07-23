-- =============================================================================
-- DailyPath — Migration 0001 : schéma initial
-- =============================================================================
-- À exécuter dans Supabase > SQL Editor (copier/coller tout le fichier).
-- Idempotent autant que possible (IF NOT EXISTS / OR REPLACE).
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1) Types énumérés (échelles de réponse)
--    Extensibilité : pour ajouter une valeur plus tard ->
--      ALTER TYPE wird_scale ADD VALUE 'nouvelle_valeur';
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'wird_scale') then
    create type wird_scale as enum ('complete', 'partial', 'none');
  end if;
  if not exists (select 1 from pg_type where typname = 'program_scale') then
    create type program_scale as enum ('all', 'partial', 'none');
  end if;
  if not exists (select 1 from pg_type where typname = 'adhkar_scale') then
    create type adhkar_scale as enum ('both', 'one', 'none');
  end if;
  if not exists (select 1 from pg_type where typname = 'rest_scale') then
    create type rest_scale as enum ('healthy', 'draining', 'none');
  end if;
end$$;

-- ----------------------------------------------------------------------------
-- 2) Fonction utilitaire : mise à jour automatique de updated_at
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3) Table profiles (1 ligne par utilisateur auth)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text        not null default '',
  locale       text        not null default 'en',   -- 'en' | 'ar'
  is_admin     boolean     not null default false,   -- réservé à la vue admin (0002)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 4) Table daily_entries (1 ligne par utilisateur et par jour)
-- ----------------------------------------------------------------------------
create table if not exists public.daily_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  entry_date  date not null,

  -- Les cinq prières obligatoires (cases à cocher multiples)
  fajr        boolean not null default false,
  dhuhr       boolean not null default false,
  asr         boolean not null default false,
  maghrib     boolean not null default false,
  isha        boolean not null default false,

  -- Wird du Coran (avec tafsir) et wird du hadith — échelle complete/partial/none
  quran_wird  wird_scale,
  hadith_wird wird_scale,

  -- Prières surérogatoires (sunnah fajr, duha, witr) — tableau JSON optionnel
  nafl_prayers jsonb,

  -- Adhkar du matin et du soir — échelle both/one/none
  adhkar_morning_evening adhkar_scale,

  -- Adhkar quotidiens divers — tableau JSON optionnel
  daily_adhkar jsonb,

  -- Wird envoyé par le canal du programme — échelle all/partial/none
  program_wird program_scale,

  -- Lecture personnelle (spécialité) et sport — oui/non
  personal_reading boolean not null default false,
  sport            boolean not null default false,

  -- Détente / repos — échelle healthy/draining/none
  rest rest_scale,

  -- Devoir de silence — oui (même partiel) / non
  silence boolean not null default false,

  -- Espace d'extension : futures activités sans migration de colonne.
  -- Ex. { "activity_id": <valeur> } lu/écrit via lib/activities.
  responses jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Une seule entrée par utilisateur et par jour
  constraint daily_entries_user_date_unique unique (user_id, entry_date)
);

create index if not exists daily_entries_user_date_idx
  on public.daily_entries (user_id, entry_date desc);

drop trigger if exists trg_daily_entries_updated_at on public.daily_entries;
create trigger trg_daily_entries_updated_at
  before update on public.daily_entries
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5) Row Level Security
--    Chaque utilisateur ne voit et ne modifie QUE ses propres données.
-- ----------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.daily_entries  enable row level security;

-- profiles ------------------------------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- daily_entries -------------------------------------------------------------
drop policy if exists "daily_entries_select_own" on public.daily_entries;
create policy "daily_entries_select_own"
  on public.daily_entries for select
  using (auth.uid() = user_id);

drop policy if exists "daily_entries_insert_own" on public.daily_entries;
create policy "daily_entries_insert_own"
  on public.daily_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "daily_entries_update_own" on public.daily_entries;
create policy "daily_entries_update_own"
  on public.daily_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "daily_entries_delete_own" on public.daily_entries;
create policy "daily_entries_delete_own"
  on public.daily_entries for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6) Privilèges Data API (exposition explicite)
--    Rend l'app fonctionnelle même avec "Automatically expose new tables" = OFF.
--    On expose UNIQUEMENT au rôle `authenticated` (utilisateur connecté) ;
--    le rôle `anon` (déconnecté) n'a aucun accès aux données. Les policies RLS
--    ci-dessus restent la véritable barrière : elles filtrent ligne par ligne.
-- ----------------------------------------------------------------------------
grant usage on schema public to authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.daily_entries to authenticated;

-- Par prudence : s'assurer que le rôle déconnecté n'a rien sur ces tables.
revoke all on public.profiles      from anon;
revoke all on public.daily_entries from anon;

-- =============================================================================
-- Fin 0001
-- =============================================================================
