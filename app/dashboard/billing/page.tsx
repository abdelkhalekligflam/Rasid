import { getT } from "@/lib/i18n-server"
import { getAccountPlan } from "@/lib/billing/server"
import { billingChoice } from "@/lib/billing/plans"
import { PricingComparison } from "@/components/billing/pricing-comparison"
import { PlanPanel } from "@/components/billing/plan-panel"
export default async function BillingPage({searchParams}:{searchParams:Promise<{currency?:string;interval?:string}>}) {
  const t=await getT(); const {pro}=await getAccountPlan(); const choice=billingChoice((await searchParams).currency,(await searchParams).interval)
  return <div className="mx-auto max-w-5xl space-y-8"><p className="text-xs uppercase tracking-widest text-muted-foreground">{t("Plans & billing")}</p><PricingComparison pro={pro} signedIn initialCurrency={choice.currency} initialInterval={choice.interval} /><PlanPanel /></div>
}
