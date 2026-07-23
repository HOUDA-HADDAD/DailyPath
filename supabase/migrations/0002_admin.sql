-- =============================================================================
-- DailyPath — Migration 0002 : vue administrateur (OPTIONNELLE)
-- =============================================================================
-- Fournit des statistiques AGRÉGÉES et ANONYMISÉES sur tout le groupe.
-- Désactivée côté produit tant que :
--   - NEXT_PUBLIC_ENABLE_ADMIN != 'true'  (frontend), et
--   - profiles.is_admin = true pour l'utilisateur concerné.
--
-- Vous pouvez exécuter cette migration dès maintenant sans risque : sans
-- utilisateur admin ni flag activé, elle reste inerte.
--
-- Pour nommer un admin plus tard :
--   update public.profiles set is_admin = true where id = '<uuid_utilisateur>';
-- =============================================================================

-- Helper : l'appelant est-il admin ? (SECURITY DEFINER pour lire profiles)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- Fonction d'agrégation : renvoie, par jour, des compteurs anonymisés.
-- Aucune donnée nominative n'est exposée (pas de user_id, pas de display_name).
create or replace function public.admin_group_daily_stats(
  from_date date default (current_date - interval '30 days')::date,
  to_date   date default current_date
)
returns table (
  entry_date        date,
  active_users      bigint,
  fajr_count        bigint,
  dhuhr_count       bigint,
  asr_count         bigint,
  maghrib_count     bigint,
  isha_count        bigint,
  reading_count     bigint,
  sport_count       bigint,
  silence_count     bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    e.entry_date,
    count(*)                                   as active_users,
    count(*) filter (where e.fajr)             as fajr_count,
    count(*) filter (where e.dhuhr)            as dhuhr_count,
    count(*) filter (where e.asr)              as asr_count,
    count(*) filter (where e.maghrib)          as maghrib_count,
    count(*) filter (where e.isha)             as isha_count,
    count(*) filter (where e.personal_reading) as reading_count,
    count(*) filter (where e.sport)            as sport_count,
    count(*) filter (where e.silence)          as silence_count
  from public.daily_entries e
  where public.is_admin()                       -- garde-fou : seuls les admins
    and e.entry_date between from_date and to_date
  group by e.entry_date
  order by e.entry_date;
$$;

-- Restreindre l'exécution aux utilisateurs authentifiés (la garde is_admin()
-- à l'intérieur filtre réellement l'accès).
revoke all on function public.admin_group_daily_stats(date, date) from public;
grant execute on function public.admin_group_daily_stats(date, date) to authenticated;

-- =============================================================================
-- Fin 0002
-- =============================================================================
