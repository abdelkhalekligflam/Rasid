create index if not exists transactions_user_date_idx on public.transactions (user_id, transaction_date desc, id desc);
create index if not exists transactions_category_idx on public.transactions (category_id);
create index if not exists budgets_user_category_idx on public.budgets (user_id, category_id, is_active);
create index if not exists budgets_category_idx on public.budgets (category_id);
create index if not exists categories_user_type_idx on public.categories (user_id, type);
create index if not exists goals_user_idx on public.savings_goals (user_id);
create index if not exists alerts_user_read_date_idx on public.alerts (user_id, is_read, created_at desc);
create index if not exists alerts_budget_idx on public.alerts (budget_id);

drop policy "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
for select to authenticated using ((select auth.uid()) = id);

drop policy "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
for insert to authenticated with check ((select auth.uid()) = id);

drop policy "Users can manage own transactions" on public.transactions;
create policy "Users can manage own transactions" on public.transactions
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy "Users can manage own budgets" on public.budgets;
create policy "Users can manage own budgets" on public.budgets
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy "Users can manage own goals" on public.savings_goals;
create policy "Users can manage own goals" on public.savings_goals
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy "Users can manage own alerts" on public.alerts;
create policy "Users can manage own alerts" on public.alerts
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
