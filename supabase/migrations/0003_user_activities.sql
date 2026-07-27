-- =============================================================================
-- DailyPath — Migration 0003 : activités personnalisables par utilisateur
-- =============================================================================
-- Chaque utilisateur possède SA propre liste d'activités : il peut en créer,
-- modifier, supprimer, activer/désactiver, réordonner, choisir icône/couleur,
-- configurer un rappel et une récurrence.
--
-- Compatibilité : la colonne `storage` décrit OÙ la réponse est rangée dans
-- daily_entries. Les activités par défaut conservent leur mapping historique
-- (colonnes dédiées : fajr, quran_wird, …) → aucune donnée existante n'est
-- perdue et les analyses continuent de fonctionner. Les activités créées par
-- l'utilisateur utilisent { "kind": "jsonb_key" } → colonne `responses`,
-- donc AUCUNE migration n'est nécessaire pour ajouter une activité.
-- =============================================================================

create table if not exists public.user_activities (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,

  -- Clé stable. Pour les activités par défaut, correspond à la clé i18n
  -- (ex. 'sport'), ce qui permet de traduire le libellé automatiquement.
  activity_key text not null,

  -- Libellé personnalisé. NULL => on utilise la traduction de activity_key.
  label        text,
  -- Note explicative affichée en info-bulle. NULL => traduction i18n.
  note         text,

  category     text not null default 'custom',
  type         text not null check (type in ('boolean', 'scale', 'multi_checkbox')),

  -- Options d'un multi_checkbox : ["fajr", "dhuhr", …]
  options      jsonb,
  -- Paliers d'une échelle : [{"value":"complete","score":1}, …]
  scale        jsonb,

  icon         text not null default 'sparkles',
  color        text not null default 'primary',

  sort_order   integer not null default 0,
  enabled      boolean not null default true,
  required     boolean not null default false,
  counts_in_completion boolean not null default true,
  weight       numeric not null default 1 check (weight > 0),

  -- Mapping de stockage (voir lib/activities/config.ts → StorageMap)
  storage      jsonb not null,
  -- true = activité issue du catalogue par défaut (protège la clé/stockage)
  is_builtin   boolean not null default false,

  -- Rappel optionnel (heure locale de l'utilisateur)
  reminder_enabled boolean not null default false,
  reminder_time    time,

  -- Récurrence : {"kind":"daily"} | {"kind":"weekly","days":[1,3,5]}
  -- days : 0 = dimanche … 6 = samedi
  recurrence   jsonb not null default '{"kind":"daily"}'::jsonb,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint user_activities_key_unique unique (user_id, activity_key)
);

create index if not exists user_activities_user_order_idx
  on public.user_activities (user_id, sort_order);

drop trigger if exists trg_user_activities_updated_at on public.user_activities;
create trigger trg_user_activities_updated_at
  before update on public.user_activities
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security : chacun ne voit et ne modifie que ses propres activités
-- ----------------------------------------------------------------------------
alter table public.user_activities enable row level security;

drop policy if exists "user_activities_select_own" on public.user_activities;
create policy "user_activities_select_own"
  on public.user_activities for select
  using (auth.uid() = user_id);

drop policy if exists "user_activities_insert_own" on public.user_activities;
create policy "user_activities_insert_own"
  on public.user_activities for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_activities_update_own" on public.user_activities;
create policy "user_activities_update_own"
  on public.user_activities for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_activities_delete_own" on public.user_activities;
create policy "user_activities_delete_own"
  on public.user_activities for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Privilèges Data API (cohérent avec 0001 : exposition explicite)
-- ----------------------------------------------------------------------------
grant select, insert, update, delete on public.user_activities to authenticated;
revoke all on public.user_activities from anon;

-- =============================================================================
-- Fin 0003
-- =============================================================================
