-- Trigger functions are executed by their triggers, not by web clients.
-- Remove the default direct EXECUTE grants from exposed RPC functions.
revoke execute on function public.check_budget_alert() from public, anon, authenticated;
revoke execute on function public.check_goal_alert() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
