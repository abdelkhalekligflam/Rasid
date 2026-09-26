"use client"

import { useT, useLocale } from "@/components/locale-provider"
import { categoryName } from "@/lib/i18n"

import { useQuery } from "@tanstack/react-query"
import { addMonths, addWeeks, addYears, differenceInCalendarDays, differenceInCalendarMonths, differenceInCalendarYears, format, parseISO } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { AddBudgetDialog } from "@/components/budgets/add-budget-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { BudgetActions } from "@/components/budgets/budget-actions"
import { useCurrency } from "@/hooks/use-currency"
import { PageSkeleton } from "@/components/shared/page-skeleton"

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
  const t = useT()
  const locale = useLocale()
  const supabase = createClient()
  const money = useCurrency()

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
  const today = new Date()
  const earliestStart = budgets?.length
    ? budgets.map((budget) => getBudgetPeriod(budget, today).start).sort()[0]
    : null

  const { data: transactions } = useQuery({
    queryKey: ["transactions-for-budgets", earliestStart],
    enabled: budgets !== undefined,
    queryFn: async () => {
      if (!earliestStart) return []
      const pageSize = 1000
      const all: Transaction[] = []
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await supabase
          .from("transactions")
          .select("category_id, amount, transaction_date")
          .eq("type", "expense")
          .gte("transaction_date", earliestStart)
          .lte("transaction_date", format(today, "yyyy-MM-dd"))
          .order("transaction_date", { ascending: false })
          .range(offset, offset + pageSize - 1)
        if (error) throw error
        all.push(...(data as Transaction[]))
        if (!data || data.length < pageSize) break
      }
      return all
    },
  })

  function getSpent(budget: Budget & { category_id: string }) {
    const { start, end } = getBudgetPeriod(budget, today)
    return transactions
      ?.filter((tx) =>
        tx.category_id === budget.category_id &&
        tx.transaction_date >= start &&
        tx.transaction_date < end
      )
      .reduce((sum, tx) => sum + Number(tx.amount), 0) ?? 0
  }

  const recurrenceLabel: Record<string, string> = {
    weekly: t("Weekly"),
    monthly: t("Monthly"),
    yearly: t("Yearly"),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-semibold">{t("Budgets")}</h1>
          <p className="text-muted-foreground text-sm">
            {t('Manage spending limits by category')}
          </p>
        </div>
        <AddBudgetDialog />
      </div>

      {isLoading && <PageSkeleton />}

      {!isLoading && budgets?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t('No budgets yet. Create your first one!')}
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
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">
                    {budget.categories?.name ? categoryName(locale, budget.categories.name) : t("Uncategorized")}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{recurrenceLabel[budget.recurrence]}</span>
                    <BudgetActions budget={budget} />
                  </div>
                </div>

                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-heading font-semibold tabular-nums">
                    {money(spent)}
                  </p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    / {money(Number(budget.amount_limit))}
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
                    ? `${t("Over by")} ${money(spent - Number(budget.amount_limit))}`
                    : `${t("Remaining")} ${money(Number(budget.amount_limit) - spent)}`}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
