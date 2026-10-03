"use client"
import { useT } from "@/components/locale-provider"
import { BILLING_CURRENCIES, type BillingCurrency, type BillingInterval } from "@/lib/billing/plans"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function BillingOptions({ currency, interval, onCurrency, onInterval }: { currency: BillingCurrency; interval: BillingInterval; onCurrency: (value: BillingCurrency) => void; onInterval: (value: BillingInterval) => void }) {
  const t=useT()
  return <div className="flex flex-wrap items-end gap-4"><div className="space-y-2"><p className="text-xs font-medium text-muted-foreground">{t("Billing period")}</p><div className="inline-flex gap-1 rounded-lg border bg-muted/30 p-1" role="group" aria-label={t("Billing period")}>{(["monthly","yearly"] as const).map(value=><Button key={value} type="button" variant={interval===value?"default":"ghost"} size="sm" aria-pressed={interval===value} onClick={()=>onInterval(value)}>{t(value==="monthly"?"Monthly":"Yearly")}</Button>)}</div></div><div className="space-y-2"><Label className="text-xs text-muted-foreground">{t("Payment currency")}</Label><Select value={currency} onValueChange={value=>onCurrency(value as BillingCurrency)}><SelectTrigger aria-label={t("Payment currency")} className="min-w-28"><SelectValue /></SelectTrigger><SelectContent>{BILLING_CURRENCIES.map(value=><SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div></div>
}
