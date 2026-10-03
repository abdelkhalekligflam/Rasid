import Link from "next/link"
import { LockKeyhole, Crown, CircleAlert } from "lucide-react"
import { getT } from "@/lib/i18n-server"
import { getAccountPlan } from "@/lib/billing/server"
import { PRO_PRICE_MAD } from "@/lib/billing/plans"
import { Button } from "@/components/ui/button"

export default async function CheckoutPage() {
  const t=await getT()
  const { pro }=await getAccountPlan()
  return <div className="mx-auto max-w-4xl space-y-8"><div><Link href="/dashboard/billing" className="text-sm text-muted-foreground underline underline-offset-4">{t("Back to plans")}</Link><h1 className="mt-5 font-heading text-3xl font-semibold">{t("Checkout")}</h1><p className="mt-2 text-sm text-muted-foreground">{t("Upgrade your financial workspace.")}</p></div>
    <div className="grid gap-5 md:grid-cols-[1fr_1.1fr]"><section className="rounded-xl border bg-card p-6 sm:p-8"><div className="flex items-center gap-2"><Crown className="size-5 text-blue-500" /><h2 className="font-heading text-xl font-semibold">Rasid Pro</h2></div><p className="mt-3 text-sm text-muted-foreground">{t("Unlimited tracking and transaction export in CSV.")}</p><div className="mt-8 space-y-4 text-sm"><div className="flex justify-between gap-3"><span>{t("Monthly plan")}</span><span className="font-mono">{PRO_PRICE_MAD} MAD</span></div><div className="flex justify-between gap-3 border-t pt-4 font-semibold"><span>{t("Monthly price")}</span><span className="font-mono">{PRO_PRICE_MAD} MAD</span></div></div><p className="mt-6 text-xs text-muted-foreground">{t("Price is in Moroccan dirhams, regardless of your account currency.")}</p></section>
    <section className="rounded-xl border bg-card p-6 sm:p-8"><LockKeyhole className="size-6 text-muted-foreground" /><h2 className="mt-5 font-heading text-lg font-semibold">{t(pro?"Your Pro access is active.":"Payment setup in progress")}</h2><div className="mt-4 rounded-lg border bg-muted/40 p-4"><p className="flex items-start gap-2 text-sm"><CircleAlert className="mt-0.5 size-4 shrink-0" />{t(pro?"You already have Pro. No additional payment is needed here.":"Payments are not available yet. Your account stays on Free until a payment is confirmed.")}</p></div>{!pro&&<Button disabled className="mt-6 w-full">{t("Payment unavailable")}</Button>}<p className="mt-4 text-xs text-muted-foreground">{t("No payment details are collected and no charge is made on this page.")}</p><Button asChild variant="outline" className="mt-6 w-full"><Link href="/dashboard">{t("Return to dashboard")}</Link></Button></section></div>
  </div>
}
