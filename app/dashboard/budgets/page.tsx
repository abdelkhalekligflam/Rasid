"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { AddBudgetDialog } from "@/components/budgets/add-budget-dialog"
import { Card, CardContent } from "@/components/ui/card"

type Budget = {
  id: string
  amount_limit: number
  recurrence: string
  categories: { name: string } | null
}

type Transaction = {
  category_id: string
  amount: number
}

export default function BudgetsPage() {
  const supabase = createClient()

  const { data: budgets, isLoading } = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("id, amount_limit, recurrence, category_id, categories(name)")
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
        .select("category_id, amount")
        .eq("type", "expense")
      if (error) throw error
      return data as Transaction[]
    },
  })

  function getSpent(categoryId: string) {
    return (
      transactions
        ?.filter((tx) => tx.category_id === categoryId)
        .reduce((sum, tx) => sum + Number(tx.amount), 0) || 0
    )
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
          const spent = getSpent(budget.category_id)
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