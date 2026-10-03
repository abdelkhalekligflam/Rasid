begin;
select set_config('request.jwt.claim.sub',(select id::text from auth.users order by id limit 1),true);
set local role authenticated;
do $$ declare n integer; begin
 insert into public.support_requests(kind,subject,description) values('bug','Test request','Test description for support');
 select count(*) into n from public.support_requests where user_id<>auth.uid();
 if n<>0 then raise exception 'Other users visible'; end if;
 begin
  insert into public.support_requests(kind,subject,description,status) values('bug','Test status','Test description for support','resolved');
  raise exception 'Status spoofing allowed';
 exception when insufficient_privilege then null; end;
 begin
  update public.support_requests set response='Forged reply';
  raise exception 'Reply spoofing allowed';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.support_requests(kind,subject,description) values('bug',' ','short');
  raise exception 'Invalid content allowed';
 exception when check_violation then null; end;
 for i in 1..9 loop
  insert into public.support_requests(kind,subject,description) values('question','Test request','Test description for support');
 end loop;
 begin
  insert into public.support_requests(kind,subject,description) values('bug','Test limit','Test description for support');
  raise exception 'Rate limit bypassed';
 exception when raise_exception then if sqlerrm<>'support_daily_limit' then raise; end if; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from auth.users order by id offset 1 limit 1),true);
set local role authenticated;
do $$ begin if (select count(*) from public.support_requests)<>0 then raise exception 'Cross-user requests visible'; end if; end $$;
rollback;
