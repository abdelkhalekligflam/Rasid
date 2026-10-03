-- Run with an admin connection. Every fixture and paid state is rolled back.
begin;
do $$
declare u uuid := gen_random_uuid(); c uuid; archived uuid; i integer;
begin
  insert into auth.users(id,email,raw_user_meta_data) values(u,'plan-test-'||u::text||'@example.invalid','{"full_name":"Plan test","currency":"MAD","plan":"pro"}'::jsonb);
  if not exists(select 1 from public.account_subscriptions where user_id=u and plan='free' and status='free') then raise exception 'New user not Free'; end if;
  select id into c from public.categories where user_id=u and type='expense' limit 1;
  for i in 1..50 loop insert into public.transactions(user_id,category_id,amount,type,transaction_date,created_at) values(u,c,1,'expense',current_date,'2000-01-01'); end loop;
  if exists(select 1 from public.transactions where user_id=u and created_at<'2020-01-01') then raise exception 'Timestamp bypass'; end if;
  begin insert into public.transactions(user_id,category_id,amount,type,transaction_date) values(u,c,1,'expense',current_date); raise exception 'Transaction cap bypass'; exception when raise_exception then if sqlerrm <> 'FREE_LIMIT_TRANSACTIONS' then raise; end if; end;
  for i in 1..3 loop insert into public.budgets(user_id,category_id,amount_limit,start_date) values(u,c,10,current_date); insert into public.savings_goals(user_id,name,target_amount) values(u,'Goal '||i,10); end loop;
  begin insert into public.budgets(user_id,category_id,amount_limit,start_date) values(u,c,10,current_date); raise exception 'Budget cap bypass'; exception when raise_exception then if sqlerrm <> 'FREE_LIMIT_BUDGETS' then raise; end if; end;
  begin insert into public.savings_goals(user_id,name,target_amount) values(u,'Extra',10); raise exception 'Goal cap bypass'; exception when raise_exception then if sqlerrm <> 'FREE_LIMIT_GOALS' then raise; end if; end;
  select id into archived from public.budgets where user_id=u limit 1;
  update public.budgets set is_active=false where id=archived;
  insert into public.budgets(user_id,category_id,amount_limit,start_date) values(u,c,10,current_date);
  begin update public.budgets set is_active=true where id=archived; raise exception 'Reactivation cap bypass'; exception when raise_exception then if sqlerrm <> 'FREE_LIMIT_BUDGETS' then raise; end if; end;
  for i in 1..5 loop insert into public.categories(user_id,name,type,is_default) values(u,'Custom '||i,'expense',false); end loop;
  begin insert into public.categories(user_id,name,type,is_default) values(u,'Extra','expense',false); raise exception 'Category cap bypass'; exception when raise_exception then if sqlerrm <> 'FREE_LIMIT_CATEGORIES' then raise; end if; end;
  update public.account_subscriptions set plan='pro',status='active',provider='test',payment_reference='test-'||u::text,current_period_end=now()+interval '1 month' where user_id=u;
  insert into public.transactions(user_id,category_id,amount,type,transaction_date) values(u,c,1,'expense',current_date);
  insert into public.budgets(user_id,category_id,amount_limit,start_date) values(u,c,10,current_date);
  insert into public.savings_goals(user_id,name,target_amount) values(u,'Paid',10);
  insert into public.categories(user_id,name,type,is_default) values(u,'Paid','expense',false);
  update public.account_subscriptions set current_period_end=now()-interval '1 day' where user_id=u;
  begin insert into public.savings_goals(user_id,name,target_amount) values(u,'Expired',10); raise exception 'Expired Pro bypass'; exception when raise_exception then if sqlerrm <> 'FREE_LIMIT_GOALS' then raise; end if; end;
  if has_table_privilege('authenticated','public.account_subscriptions','INSERT') or has_table_privilege('authenticated','public.account_subscriptions','UPDATE') or has_table_privilege('anon','public.account_subscriptions','SELECT') then raise exception 'Subscription permissions unsafe'; end if;
  perform set_config('request.jwt.claim.sub',u::text,true);
end $$;
set local role authenticated;
do $$
begin
  if (select count(*) from public.account_subscriptions) <> 1 then raise exception 'Own subscription read failed'; end if;
  begin update public.account_subscriptions set plan='pro'; raise exception 'Client promotion allowed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
do $$ begin if exists(select 1 from public.account_subscriptions) then raise exception 'Subscription RLS bypass'; end if; end $$;
reset role;
select 'Free defaults, quotas, Pro expiry and read-only RLS passed' as result;
rollback;
