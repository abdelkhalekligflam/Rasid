import Link from "next/link"
import { Check, Crown } from "lucide-react"
import { getT } from "@/lib/i18n-server"
import { getAccountPlan } from "@/lib/billing/server"
import { PRO_PRICE_MAD } from "@/lib/billing/plans"
import { PlanPanel } from "@/components/billing/plan-panel"
import { Button } from "@/components/ui/button"

export default async function BillingPage() {
  const t=await getT()
  const { pro }=await getAccountPlan()
  const free=["50 new transactions per month","3 active budgets","3 savings goals","5 custom categories","Dashboard, alerts and account backup"]
  const paid=["Unlimited transactions","Unlimited active budgets","Unlimited savings goals","Unlimited custom categories","Transaction export in CSV"]
  return <div className="mx-auto max-w-5xl space-y-8"><div><p className="text-xs uppercase tracking-widest text-muted-foreground">{t("Plans & billing")}</p><h1 className="mt-2 font-heading text-3xl font-semibold">{t("Choose your plan")}</h1><p className="mt-2 text-sm text-muted-foreground">{t("Start free. Upgrade when you need more room.")}</p></div>
    <div className="grid gap-5 md:grid-cols-2">{[{name:"Free",price:0,features:free},{name:"Pro",price:PRO_PRICE_MAD,features:paid}].map(plan=><div key={plan.name} className={`rounded-xl border bg-card p-6 sm:p-8 ${plan.name==="Pro"?"border-blue-500/50":""}`}><div className="flex items-center gap-2"><h2 className="font-heading text-xl font-semibold">{plan.name}</h2>{plan.name==="Pro"&&<Crown className="size-4 text-blue-500" />}</div><p className="mt-5 font-mono text-4xl font-semibold">{plan.price}<span className="ms-2 text-sm font-normal text-muted-foreground">MAD / {t("month")}</span></p><ul className="my-7 space-y-3">{plan.features.map(feature=><li key={feature} className="flex items-center gap-2 text-sm"><Check className="size-4 shrink-0 text-blue-500" />{t(feature)}</li>)}</ul>{plan.name==="Free"?<p className="text-sm text-muted-foreground">{t(pro?"Included in Pro":"Your current plan")}</p>:pro?<Button asChild variant="outline" className="w-full"><a href="/api/billing/export">{t("Export transactions as CSV")}</a></Button>:<Button asChild className="w-full"><Link href="/dashboard/checkout">{t("Upgrade to Pro")}</Link></Button>}</div>)}</div>
    {!pro&&<p className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">{t("Payments are not available yet. Your account stays on Free until a payment is confirmed.")}</p>}
    <PlanPanel />
  </div>
}
