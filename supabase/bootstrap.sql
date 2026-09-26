-- Bootstrap for a NEW Supabase project only.
-- Run this before the numbered migrations. Do not run it on the existing Rasid project.
create table public.profiles (
  id uuid primary key references auth.users(id),
  full_name text,
  currency text not null default 'MAD',
  theme_preference text default 'system',
  created_at timestamptz default now()
);
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  icon text,
  color text,
  type text not null check (type in ('income', 'expense')),
  created_at timestamptz default now()
);
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id),
  amount numeric(12,2) not null,
  type text not null check (type in ('income', 'expense')),
  description text,
  transaction_date date not null,
  created_at timestamptz default now()
);
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id),
  amount_limit numeric(12,2) not null,
  recurrence text not null default 'monthly' check (recurrence in ('weekly', 'monthly', 'yearly')),
  start_date date not null,
  is_active boolean default true,
  created_at timestamptz default now()
);
create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  target_amount numeric(12,2) not null,
  current_amount numeric(12,2) not null default 0,
  target_date date,
  created_at timestamptz default now()
);
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  budget_id uuid references public.budgets(id),
  type text not null check (type in ('threshold_warning', 'over_budget', 'goal_reached')),
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.savings_goals enable row level security;
alter table public.alerts enable row level security;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can manage own categories" on public.categories for all using (auth.uid() = user_id);
create policy "Users can manage own transactions" on public.transactions for all using (auth.uid() = user_id);
create policy "Users can manage own budgets" on public.budgets for all using (auth.uid() = user_id);
create policy "Users can manage own goals" on public.savings_goals for all using (auth.uid() = user_id);
create policy "Users can manage own alerts" on public.alerts for all using (auth.uid() = user_id);

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, currency)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.raw_user_meta_data->>'currency', 'MAD'));
  insert into public.categories(user_id, name, icon, color, type) values
    (new.id, 'Salaire', 'Wallet', '#10B981', 'income'),
    (new.id, 'Autres revenus', 'PlusCircle', '#059669', 'income'),
    (new.id, 'Alimentation', 'ShoppingCart', '#10B981', 'expense'),
    (new.id, 'Logement', 'Home', '#0F172A', 'expense'),
    (new.id, 'Transport', 'Car', '#64748B', 'expense'),
    (new.id, 'Loisirs', 'Popcorn', '#94A3B8', 'expense'),
    (new.id, 'Santé', 'HeartPulse', '#BA1A1A', 'expense'),
    (new.id, 'Abonnements', 'Smartphone', '#475569', 'expense'),
    (new.id, 'Autres dépenses', 'MoreHorizontal', '#CBD5E1', 'expense');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create function public.check_budget_alert() returns trigger language plpgsql security definer set search_path = public as $$
declare budget_record record; total_spent numeric; percent numeric;
begin
  if new.type <> 'expense' then return new; end if;
  select * into budget_record from public.budgets
    where category_id = new.category_id and user_id = new.user_id and is_active = true limit 1;
  if budget_record.id is null then return new; end if;
  select coalesce(sum(amount), 0) into total_spent from public.transactions
    where category_id = new.category_id and user_id = new.user_id and type = 'expense';
  percent := (total_spent / budget_record.amount_limit) * 100;
  if total_spent > budget_record.amount_limit then
    insert into public.alerts(user_id, budget_id, type, message)
    values (new.user_id, budget_record.id, 'over_budget', 'Budget dépassé : ' || total_spent || ' / ' || budget_record.amount_limit);
  elsif percent >= 80 then
    insert into public.alerts(user_id, budget_id, type, message)
    values (new.user_id, budget_record.id, 'threshold_warning', 'Seuil de 80% atteint : ' || total_spent || ' / ' || budget_record.amount_limit);
  end if;
  return new;
end;
$$;
create trigger on_transaction_check_budget after insert on public.transactions
for each row execute function public.check_budget_alert();

create function public.check_goal_alert() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.current_amount >= new.target_amount and old.current_amount < old.target_amount then
    insert into public.alerts(user_id, type, message)
    values (new.user_id, 'goal_reached', 'Objectif atteint : ' || new.name);
  end if;
  return new;
end;
$$;
create trigger on_goal_updated_check after update on public.savings_goals
for each row execute function public.check_goal_alert();
