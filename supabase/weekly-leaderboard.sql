-- Weekly Taiwan leaderboard. Non-destructive: existing runs and RLS remain intact.
begin;
create or replace function public.cosmic_leaderboard(p_period text default 'event')
returns table(name text,score bigint,distance bigint,rank bigint,mine boolean)
language plpgsql security definer set search_path='' as $$
begin
 if p_period is null or p_period not in ('week','today','event') then raise exception '排行類別不正確'; end if;
 return query
 with best as (
 select distinct on (r.user_id) r.user_id,r.name,r.score,r.distance,r.submitted_at from public.cosmic_runs r
 where r.event_id='good-news-2026' and r.submitted_at is not null
 -- All public queries are restricted to the current week. Legacy 'event' requests
 -- remain compatible but may never expose archived weeks.
 and r.submitted_at >= (date_trunc('week',now() at time zone 'Asia/Taipei') at time zone 'Asia/Taipei')
 and r.submitted_at < ((date_trunc('week',now() at time zone 'Asia/Taipei')+interval '1 week') at time zone 'Asia/Taipei')
 and (p_period<>'today' or (r.submitted_at at time zone 'Asia/Taipei')::date=(now() at time zone 'Asia/Taipei')::date)
 order by r.user_id,r.score desc,r.distance desc,r.submitted_at asc,r.id
 ), ranked as (
 select b.*,row_number() over(order by b.score desc,b.distance desc,b.submitted_at asc,b.user_id) as position from best b
 )
 select x.name,x.score,x.distance,x.position,(auth.uid() is not null and x.user_id=auth.uid()) from ranked x
 where x.position<=100 or (auth.uid() is not null and x.user_id=auth.uid()) order by x.position;
end $$;
revoke all on function public.cosmic_leaderboard(text) from public;
grant execute on function public.cosmic_leaderboard(text) to anon,authenticated;
commit;
