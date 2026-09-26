create function public.validate_financial_category()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  category_user uuid;
  category_type text;
begin
  if new.category_id is null then
    return new;
  end if;

  select user_id, type into category_user, category_type
  from public.categories
  where id = new.category_id;

  if category_user is distinct from new.user_id
     or (tg_table_name = 'transactions' and category_type is distinct from new.type)
     or (tg_table_name = 'budgets' and category_type is distinct from 'expense') then
    raise exception 'Category does not belong to this user or type';
  end if;
  return new;
end;
$$;

create trigger validate_transaction_category
before insert or update of category_id, user_id, type on public.transactions
for each row execute function public.validate_financial_category();

create trigger validate_budget_category
before insert or update of category_id, user_id on public.budgets
for each row execute function public.validate_financial_category();

create function public.protect_default_category()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.is_default then raise exception 'Default categories cannot be deleted'; end if;
    return old;
  end if;
  if old.is_default and row(new.name, new.type, new.user_id, new.is_default)
    is distinct from row(old.name, old.type, old.user_id, old.is_default) then
    raise exception 'Default categories cannot be changed';
  end if;
  if new.user_id is distinct from old.user_id or new.type is distinct from old.type then
    raise exception 'Category owner and type cannot be changed';
  end if;
  return new;
end;
$$;

create trigger protect_category_update
before update on public.categories
for each row execute function public.protect_default_category();

create trigger protect_category_delete
before delete on public.categories
for each row execute function public.protect_default_category();

revoke execute on function public.validate_financial_category() from public, anon, authenticated;
revoke execute on function public.protect_default_category() from public, anon, authenticated;
