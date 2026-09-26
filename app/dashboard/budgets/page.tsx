"use client"

import { useQuery } from "@tanstack/react-query"
import { addMonths, addWeeks, addYears, differenceInCalendarDays, differenceInCalendarMonths, differenceInCalendarYears, format, parseISO } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { AddBudgetDialog } from "@/components/budgets/add-budget-dialog"
import { Card, CardContent } from "@/components/ui/card"

type Budget = {
  id: string
  amount_limit: number
  recurrence: "weekly" | "monthly" | "yearly"
  start_date: string
  categories: { name: string } | null
}

type Transaction = {
  category_id: string
  amount: number
  transaction_date: string
}

function getBudgetPeriod(budget: Budget, today: Date) {
  const anchor = parseISO(budget.start_date)
  const addPeriod = budget.recurrence === "weekly" ? addWeeks : budget.recurrence === "yearly" ? addYears : addMonths
  let count = budget.recurrence === "weekly"
    ? Math.floor(differenceInCalendarDays(today, anchor) / 7)
    : budget.recurrence === "yearly"
      ? differenceInCalendarYears(today, anchor)
      : differenceInCalendarMonths(today, anchor)
  count = Math.max(0, count)
  while (count > 0 && addPeriod(anchor, count) > today) count--
  while (addPeriod(anchor, count + 1) <= today) count++
  return {
    start: format(addPeriod(anchor, count), "yyyy-MM-dd"),
    end: format(addPeriod(anchor, count + 1), "yyyy-MM-dd"),
  }
}

export default function BudgetsPage() {
  const supabase = createClient()

  const { data: budgets, isLoading } = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("id, amount_limit, recurrence, start_date, category_id, categories(name)")
        .eq("is_active", true)
      if (error) throw error
      return data as unknown as (Budget & { category_id: string })[]
    },
  })

  const { data: transactions } = useQuery({
    queryKey: ["transactions-for-budgets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("category_id, amount, transaction_date")
        .eq("type", "expense")
      if (error) throw error
      return data as Transaction[]
    },
  })

  function getSpent(budget: Budget & { category_id: string }) {
    const { start, end } = getBudgetPeriod(budget, new Date())
    return transactions
      ?.filter((tx) =>
        tx.category_id === budget.category_id &&
        tx.transaction_date >= start &&
        tx.transaction_date < end
      )
      .reduce((sum, tx) => sum + Number(tx.amount), 0) ?? 0
  }

  const recurrenceLabel: Record<string, string> = {
    weekly: "Hebdomadaire",
    monthly: "Mensuel",
    yearly: "Annuel",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-semibold">Budgets</h1>
          <p className="text-muted-foreground text-sm">
            Gère tes plafonds par catégorie
          </p>
        </div>
        <AddBudgetDialog />
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      )}

      {!isLoading && budgets?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aucun budget pour l&apos;instant. Crée le premier !
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets?.map((budget) => {
          const spent = getSpent(budget)
          const percent = Math.min(
            Math.round((spent / budget.amount_limit) * 100),
            999
          )
          const isOver = spent > budget.amount_limit
          const isNear = !isOver && percent >= 80

          return (
            <Card key={budget.id}>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {budget.categories?.name || "Sans catégorie"}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {recurrenceLabel[budget.recurrence]}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-heading font-semibold tabular-nums">
                    {spent.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    / {budget.amount_limit.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isOver
                        ? "bg-destructive"
                        : isNear
                        ? "bg-amber-500"
                        : "bg-primary"
                    }`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>

                <p
                  className={`text-xs ${
                    isOver
                      ? "text-destructive"
                      : isNear
                      ? "text-amber-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {isOver
                    ? `Dépassement de ${(spent - budget.amount_limit).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}`
                    : `Reste ${(budget.amount_limit - spent).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}`}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}