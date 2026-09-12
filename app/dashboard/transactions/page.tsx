"use client"

import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog"
import { Card, CardContent } from "@/components/ui/card"

type Transaction = {
  id: string
  amount: number
  type: "income" | "expense"
  description: string | null
  transaction_date: string
  categories: { name: string } | null
}

export default function TransactionsPage() {
  const supabase = createClient()

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, amount, type, description, transaction_date, categories(name)")
        .order("transaction_date", { ascending: false })
      if (error) throw error
      return data as unknown as Transaction[]
    },
  })

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

      <Card>
        <CardContent className="p-0">
          {isLoading && (
            <p className="p-6 text-sm text-muted-foreground">Chargement...</p>
          )}

          {!isLoading && transactions?.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">
              Aucune transaction pour l&apos;instant. Ajoute la première !
            </p>
          )}

          {transactions?.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between px-6 py-4 border-b last:border-b-0"
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
                }`}
              >
                {tx.type === "income" ? "+" : "-"}
                {tx.amount.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}