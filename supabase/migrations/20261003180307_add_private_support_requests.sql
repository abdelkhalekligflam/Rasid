create table public.support_requests (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 kind text not null check (kind in ('bug','complaint','question')),
 subject text not null check (length(btrim(subject)) between 3 and 120),
 description text not null check (length(btrim(description)) between 10 and 4000),
 status text not null default 'open' check (status in ('open','in_progress','resolved')),
 response text check (response is null or length(response)<=4000),
 created_at timestamptz not null default now()
);
create index support_requests_user_created_idx on public.support_requests(user_id,created_at desc);
alter table public.support_requests enable row level security;
revoke all on public.support_requests from public,anon,authenticated;
grant select on public.support_requests to authenticated;
grant insert (kind,subject,description) on public.support_requests to authenticated;
grant all on public.support_requests to service_role;
create policy support_read_own on public.support_requests for select to authenticated using ((select auth.uid())=user_id);
create policy support_submit_own on public.support_requests for insert to authenticated with check ((select auth.uid())=user_id);
create function public.limit_support_requests() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.user_id::text, 57382));
 if (select count(*) from public.support_requests where user_id=new.user_id and created_at>now()-interval '24 hours')>=10 then
 raise exception 'support_daily_limit';
 end if;
 return new;
end $$;
revoke execute on function public.limit_support_requests() from public,anon,authenticated;
create trigger support_request_limit before insert on public.support_requests for each row execute function public.limit_support_requests();
