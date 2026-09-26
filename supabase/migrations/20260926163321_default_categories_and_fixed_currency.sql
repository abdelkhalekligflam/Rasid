alter table public.categories
  add column if not exists is_default boolean not null default false;

update public.categories
set is_default = true
where name in (
  'Salaire', 'Autres revenus', 'Alimentation', 'Logement', 'Transport',
  'Loisirs', 'Santé', 'Abonnements', 'Autres dépenses'
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, currency)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case when new.raw_user_meta_data->>'currency' in ('MAD','EUR','USD','GBP')
      then new.raw_user_meta_data->>'currency' else 'MAD' end
  );

  insert into public.categories (user_id, name, icon, color, type, is_default) values
    (new.id, 'Salaire', 'Wallet', '#10B981', 'income', true),
    (new.id, 'Autres revenus', 'PlusCircle', '#059669', 'income', true),
    (new.id, 'Alimentation', 'ShoppingCart', '#10B981', 'expense', true),
    (new.id, 'Logement', 'Home', '#0F172A', 'expense', true),
    (new.id, 'Transport', 'Car', '#64748B', 'expense', true),
    (new.id, 'Loisirs', 'Popcorn', '#94A3B8', 'expense', true),
    (new.id, 'Santé', 'HeartPulse', '#BA1A1A', 'expense', true),
    (new.id, 'Abonnements', 'Smartphone', '#475569', 'expense', true),
    (new.id, 'Autres dépenses', 'MoreHorizontal', '#CBD5E1', 'expense', true);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create function public.prevent_currency_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.currency is distinct from old.currency then
    raise exception 'Currency cannot be changed after signup';
  end if;
  return new;
end;
$$;

create trigger prevent_profile_currency_change
before update of currency on public.profiles
for each row execute function public.prevent_currency_change();

revoke execute on function public.prevent_currency_change() from public, anon, authenticated;
