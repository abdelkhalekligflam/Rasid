drop trigger protect_category_delete on public.categories;

drop policy "Users can manage own categories" on public.categories;

create policy "Read own categories" on public.categories
for select to authenticated using ((select auth.uid()) = user_id);

create policy "Create custom categories" on public.categories
for insert to authenticated
with check ((select auth.uid()) = user_id and is_default = false);

create policy "Update custom categories" on public.categories
for update to authenticated
using ((select auth.uid()) = user_id and is_default = false)
with check ((select auth.uid()) = user_id and is_default = false);

create policy "Delete custom categories" on public.categories
for delete to authenticated
using ((select auth.uid()) = user_id and is_default = false);
