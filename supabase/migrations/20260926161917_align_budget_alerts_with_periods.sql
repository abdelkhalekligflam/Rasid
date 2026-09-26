-- Align alert thresholds with the active recurrence period.
create or replace function public.check_budget_alert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  budget_record record;
  period_start date;
  period_end date;
  period_number integer;
  total_spent numeric;
  previous_spent numeric;
begin
  if new.type <> 'expense' then
    return new;
  end if;

  for budget_record in
    select id, amount_limit, recurrence, start_date
    from public.budgets
    where user_id = new.user_id
      and category_id = new.category_id
      and is_active = true
      and start_date <= current_date
      and amount_limit > 0
  loop
    period_number := 0;
    period_start := budget_record.start_date;

    loop
      period_end := case budget_record.recurrence
        when 'weekly' then (budget_record.start_date + period_number * interval '1 week' + interval '1 week')::date
        when 'yearly' then (budget_record.start_date + period_number * interval '1 year' + interval '1 year')::date
        else (budget_record.start_date + (period_number + 1) * interval '1 month')::date
      end;
      exit when period_end > current_date;
      period_number := period_number + 1;
      period_start := period_end;
    end loop;

    if new.transaction_date < period_start or new.transaction_date >= period_end then
      continue;
    end if;

    select coalesce(sum(amount), 0) into total_spent
    from public.transactions
    where user_id = new.user_id
      and category_id = new.category_id
      and type = 'expense'
      and transaction_date >= period_start
      and transaction_date < period_end;

    previous_spent := total_spent - new.amount;

    if previous_spent <= budget_record.amount_limit
       and total_spent > budget_record.amount_limit then
      insert into public.alerts (user_id, budget_id, type, message)
      values (
        new.user_id,
        budget_record.id,
        'over_budget',
        'Budget dépassé : ' || total_spent || ' / ' || budget_record.amount_limit
      );
    elsif previous_spent < budget_record.amount_limit * 0.8
       and total_spent >= budget_record.amount_limit * 0.8 then
      insert into public.alerts (user_id, budget_id, type, message)
      values (
        new.user_id,
        budget_record.id,
        'threshold_warning',
        'Seuil de 80% atteint : ' || total_spent || ' / ' || budget_record.amount_limit
      );
    end if;
  end loop;

  return new;
end;
$$;

revoke execute on function public.check_budget_alert() from public, anon, authenticated;
