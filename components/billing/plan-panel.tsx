"use client"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Crown, ArrowUpRight, Download } from "lucide-react"
import { useT } from "@/components/locale-provider"
import { createClient } from "@/lib/supabase/client"
import { FREE_LIMITS, hasPro, PRO_PRICE_MAD, type Subscription } from "@/lib/billing/plans"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function PlanPanel() {
  const t = useT()
  const { data, isLoading, error } = useQuery({ queryKey: ["account-plan"], queryFn: async () => {
    const db = createClient()
    const { data: { user }, error } = await db.auth.getUser()
    if (error || !user) throw new Error("Please sign in again.")
    const subscription = await db.from("account_subscriptions").select("plan,status,provider,payment_reference,current_period_end").eq("user_id", user.id).maybeSingle()
    if (subscription.error) throw subscription.error
    const start = new Date(); start.setUTCDate(1); start.setUTCHours(0,0,0,0)
    const results = await Promise.all([
      db.from("transactions").select("id",{count:"exact",head:true}).eq("user_id",user.id).gte("created_at",start.toISOString()),
      db.from("budgets").select("id",{count:"exact",head:true}).eq("user_id",user.id).eq("is_active",true),
      db.from("savings_goals").select("id",{count:"exact",head:true}).eq("user_id",user.id),
      db.from("categories").select("id",{count:"exact",head:true}).eq("user_id",user.id).eq("is_default",false),
    ])
    if (results.some(result => result.error)) throw new Error("Couldn't load your plan.")
    return { pro: hasPro(subscription.data as Subscription | null), counts: results.map(result=>result.count??0) }
  } })
  return <Card id="plan" className="scroll-mt-24 rounded-xl shadow-none"><CardContent className="space-y-6 p-6 sm:p-8">
    <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg border bg-blue-500/10 text-blue-600 dark:text-blue-400"><Crown className="size-4" /></div><div><h2 className="font-heading text-base font-semibold">{t("Your plan")}</h2><p className="text-xs text-muted-foreground">{t("Manage your plan and usage.")}</p></div></div>{data && <span className="rounded-full border px-3 py-1 text-xs font-semibold">{data.pro ? "Pro" : "Free"}</span>}</div>
    {isLoading && <p role="status" className="text-sm text-muted-foreground">{t("Please wait...")}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{t("Couldn't load your plan.")}</p>}
    {data && <><div className="grid gap-3 sm:grid-cols-2">{[["New transactions this month",FREE_LIMITS.transactions],["Active budgets",FREE_LIMITS.budgets],["Savings goals",FREE_LIMITS.goals],["Custom categories",FREE_LIMITS.categories]].map(([label,limit],index)=><div key={label} className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">{t(String(label))}</p><p className="mt-2 font-mono text-lg">{data.counts[index]} <span className="text-sm text-muted-foreground">/ {data.pro?t("Unlimited"):limit}</span></p>{!data.pro&&<div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-blue-500" style={{width:`${Math.min(100,data.counts[index]/Number(limit)*100)}%`}} /></div>}</div>)}</div>
    <p className="text-xs text-muted-foreground">{t("Monthly transaction limits reset on the first day of each month (UTC). Existing records remain available.")}</p>
    <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-5"><p className="text-sm">{data.pro?t("Your Pro access is active."):`Pro · ${PRO_PRICE_MAD} MAD ${t("per month")}`}</p><Button asChild variant={data.pro?"outline":"default"}><Link href="/dashboard/billing">{t(data.pro?"Manage plan":"View plans")}<ArrowUpRight className="size-4" /></Link></Button></div>
    {data.pro && <Button asChild variant="outline"><a href="/api/billing/export"><Download className="size-4" />{t("Export transactions as CSV")}</a></Button>}
    </>}
  </CardContent></Card>
}
