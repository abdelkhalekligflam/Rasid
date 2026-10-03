create function public.ensure_account_defaults() returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); metadata jsonb;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text,83949));
  select raw_user_meta_data into metadata from auth.users where id=uid;
  if not found then raise exception 'Account not found'; end if;
  insert into public.profiles(id,full_name,currency) values(uid,coalesce(metadata->>'full_name',''),case when metadata->>'currency' in ('MAD','EUR','USD','GBP') then metadata->>'currency' else 'MAD' end) on conflict(id) do nothing;
  insert into public.categories(user_id,name,icon,color,type,is_default)
  select uid,d.name,d.icon,d.color,d.type,true from (values
  ('Salaire','Wallet','#10B981','income'),('Autres revenus','PlusCircle','#059669','income'),
  ('Alimentation','ShoppingCart','#10B981','expense'),('Logement','Home','#0F172A','expense'),
  ('Transport','Car','#64748B','expense'),('Loisirs','Popcorn','#94A3B8','expense'),
  ('Santé','HeartPulse','#BA1A1A','expense'),('Abonnements','Smartphone','#475569','expense'),
  ('Autres dépenses','MoreHorizontal','#CBD5E1','expense')
  ) as d(name,icon,color,type)
  where not exists(select 1 from public.categories c where c.user_id=uid and c.name=d.name and c.type=d.type);
end;
$$;
revoke execute on function public.ensure_account_defaults() from public,anon;
grant execute on function public.ensure_account_defaults() to authenticated;
-- Repair only missing rows. Existing names, currencies, records and categories remain untouched.
insert into public.profiles(id,full_name,currency)
select id,coalesce(raw_user_meta_data->>'full_name',''),case when raw_user_meta_data->>'currency' in ('MAD','EUR','USD','GBP') then raw_user_meta_data->>'currency' else 'MAD' end from auth.users on conflict(id) do nothing;
do $$
declare account record;
begin
  for account in select id from auth.users loop
    perform set_config('request.jwt.claim.sub',account.id::text,true);
    perform public.ensure_account_defaults();
  end loop;
end $$;