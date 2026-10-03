create schema if not exists private;
alter function public.ensure_account_defaults() set schema private;
revoke all on schema private from public,anon;
grant usage on schema private to authenticated;
create function public.ensure_account_defaults() returns void language sql security invoker set search_path = '' as $$
  select private.ensure_account_defaults();
$$;
revoke execute on function public.ensure_account_defaults() from public,anon;
grant execute on function public.ensure_account_defaults() to authenticated;