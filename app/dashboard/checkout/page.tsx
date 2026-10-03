import Link from "next/link"
import { getT } from "@/lib/i18n-server"
import { getAccountPlan } from "@/lib/billing/server"
import { billingChoice } from "@/lib/billing/plans"
import { CheckoutPanel } from "@/components/billing/checkout-panel"
export default async function CheckoutPage({searchParams}:{searchParams:Promise<{currency?:string;interval?:string}>}) {
  const t=await getT(); const {pro}=await getAccountPlan(); const params=await searchParams; const choice=billingChoice(params.currency,params.interval)
  return <div className="mx-auto max-w-4xl space-y-8"><div><Link href="/dashboard/billing" className="text-sm text-muted-foreground underline underline-offset-4">{t("Back to plans")}</Link><h1 className="mt-5 font-heading text-3xl font-semibold">{t("Checkout")}</h1><p className="mt-2 text-sm text-muted-foreground">{t("Upgrade your financial workspace.")}</p></div><CheckoutPanel pro={pro} initialCurrency={choice.currency} initialInterval={choice.interval} /></div>
}
