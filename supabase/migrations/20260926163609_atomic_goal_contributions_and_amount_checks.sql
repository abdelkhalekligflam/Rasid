alter table public.transactions
  add constraint transactions_amount_positive check (amount > 0);
alter table public.budgets
  add constraint budgets_limit_positive check (amount_limit > 0);
alter table public.savings_goals
  add constraint goals_amounts_valid check (target_amount > 0 and current_amount >= 0);

create function public.contribute_to_goal(goal_id uuid, amount_to_add numeric)
returns numeric
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated_amount numeric;
begin
  if amount_to_add is null or amount_to_add <= 0 or amount_to_add > 9999999999.99 then
    raise exception 'Invalid contribution';
  end if;

  update public.savings_goals
  set current_amount = current_amount + amount_to_add
  where id = goal_id and user_id = (select auth.uid())
  returning current_amount into updated_amount;

  if not found then
    raise exception 'Goal not found';
  end if;
  return updated_amount;
end;
$$;

revoke all on function public.contribute_to_goal(uuid, numeric) from public, anon;
grant execute on function public.contribute_to_goal(uuid, numeric) to authenticated;
