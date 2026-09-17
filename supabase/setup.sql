-- Run (or re-run safely) in this project's Supabase SQL Editor. No service-role key in the website.
begin;
create table if not exists public.cosmic_runs (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 started_at timestamptz not null default now(),
 submitted_at timestamptz,
 name text,
 score bigint,
 distance bigint,
 cards integer,
 event_id text not null default 'good-news-2026'
);
create index if not exists cosmic_runs_user_time on public.cosmic_runs(user_id,started_at desc);
create index if not exists cosmic_runs_board on public.cosmic_runs(event_id,score desc,distance desc) where submitted_at is not null;
alter table public.cosmic_runs enable row level security;
revoke all on public.cosmic_runs from anon,authenticated;

create or replace function public.cosmic_begin_run() returns uuid
language plpgsql security definer set search_path='' as $$
declare owner_id uuid:=auth.uid(); new_id uuid;
begin
 if owner_id is null then raise exception '請先匿名登入'; end if;
 perform pg_advisory_xact_lock(hashtextextended(owner_id::text,0));
 if exists(select 1 from public.cosmic_runs where user_id=owner_id and started_at>now()-interval '2 seconds') then raise exception '請稍候再試'; end if;
 if (select count(*) from public.cosmic_runs where user_id=owner_id and started_at>now()-interval '1 day')>=500 then raise exception '今日場次已達上限'; end if;
 insert into public.cosmic_runs(user_id) values(owner_id) returning id into new_id;
 return new_id;
end $$;

create or replace function public.cosmic_submit_run(p_run uuid,p_name text,p_distance double precision,p_seconds double precision,p_before integer,p_after integer)
returns bigint language plpgsql security definer set search_path='' as $$
declare r public.cosmic_runs; owner_id uuid:=auth.uid(); gate_time double precision;
 elapsed_after double precision; expected_distance double precision; calculated bigint;
begin
 if owner_id is null then raise exception '請先匿名登入'; end if;
 select * into r from public.cosmic_runs where id=p_run and user_id=owner_id for update;
 if not found then raise exception '找不到本局紀錄'; end if;
 -- Retry-safe: an already committed session cannot be submitted twice or changed.
 if r.submitted_at is not null then return r.score; end if;
 if p_name is null or char_length(trim(p_name)) not between 1 and 10 then raise exception '暱稱需為 1–10 個字'; end if;
 if p_distance is null or p_seconds is null or p_before is null or p_after is null
   or not(p_distance>=0 and p_distance<1e12) or not(p_seconds>0 and p_seconds<=14400)
   or p_before<0 or p_after<0 then raise exception '成績格式不正確'; end if;
 if p_seconds>extract(epoch from now()-r.started_at)+2 then raise exception '遊戲時間不符'; end if;
 gate_time:=(-210+sqrt(210*210+2*1.8*(1000/.12)))/1.8;
 if p_seconds<=gate_time then expected_distance:=(210*p_seconds+.5*1.8*p_seconds*p_seconds)*.12;
 else elapsed_after:=p_seconds-gate_time;
 expected_distance:=1000+((210+1.8*gate_time)*elapsed_after+.5*7.2*elapsed_after*elapsed_after)*.12; end if;
 -- Allow fixed-step integration rounding; pauses are excluded from client simulation time.
 if abs(p_distance-expected_distance)>5+p_seconds*.03 then raise exception '距離與遊戲時間不符'; end if;
 if p_before+p_after>floor(p_seconds/1.25)+2 or p_before>floor(least(p_seconds,gate_time)/1.25)+2
   or (p_distance<1000 and p_after>0) then raise exception '邀請卡數量不符'; end if;
 calculated:=floor(least(p_distance,1000)+greatest(p_distance-1000,0)*1.5+p_before*100+p_after*150
   +case when p_distance>=1000 then 2000+floor((p_distance-1000)/500)*500 else 0 end);
 update public.cosmic_runs set name=trim(p_name),score=calculated,distance=floor(p_distance),cards=p_before+p_after,submitted_at=now() where id=p_run;
 return calculated;
end $$;

create or replace function public.cosmic_leaderboard(p_period text default 'event')
returns table(name text,score bigint,distance bigint,rank bigint,mine boolean)
language plpgsql security definer set search_path='' as $$
begin
 if p_period is null or p_period not in ('today','event') then raise exception '排行類別不正確'; end if;
 return query
 with best as (
 select distinct on (r.user_id) r.user_id,r.name,r.score,r.distance,r.submitted_at from public.cosmic_runs r
 where r.event_id='good-news-2026' and r.submitted_at is not null
 and (p_period='event' or (r.submitted_at at time zone 'Asia/Taipei')::date=(now() at time zone 'Asia/Taipei')::date)
 order by r.user_id,r.score desc,r.distance desc,r.submitted_at asc,r.id
 ), ranked as (
 select b.*,row_number() over(order by b.score desc,b.distance desc,b.submitted_at asc,b.user_id) as position from best b
 )
 select x.name,x.score,x.distance,x.position,(auth.uid() is not null and x.user_id=auth.uid()) from ranked x
 where x.position<=100 or (auth.uid() is not null and x.user_id=auth.uid()) order by x.position;
end $$;
create or replace function public.cosmic_delete_my_runs()
returns integer language plpgsql security definer set search_path='' as $$
declare removed integer;
begin
 if auth.uid() is null then raise exception '請先匿名登入'; end if;
 delete from public.cosmic_runs where user_id=auth.uid();
 get diagnostics removed = row_count;
 return removed;
end $$;
revoke all on function public.cosmic_begin_run() from public,anon;
revoke all on function public.cosmic_submit_run(uuid,text,double precision,double precision,integer,integer) from public,anon;
revoke all on function public.cosmic_leaderboard(text) from public,anon;
revoke all on function public.cosmic_delete_my_runs() from public,anon;
grant execute on function public.cosmic_begin_run() to authenticated;
grant execute on function public.cosmic_submit_run(uuid,text,double precision,double precision,integer,integer) to authenticated;
grant execute on function public.cosmic_leaderboard(text) to authenticated;
grant execute on function public.cosmic_leaderboard(text) to anon;
grant execute on function public.cosmic_delete_my_runs() to authenticated;
commit;
