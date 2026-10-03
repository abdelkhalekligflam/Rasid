"use client"
import { useState } from "react"
import Link from "next/link"
import { LockKeyhole, Crown, CircleAlert } from "lucide-react"
import { useLocale, useT } from "@/components/locale-provider"
import { localeTags } from "@/lib/i18n"
import { billingAmount, type BillingCurrency, type BillingInterval } from "@/lib/billing/plans"
import { BillingOptions } from "./billing-options"
import { Button } from "@/components/ui/button"

export function CheckoutPanel({ pro, initialCurrency, initialInterval }: { pro:boolean; initialCurrency:BillingCurrency; initialInterval:BillingInterval }) {
  const t=useT(); const locale=useLocale()
  const [currency,setCurrency]=useState(initialCurrency); const [interval,setInterval]=useState(initialInterval)
  const price=new Intl.NumberFormat(localeTags[locale],{maximumFractionDigits:2}).format(billingAmount(currency,interval))
  return <div className="grid gap-5 md:grid-cols-[1fr_1.1fr]"><section className="rounded-xl border bg-card p-6 sm:p-8"><div className="flex items-center gap-2"><Crown className="size-5 text-blue-500" /><h2 className="font-heading text-xl font-semibold">Rasid Pro</h2></div><p className="mt-3 text-sm text-muted-foreground">{t("Unlimited tracking and transaction export in CSV.")}</p><div className="mt-6"><BillingOptions currency={currency} interval={interval} onCurrency={setCurrency} onInterval={setInterval} /></div><div className="mt-8 space-y-4 text-sm"><div className="flex justify-between gap-3"><span>{t(interval==="monthly"?"Monthly plan":"Annual plan")}</span><span className="font-mono">{price} {currency}</span></div><div className="flex justify-between gap-3 border-t pt-4 font-semibold"><span>{t("Plan total")}</span><span className="font-mono" aria-live="polite">{price} {currency}</span></div></div><p className="mt-4 text-xs text-muted-foreground">{t(interval==="yearly"?"Annual plan: 12 months, billed together when payments are available.":"Monthly plan: one month of Pro access.")}</p><p className="mt-6 text-xs text-muted-foreground">{t("Prices are fixed for each payment currency. Your account currency and financial records do not change.")}</p></section>
    <section className="rounded-xl border bg-card p-6 sm:p-8"><LockKeyhole className="size-6 text-muted-foreground" /><h2 className="mt-5 font-heading text-lg font-semibold">{t(pro?"Your Pro access is active.":"Payment setup in progress")}</h2><div className="mt-4 rounded-lg border bg-muted/40 p-4"><p className="flex items-start gap-2 text-sm"><CircleAlert className="mt-0.5 size-4 shrink-0" />{t(pro?"You already have Pro. No additional payment is needed here.":"Payments are not available yet. Your account stays on Free until a payment is confirmed.")}</p></div>{!pro&&<Button disabled className="mt-6 w-full">{t("Payment unavailable")}</Button>}<p className="mt-4 text-xs text-muted-foreground">{t("No payment details are collected and no charge is made on this page.")}</p><Button asChild variant="outline" className="mt-6 w-full"><Link href="/dashboard">{t("Return to dashboard")}</Link></Button></section>
  </div>
}
