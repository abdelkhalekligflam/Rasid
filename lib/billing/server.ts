import "server-only"
import { createClient } from "@/lib/supabase/server"
import { hasPro, type Subscription } from "./plans"

export async function getAccountPlan() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { user: null, pro: false, subscription: null }
  const { data, error: subscriptionError } = await supabase.from("account_subscriptions")
    .select("plan,status,provider,payment_reference,current_period_end").eq("user_id", user.id).maybeSingle()
  if (subscriptionError) throw new Error("Couldn't load your plan.")
  const subscription = data as Subscription | null
  return { user, pro: hasPro(subscription), subscription }
}
