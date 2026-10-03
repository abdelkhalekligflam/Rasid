drop trigger if exists prevent_profile_currency_change on public.profiles;
drop function if exists public.prevent_currency_change();
alter table public.profiles add constraint profiles_currency_supported check (currency in ('MAD', 'EUR', 'USD', 'GBP'));
