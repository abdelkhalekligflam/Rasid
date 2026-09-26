import { redirect } from "next/navigation"
import { format, startOfMonth, subMonths } from "date-fns"
import { fr } from "date-fns/locale"
import { ArrowDownLeft, ArrowUpRight, PiggyBank, Wallet } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { DashboardCharts } from "@/components/charts/dashboard-charts"

type Transaction = {
  id: string
  amount: number
  type: "income" | "expense"
  transaction_date: string
  categories: { name: string } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const [{ data: profile }, { data: goals }] = await Promise.all([
    supabase.from("profiles").select("full_name, currency").eq("id", user.id).single(),
    supabase.from("savings_goals").select("current_amount"),
  ])
  const transactions: Transaction[] = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from("transactions")
      .select("id, amount, type, transaction_date, categories(name)")
      .order("transaction_date", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + 999)
    if (error) throw error
    transactions.push(...(data as unknown as Transaction[]))
    if (!data || data.length < 1000) break
  }
  const currency = profile?.currency || "MAD"
  const money = (amount: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(amount)
  const today = new Date()
  const monthKey = format(today, "yyyy-MM")
  const current = transactions.filter((tx) => tx.transaction_date.startsWith(monthKey))
  const income = current.filter((tx) => tx.type === "income").reduce((sum, tx) => sum + Number(tx.amount), 0)
  const expenses = current.filter((tx) => tx.type === "expense").reduce((sum, tx) => sum + Number(tx.amount), 0)
  const balance = transactions.reduce((sum, tx) => sum + (tx.type === "income" ? Number(tx.amount) : -Number(tx.amount)), 0)
  const saved = goals?.reduce((sum, goal) => sum + Number(goal.current_amount), 0) ?? 0
  const categories = new Map<string, number>()
  for (const tx of current) {
    if (tx.type !== "expense") continue
    const name = tx.categories?.name || "Sans catégorie"
    categories.set(name, (categories.get(name) ?? 0) + Number(tx.amount))
  }
  const categoryData = [...categories].map(([name, value]) => ({ name, value }))
  const monthlyData = Array.from({ length: 6 }, (_, index) => {
    const date = startOfMonth(subMonths(today, 5 - index))
    const entries = transactions.filter((tx) => tx.transaction_date.startsWith(format(date, "yyyy-MM")))
    return {
      month: format(date, "MMM", { locale: fr }),
      revenus: entries.filter((tx) => tx.type === "income").reduce((sum, tx) => sum + Number(tx.amount), 0),
      depenses: entries.filter((tx) => tx.type === "expense").reduce((sum, tx) => sum + Number(tx.amount), 0),
    }
  })
  const stats = [
    { label: "Solde total", value: balance, icon: Wallet },
    { label: "Revenus du mois", value: income, icon: ArrowDownLeft },
    { label: "Dépenses du mois", value: expenses, icon: ArrowUpRight },
    { label: "Épargne suivie", value: saved, icon: PiggyBank },
  ]

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">Vue d&apos;ensemble · {format(today, "MMMM yyyy", { locale: fr })}</p>
        <h1 className="mt-1 text-3xl font-heading font-semibold tracking-tight">Bonjour, {profile?.full_name?.split(" ")[0] || "toi"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Voici où en sont tes finances aujourd&apos;hui.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="rounded-xl shadow-none">
            <CardContent className="space-y-5 p-5">
              <div className="flex size-10 items-center justify-center rounded-lg border bg-muted text-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-heading font-semibold tabular-nums">{money(value)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <DashboardCharts monthlyData={monthlyData} categoryData={categoryData} currency={currency} />
      <Card className="rounded-xl shadow-none">
        <CardContent className="p-0">
          <h2 className="px-6 py-5 font-heading text-lg font-semibold">Transactions récentes</h2>
          {transactions.length === 0 && <p className="border-t px-6 py-8 text-sm text-muted-foreground">Aucune transaction pour l&apos;instant.</p>}
          {transactions.slice(0, 5).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between gap-4 border-t px-6 py-4">
              <div>
                <p className="text-sm font-medium">{tx.categories?.name || "Sans catégorie"}</p>
                <p className="text-xs text-muted-foreground">{tx.transaction_date}</p>
              </div>
              <p className={`font-medium tabular-nums ${tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                {tx.type === "income" ? "+" : "−"}{money(Number(tx.amount))}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
