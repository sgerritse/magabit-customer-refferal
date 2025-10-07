-- Clean up incorrect badges and points for the specified user
with u as (
  select id from public.users where email = 'expectingdadjoe@dadderup.com'
),
pt as (
  delete from public.user_points
  where user_id in (select id from u)
    and (
      source_type = 'badge'
      or reason ilike 'Badge earned:%'
    )
  returning id
),
bg as (
  delete from public.user_badges
  where user_id in (select id from u)
  returning badge_id
)
select (select count(*) from bg) as badges_deleted,
       (select count(*) from pt) as points_deleted;