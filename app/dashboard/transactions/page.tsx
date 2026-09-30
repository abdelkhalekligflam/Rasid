"use client"

import { useT, useLocale } from "@/components/locale-provider"
import { categoryName } from "@/lib/i18n"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { fr, enUS, arMA } from "date-fns/locale"

import { createClient } from "@/lib/supabase/client"
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TransactionActions, type TransactionRow } from "@/components/transactions/transaction-actions"
import { useCurrency } from "@/hooks/use-currency"
import { PageSkeleton } from "@/components/shared/page-skeleton"

export default function TransactionsPage() {
  const t = useT()
  const locale = useLocale()
  const dateLocale = locale === "ar" ? arMA : locale === "fr" ? fr : enUS
  const supabase = createClient()
  const money = useCurrency()
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
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
    (categoryFilter === "all" || tx.category_id === categoryFilter) &&
    (!monthFilter || tx.transaction_date.startsWith(monthFilter)) &&
    (!search || `${tx.categories?.name || ""} ${tx.description || ""}`.toLowerCase().includes(search.toLowerCase()))
  )
  const categories = [...new Map(
    transactions?.filter((tx) => tx.category_id).map((tx) => [tx.category_id, tx.categories?.name ? categoryName(locale, tx.categories.name) : t("Uncategorized")]) || []
  )]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-semibold">{t("Transactions")}</h1>
          <p className="text-muted-foreground text-sm">
            {t('Your income and expense history')}
          </p>
        </div>
        <AddTransactionDialog />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Input aria-label={t("Search...")} placeholder={t('Search...')} value={search} onChange={(event) => setSearch(event.target.value)} />
        <select aria-label={t("All types")} className="h-9 rounded-md border bg-background px-3 text-sm" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="all">{t("All types")}</option><option value="expense">{t("Expenses")}</option><option value="income">{t("Income")}</option>
        </select>
        <select aria-label={t("All categories")} className="h-9 rounded-md border bg-background px-3 text-sm"
          value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="all">{t("All categories")}</option>
          {categories.map(([id, name]) => <option key={id} value={id || ""}>{name}</option>)}
        </select>
        <Input aria-label={t("This month")} type="month" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} />
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading && <div className="p-4"><PageSkeleton /></div>}

          {loadError && <p role="alert" className="p-6 text-sm text-destructive">{t("Couldn't load transactions.")}</p>}
          {!isLoading && !loadError && filtered?.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">
              {t('No transactions found.')}
            </p>
          )}

          {filtered?.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b last:border-b-0"
            >
              <div>
                <p className="font-medium">
                  {tx.categories?.name ? categoryName(locale, tx.categories.name) : t("Uncategorized")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {tx.description || "—"} ·{" "}
                  {format(new Date(tx.transaction_date), "d MMM yyyy", {
                    locale: dateLocale,
                  })}
                </p>
              </div>
              <p
                className={`font-heading font-semibold tabular-nums ${
                  tx.type === "income" ? "text-primary" : "text-foreground"
                } ms-auto shrink-0`}
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
