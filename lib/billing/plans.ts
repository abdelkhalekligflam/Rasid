export const PRO_PRICE_MAD = 49
export const FREE_LIMITS = { transactions: 50, budgets: 3, goals: 3, categories: 5 } as const
export type Subscription = { plan: string; status: string; provider: string | null; payment_reference: string | null; current_period_end: string | null }
export function hasPro(subscription: Subscription | null, now = Date.now()) {
  return !!subscription && subscription.plan === "pro" && subscription.status === "active" && !!subscription.provider && !!subscription.payment_reference && !!subscription.current_period_end && Date.parse(subscription.current_period_end) > now
}
export function freeLimitMessage(error: { message: string }, t: (key: string) => string) {
  return error.message.startsWith("FREE_LIMIT_") ? t("You've reached a Free plan limit. View your plan to upgrade.") : error.message
}
export function csvCell(value: unknown) {
  let text = value == null ? "" : String(value)
  // Prevent spreadsheet formula injection in user-controlled descriptions.
  if (/^[\s]*[=+\-@\t\r]/.test(text)) text = "'" + text
  return '"' + text.replaceAll('"', '""') + '"'
}

export const BILLING_CURRENCIES = ["MAD", "USD", "EUR", "GBP"] as const
export type BillingCurrency = typeof BILLING_CURRENCIES[number]
export type BillingInterval = "monthly" | "yearly"
// Independent fixed commercial prices in minor units; no exchange-rate conversion.
export const BILLING_PRICES: Record<BillingCurrency, Record<BillingInterval, number>> = {
  MAD: { monthly: 4900, yearly: 58800 },
  USD: { monthly: 499, yearly: 5988 },
  EUR: { monthly: 499, yearly: 5988 },
  GBP: { monthly: 399, yearly: 4788 },
}
export function billingChoice(currency: unknown, interval: unknown): { currency: BillingCurrency; interval: BillingInterval } {
  return { currency: BILLING_CURRENCIES.includes(currency as BillingCurrency) ? currency as BillingCurrency : "MAD", interval: interval === "yearly" ? "yearly" : "monthly" }
}
export function billingAmount(currency: BillingCurrency, interval: BillingInterval) {
  return BILLING_PRICES[currency][interval] / 100
}
export function checkoutUrl(currency: BillingCurrency, interval: BillingInterval) {
  return `/dashboard/checkout?currency=${currency}&interval=${interval}`
}
