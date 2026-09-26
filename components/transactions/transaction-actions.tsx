"use client"

import { useT, useLocale } from "@/components/locale-provider"
import { categoryName } from "@/lib/i18n"

import { useState } from "react"
import { ConfirmAction } from "@/components/shared/confirm-action"
import { notify } from "@/components/shared/toast"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Pencil, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type TransactionRow = {
  id: string
  amount: number
  type: "income" | "expense"
  category_id: string | null
  description: string | null
  transaction_date: string
  categories: { name: string } | null
}

export function TransactionActions({ transaction }: { transaction: TransactionRow }) {
  const t = useT()
  const locale = useLocale()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [type, setType] = useState(transaction.type)
  const [categoryId, setCategoryId] = useState(transaction.category_id || "")
  const [amount, setAmount] = useState(String(transaction.amount))
  const [description, setDescription] = useState(transaction.description || "")
  const [date, setDate] = useState(transaction.transaction_date)

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, type").order("name")
      if (error) throw error
      return data as { id: string; name: string; type: string }[]
    },
    enabled: open,
  })
  const refresh = () => {
    for (const key of ["transactions", "transactions-for-budgets", "alerts", "unread-alert-count"]) {
      queryClient.invalidateQueries({ queryKey: [key] })
    }
  }
  const update = useMutation({
    mutationFn: async () => {
      const value = Number(amount)
      if (!Number.isFinite(value) || value <= 0 || !categoryId || !date) {
        throw new Error(t("Please enter a category, date and positive amount."))
      }
      const { error } = await supabase.from("transactions").update({
        type, category_id: categoryId, amount: value,
        description: description.trim() || null, transaction_date: date,
      }).eq("id", transaction.id)
      if (error) throw error
    },
    onSuccess: () => { refresh(); setOpen(false) },
  })
  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("transactions").delete().eq("id", transaction.id)
      if (error) throw error
    },
    onSuccess: () => { refresh(); setConfirmOpen(false); notify("Transaction supprimée.") },
    onError: () => notify("Impossible de supprimer la transaction.", true),
  })

  return (
    <>
      <div className="flex gap-1">
        <Button size="icon-sm" variant="ghost" aria-label={t("Edit transaction")} onClick={() => setOpen(true)}>
          <Pencil aria-hidden="true" />
        </Button>
        <Button
          size="icon-sm" variant="ghost" aria-label={t("Delete transaction")}
          disabled={remove.isPending}
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
      {remove.isError && <p role="alert" className="text-xs text-destructive">{t("Couldn't delete the transaction.")}</p>}
      <ConfirmAction open={confirmOpen} onOpenChange={setConfirmOpen} title={t("Delete this transaction?")} description={t("This transaction will be permanently removed from your history.")} action={t("Delete")} destructive pending={remove.isPending} onConfirm={() => remove.mutate()} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('Edit transaction')}</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); update.mutate() }}>
            <div className="space-y-2">
              <Label htmlFor={`type-${transaction.id}`}>{t('Type')}</Label>
              <select id={`type-${transaction.id}`} className="w-full rounded-md border bg-background p-2 text-sm"
                value={type} onChange={(event) => { setType(event.target.value as "income" | "expense"); setCategoryId("") }}>
                <option value="expense">{t('Expense')}</option><option value="income">{t('Income item')}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`category-${transaction.id}`}>{t('Category')}</Label>
              <select id={`category-${transaction.id}`} required className="w-full rounded-md border bg-background p-2 text-sm"
                value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                <option value="">{t("Choose a category")}</option>
                {categories?.filter((category) => category.type === type).map((category) =>
                  <option key={category.id} value={category.id}>{categoryName(locale, category.name)}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`amount-${transaction.id}`}>{t('Amount')}</Label>
              <Input id={`amount-${transaction.id}`} type="number" min="0.01" step="0.01" required value={amount}
                onChange={(event) => setAmount(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`date-${transaction.id}`}>{t('Date')}</Label>
              <Input id={`date-${transaction.id}`} type="date" required value={date}
                onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`description-${transaction.id}`}>{t('Description')}</Label>
              <Input id={`description-${transaction.id}`} value={description}
                onChange={(event) => setDescription(event.target.value)} />
            </div>
            {update.error && (
              <p role="alert" className="text-sm text-destructive">
                {update.error.message}
              </p>
            )}
            <Button type="submit" disabled={update.isPending} className="w-full">
              {update.isPending ? t("Saving...") : t("Save")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
