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
