create or replace function public.validate_financial_category()
returns trigger language plpgsql security invoker set search_path = ''
as $$
declare category_user uuid; category_type text;
begin
  if new.category_id is null then return new; end if;
  select user_id, type into category_user, category_type from public.categories where id = new.category_id;
  if category_user is distinct from new.user_id then
    raise exception 'Category does not belong to this user or type';
  end if;
  if tg_table_name = 'transactions' then
    if category_type is distinct from new.type then raise exception 'Category does not belong to this user or type'; end if;
  elsif tg_table_name = 'budgets' then
    if category_type is distinct from 'expense' then raise exception 'Category does not belong to this user or type'; end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.validate_financial_category() from public, anon, authenticated;
