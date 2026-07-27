-- =============================================================================
-- DailyPath — Migration 0004 : simplification des statistiques d'administration
-- =============================================================================
-- La vue d'administration ne conserve que deux informations :
--   - la date
--   - le nombre de membres actifs ce jour-là
--
-- Toutes les autres statistiques (détail par prière, lecture, sport, silence)
-- sont retirées : elles n'apportaient pas de lecture utile au niveau groupe et
-- rapprochaient inutilement les données de l'individu.
--
-- Le type de retour change : PostgreSQL impose donc un DROP avant recréation.
-- Cette migration est sûre à rejouer et fonctionne que 0002 ait été appliqué
-- dans son ancienne ou sa nouvelle version.
-- =============================================================================

drop function if exists public.admin_group_daily_stats(date, date);

create function public.admin_group_daily_stats(
  from_date date default (current_date - interval '30 days')::date,
  to_date   date default current_date
)
returns table (
  entry_date   date,
  active_users bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    e.entry_date,
    count(distinct e.user_id) as active_users
  from public.daily_entries e
  where public.is_admin()                      -- garde-fou : seuls les admins
    and e.entry_date between from_date and to_date
  group by e.entry_date
  order by e.entry_date desc;
$$;

revoke all on function public.admin_group_daily_stats(date, date) from public;
grant execute on function public.admin_group_daily_stats(date, date) to authenticated;

-- =============================================================================
-- Fin 0004
-- =============================================================================
