create table public.account_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro')),
  status text not null default 'free' check (status in ('free','active','expired','cancelled')),
  provider text,
  payment_reference text unique,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  constraint pro_requires_payment check (plan <> 'pro' or (provider is not null and payment_reference is not null and current_period_end is not null)),
  constraint free_status check (plan <> 'free' or status = 'free')
);
alter table public.account_subscriptions enable row level security;
revoke all on public.account_subscriptions from anon, authenticated;
grant select on public.account_subscriptions to authenticated;
grant all on public.account_subscriptions to service_role;
create policy "Read own subscription" on public.account_subscriptions for select to authenticated using ((select auth.uid()) = user_id);
insert into public.account_subscriptions(user_id) select id from auth.users on conflict do nothing;
create function public.create_free_subscription() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.account_subscriptions(user_id) values(new.id) on conflict do nothing;
  return new;
end;
$$;
revoke execute on function public.create_free_subscription() from public, anon, authenticated;
create trigger create_free_subscription after insert on auth.users for each row execute function public.create_free_subscription();
create function public.enforce_free_plan_limits() returns trigger language plpgsql security invoker set search_path = '' as $$
declare pro boolean; used bigint; month_start timestamptz;
begin
  -- Serialize per-account checks so concurrent inserts cannot bypass limits.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.user_id::text, 83949));
  select exists(select 1 from public.account_subscriptions s where s.user_id=new.user_id and s.plan='pro' and s.status='active' and s.provider is not null and s.payment_reference is not null and s.current_period_end>now()) into pro;
  if tg_table_name='transactions' then
    if tg_op='UPDATE' then new.created_at := old.created_at; return new; end if;
    new.created_at := now();
    if pro then return new; end if;
    month_start := date_trunc('month', now() at time zone 'UTC') at time zone 'UTC';
    select count(*) into used from public.transactions where user_id=new.user_id and created_at>=month_start;
    if used>=50 then raise exception 'FREE_LIMIT_TRANSACTIONS'; end if;
  elsif tg_table_name='budgets' then
    if not coalesce(new.is_active,false) or (tg_op='UPDATE' and coalesce(old.is_active,false)) or pro then return new; end if;
    select count(*) into used from public.budgets where user_id=new.user_id and is_active=true and id<>new.id;
    if used>=3 then raise exception 'FREE_LIMIT_BUDGETS'; end if;
  elsif tg_table_name='savings_goals' then
    if tg_op='UPDATE' or pro then return new; end if;
    select count(*) into used from public.savings_goals where user_id=new.user_id;
    if used>=3 then raise exception 'FREE_LIMIT_GOALS'; end if;
  elsif tg_table_name='categories' then
    if new.is_default or tg_op='UPDATE' or pro then return new; end if;
    select count(*) into used from public.categories where user_id=new.user_id and is_default=false;
    if used>=5 then raise exception 'FREE_LIMIT_CATEGORIES'; end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.enforce_free_plan_limits() from public,anon,authenticated;
create trigger enforce_free_plan_transactions before insert or update on public.transactions for each row execute function public.enforce_free_plan_limits();
create trigger enforce_free_plan_budgets before insert or update on public.budgets for each row execute function public.enforce_free_plan_limits();
create trigger enforce_free_plan_goals before insert on public.savings_goals for each row execute function public.enforce_free_plan_limits();
create trigger enforce_free_plan_categories before insert on public.categories for each row execute function public.enforce_free_plan_limits();
create index transactions_user_created_at_idx on public.transactions(user_id,created_at);
