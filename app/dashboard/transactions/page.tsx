"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TransactionActions, type TransactionRow } from "@/components/transactions/transaction-actions"
import { useCurrency } from "@/hooks/use-currency"
import { PageSkeleton } from "@/components/shared/page-skeleton"

export default function TransactionsPage() {
  const supabase = createClient()
  const money = useCurrency()
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [monthFilter, setMonthFilter] = useState("")

  const { data: transactions, isLoading, error: loadError } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const all: TransactionRow[] = []
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await supabase.from("transactions")
          .select("id, amount, type, category_id, description, transaction_date, categories(name)")
          .order("transaction_date", { ascending: false })
          .order("id", { ascending: false })
          .range(offset, offset + 999)
        if (error) throw error
        all.push(...(data as unknown as TransactionRow[]))
        if (!data || data.length < 1000) break
      }
      return all
    },
  })
  const filtered = transactions?.filter((tx) =>
    (typeFilter === "all" || tx.type === typeFilter) &&
    (!monthFilter || tx.transaction_date.startsWith(monthFilter)) &&
    (!search || `${tx.categories?.name || ""} ${tx.description || ""}`.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-semibold">Transactions</h1>
          <p className="text-muted-foreground text-sm">
            Historique de tes revenus et dépenses
          </p>
        </div>
        <AddTransactionDialog />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Input aria-label="Rechercher les transactions" placeholder="Rechercher..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <select aria-label="Filtrer par type" className="h-9 rounded-md border bg-background px-3 text-sm" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="all">Tous les types</option><option value="expense">Dépenses</option><option value="income">Revenus</option>
        </select>
        <Input aria-label="Filtrer par mois" type="month" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} />
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading && <div className="p-4"><PageSkeleton /></div>}

          {loadError && <p role="alert" className="p-6 text-sm text-destructive">Impossible de charger les transactions.</p>}
          {!isLoading && !loadError && filtered?.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">
              Aucune transaction trouvée.
            </p>
          )}

          {filtered?.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b last:border-b-0"
            >
              <div>
                <p className="font-medium">
                  {tx.categories?.name || "Sans catégorie"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {tx.description || "—"} ·{" "}
                  {format(new Date(tx.transaction_date), "d MMM yyyy", {
                    locale: fr,
                  })}
                </p>
              </div>
              <p
                className={`font-heading font-semibold tabular-nums ${
                  tx.type === "income" ? "text-primary" : "text-foreground"
                } ml-auto shrink-0`}
              >
                {tx.type === "income" ? "+" : "-"}
                {money(Number(tx.amount))}
              </p>
              <TransactionActions transaction={tx} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
