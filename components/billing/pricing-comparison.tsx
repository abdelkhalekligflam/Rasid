"use client"
import { useState } from "react"
import Link from "next/link"
import { Check, Minus, Crown } from "lucide-react"
import { useLocale, useT } from "@/components/locale-provider"
import { localeTags } from "@/lib/i18n"
import { billingAmount, checkoutUrl, type BillingCurrency, type BillingInterval } from "@/lib/billing/plans"
import { BillingOptions } from "./billing-options"
import { Button } from "@/components/ui/button"

export function PricingComparison({ pro=false, signedIn=false, initialCurrency="MAD", initialInterval="monthly" }: { pro?: boolean; signedIn?: boolean; initialCurrency?: BillingCurrency; initialInterval?: BillingInterval }) {
  const t=useT(); const locale=useLocale()
  const [currency,setCurrency]=useState(initialCurrency)
  const [interval,setInterval]=useState(initialInterval)
  const amount=billingAmount(currency,interval)
  const price=new Intl.NumberFormat(localeTags[locale],{maximumFractionDigits:2}).format(amount)
  const features=[
    {name:"New transactions this month",free:"50",paid:"Unlimited"},
    {name:"Active budgets",free:"3",paid:"Unlimited"},
    {name:"Savings goals",free:"3",paid:"Unlimited"},
    {name:"Custom categories",free:"5",paid:"Unlimited"},
    {name:"Dashboard and charts",free:true,paid:true},
    {name:"Budget alerts",free:true,paid:true},
    {name:"Profile, themes and languages",free:true,paid:true},
    {name:"JSON account backup",free:true,paid:true},
    {name:"Transaction export in CSV",free:false,paid:true},
  ]
  const included=(value:string|boolean)=>typeof value==="string"?t(value):value?<span className="inline-flex items-center gap-1.5"><Check className="size-4 text-blue-500" /><span className="sr-only">{t("Included")}</span></span>:<span className="inline-flex"><Minus className="size-4 text-muted-foreground" /><span className="sr-only">{t("Not included")}</span></span>
  return <div className="space-y-6"><div><h2 className="font-heading text-3xl font-semibold tracking-tight">{t("Free or Pro: what's included?")}</h2><p className="mt-3 text-sm text-muted-foreground">{t("Choose the limits and billing period that work for you.")}</p></div><BillingOptions currency={currency} interval={interval} onCurrency={setCurrency} onInterval={setInterval} />
    <div className="grid gap-5 md:grid-cols-2"><div className="rounded-xl border bg-card p-6 sm:p-8"><h3 className="font-heading text-xl font-semibold">Free</h3><p className="mt-5 font-mono text-4xl font-semibold">0 <span className="text-sm font-normal text-muted-foreground">{currency}</span></p><p className="mt-3 text-sm text-muted-foreground">{t("Essential tracking with clear limits. No payment required.")}</p><ul className="my-6 space-y-2 text-sm">{["50 new transactions per month","3 active budgets","3 savings goals","5 custom categories"].map(feature=><li key={feature} className="flex items-center gap-2"><Check className="size-4 shrink-0 text-blue-500" />{t(feature)}</li>)}</ul>{signedIn?<p className="text-sm text-muted-foreground">{t(pro?"Included in Pro":"Your current plan")}</p>:<Button asChild variant="outline" className="w-full"><Link href="/signup">{t("Create account")}</Link></Button>}</div>
      <div className="rounded-xl border border-blue-500/50 bg-card p-6 sm:p-8"><div className="flex items-center gap-2"><h3 className="font-heading text-xl font-semibold">Pro</h3><Crown className="size-4 text-blue-500" /></div><p className="mt-5 font-mono text-4xl font-semibold">{price} <span className="text-sm font-normal text-muted-foreground">{currency} / {t(interval==="monthly"?"month":"year")}</span></p><p className="mt-3 text-sm text-muted-foreground">{t(interval==="yearly"?"Annual plan: 12 months, billed together when payments are available.":"Monthly plan: one month of Pro access.")}</p><ul className="my-6 space-y-2 text-sm">{["Unlimited transactions","Unlimited active budgets","Unlimited savings goals","Unlimited custom categories","Transaction export in CSV"].map(feature=><li key={feature} className="flex items-center gap-2"><Check className="size-4 shrink-0 text-blue-500" />{t(feature)}</li>)}</ul><Button asChild className="w-full"><Link href={pro?"/dashboard/settings#plan":checkoutUrl(currency,interval)}>{t(pro?"Manage plan":"View checkout")}</Link></Button></div></div>
    <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[440px] text-sm"><caption className="sr-only">{t("Free and Pro feature comparison")}</caption><thead className="bg-muted/40"><tr><th scope="col" className="p-4 text-start font-medium">{t("Feature")}</th><th scope="col" className="p-4 text-center font-medium">Free</th><th scope="col" className="p-4 text-center font-medium">Pro</th></tr></thead><tbody>{features.map(feature=><tr key={feature.name} className="border-t"><th scope="row" className="p-4 text-start font-normal">{t(feature.name)}</th><td className="p-4 text-center">{included(feature.free)}</td><td className="p-4 text-center">{included(feature.paid)}</td></tr>)}</tbody></table></div>
    <p className="text-xs text-muted-foreground">{t("Prices are fixed for each payment currency. Your account currency and financial records do not change.")}</p><p className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">{t("Payments are not available yet. Your account stays on Free until a payment is confirmed.")}</p>
  </div>
}
