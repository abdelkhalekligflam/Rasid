import { PricingComparison } from "@/components/billing/pricing-comparison"
import { redirect } from "next/navigation"
import { BrandLogo } from "@/components/shared/brand-logo"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, CircleCheck } from "lucide-react"
import { LanguageSelect } from "@/components/locale-provider"
import { getT } from "@/lib/i18n-server"

export default async function Home({ searchParams }: { searchParams: Promise<{ code?: string; error?: string }> }) {
  const params = await searchParams
  if (params.code) redirect(`/auth/callback?code=${encodeURIComponent(params.code)}`)
  if (params.error) redirect("/reset-password?error=invalid")
  const t = await getT()
  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border/80"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
      <Link href="/" className="font-heading text-xl font-semibold tracking-[-0.05em]"><BrandLogo /></Link>
      <nav className="flex items-center gap-3 text-sm"><LanguageSelect /><Link href="/login" className="text-muted-foreground transition hover:text-foreground">{t("Sign in")}</Link><Link href="/signup" className="inline-flex items-center gap-2 rounded-md border bg-foreground px-3.5 py-2 font-medium text-background transition hover:opacity-80">{t("Get started")} <ArrowRight className="size-3.5 rtl:rotate-180" /></Link></nav>
    </div></header>
    <main>
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-24 sm:px-8 sm:pt-32"><div className="max-w-3xl">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"><span className="size-1.5 rounded-full bg-emerald-500" />{t("Your finances, simplified")}</p>
        <h1 className="font-heading text-5xl font-semibold leading-[1.08] tracking-[-0.065em] sm:text-7xl">{t("A clearer view of your money.")}</h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{t("Track transactions, budgets and savings goals in one place. Make better decisions every day.")}</p>
        <div className="mt-9 flex flex-wrap items-center gap-3"><Link href="/signup" className="inline-flex h-11 items-center gap-2 rounded-md bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-80">{t("Create account")} <ArrowUpRight className="size-4" /></Link><Link href="/login" className="inline-flex h-11 items-center rounded-md border bg-card px-5 text-sm font-medium transition hover:bg-muted">{t("View my space")}</Link></div>
        <p className="mt-5 text-xs text-muted-foreground">{t("Free to get started · Your currency, your choice")}</p>
      </div>
      <div className="mt-20 overflow-hidden rounded-xl border bg-card shadow-[0_20px_80px_-40px_rgba(0,0,0,.25)] dark:shadow-none"><div className="flex h-11 items-center gap-1.5 border-b px-5"><span className="size-2 rounded-full bg-border" /><span className="size-2 rounded-full bg-border" /><span className="size-2 rounded-full bg-border" /><span className="ms-4 text-xs text-muted-foreground">rasid / {t("Overview")}</span></div>
        <div className="grid md:grid-cols-[190px_1fr] rtl:md:grid-cols-[1fr_190px]"><aside className="hidden border-e p-5 md:block"><div className="mb-9 font-heading font-semibold tracking-tight"><BrandLogo /></div><div className="space-y-2 text-xs"><div className="rounded-md bg-muted px-3 py-2.5 font-medium">{t("Overview")}</div><div className="px-3 py-2.5 text-muted-foreground">{t("Transactions")}</div><div className="px-3 py-2.5 text-muted-foreground">{t("Budgets")}</div><div className="px-3 py-2.5 text-muted-foreground">{t("Goals")}</div></div></aside>
          <div className="p-6 sm:p-9"><div className="flex items-start justify-between"><div><p className="text-xs text-muted-foreground">2026</p><h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight">{t("Overview")}</h2></div><span className="rounded-md border px-2.5 py-1.5 text-xs text-muted-foreground">{t("This month")}</span></div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">{[["Total balance", "12 450 MAD", "+ 8.2 %"], ["Income", "8 200 MAD", "+ 12.4 %"], ["Expenses", "3 950 MAD", "− 3.1 %"]].map(([label,value,change]) => <div key={label} className="rounded-lg border p-5"><p className="text-xs text-muted-foreground">{t(label)}</p><p className="mt-3 font-heading text-xl font-semibold tracking-tight tabular-nums sm:text-2xl" dir="ltr">{value}</p><p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400" dir="ltr">{change}</p></div>)}</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1.5fr_1fr]"><div className="rounded-lg border p-5"><p className="text-sm font-medium">{t("Monthly activity")}</p><p className="mt-1 text-xs text-muted-foreground">{t("Income and expenses at a glance")}</p><div className="mt-8 flex h-28 items-end justify-between gap-3 border-b border-border px-2" aria-hidden="true">{[45,65,54,82,63,90,72,100,75,85,68,95].map((height,i) => <div key={i} className="flex h-full flex-1 items-end gap-1"><div className="w-full rounded-t-sm bg-foreground/85" style={{height:`${height}%`}} /><div className="w-full rounded-t-sm bg-emerald-500/70" style={{height:`${height*.58}%`}} /></div>)}</div></div><div className="rounded-lg border p-5"><p className="text-sm font-medium">{t("Savings goal")}</p><p className="mt-1 text-xs text-muted-foreground">{t("Personal project")}</p><p className="mt-9 text-2xl font-semibold tabular-nums" dir="ltr">7 500 <span className="text-sm text-muted-foreground">/ 10 000 MAD</span></p><div className="mt-4 h-1.5 rounded-full bg-muted"><div className="h-full w-3/4 rounded-full bg-emerald-500" /></div><p className="mt-3 text-xs text-muted-foreground">75 % {t("of the goal reached")}</p></div></div>
          </div></div>
      </div></section>
      <section id="pricing" className="border-t"><div className="mx-auto max-w-6xl px-5 py-20 sm:px-8"><PricingComparison /></div></section>
      <section className="border-t"><div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-16 sm:flex-row sm:items-center sm:px-8"><div><h2 className="font-heading text-2xl font-semibold tracking-tight">{t("Ready for a clearer view?")}</h2><p className="mt-2 text-sm text-muted-foreground">{t("Your financial space is waiting.")}</p></div><Link href="/signup" className="inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-3 text-sm font-medium text-background">{t("Get started")} <ArrowRight className="size-4 rtl:rotate-180" /></Link></div></section>
    </main><footer className="border-t"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-7 text-xs text-muted-foreground sm:px-8"><span>© 2026 Rasid</span><span className="inline-flex items-center gap-1.5"><CircleCheck className="size-3.5" />{t("One currency per account")}</span></div></footer>
  </div>
}
