"use client"

import { useT } from "@/components/locale-provider"

import { useState } from "react"
import { ConfirmAction } from "@/components/shared/confirm-action"
import { notify } from "@/components/shared/toast"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Pencil, Archive } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Budget = { id: string; amount_limit: number; recurrence: "weekly" | "monthly" | "yearly"; categories: { name: string } | null }

export function BudgetActions({ budget }: { budget: Budget }) {
  const t = useT()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [amount, setAmount] = useState(String(budget.amount_limit))
  const [recurrence, setRecurrence] = useState(budget.recurrence)
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["budgets"] })
  const update = useMutation({
    mutationFn: async () => {
      const value = Number(amount)
      if (!Number.isFinite(value) || value <= 0) throw new Error("Le plafond doit être positif.")
      const { error } = await supabase.from("budgets")
        .update({ amount_limit: value, recurrence }).eq("id", budget.id)
      if (error) throw error
    },
    onSuccess: () => { refresh(); setOpen(false) },
  })
  const archive = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("budgets")
        .update({ is_active: false }).eq("id", budget.id)
      if (error) throw error
    },
    onSuccess: () => { refresh(); setConfirmOpen(false); notify("Budget archivé.") },
    onError: () => notify("Impossible d’archiver le budget.", true),
  })
  return (
    <>
      <div className="flex gap-1">
        <Button size="icon-sm" variant="ghost" aria-label={t("Edit budget")} onClick={() => setOpen(true)}>
          <Pencil aria-hidden="true" />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label={t("Archive budget")} disabled={archive.isPending}
          onClick={() => setConfirmOpen(true)}>
          <Archive aria-hidden="true" />
        </Button>
      </div>
      {archive.isError && <p role="alert" className="text-xs text-destructive">{t("Couldn't archive the budget.")}</p>}
      <ConfirmAction open={confirmOpen} onOpenChange={setConfirmOpen} title={t("Archive this budget?")} description={t("This budget won't be tracked in future periods.")} action={t("Archive")} pending={archive.isPending} onConfirm={() => archive.mutate()} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("Edit budget")} · {budget.categories?.name || t("Uncategorized")}</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); update.mutate() }}>
            <div className="space-y-2">
              <Label htmlFor={`limit-${budget.id}`}>{t('Limit')}</Label>
              <Input id={`limit-${budget.id}`} type="number" min="0.01" step="0.01" required
                value={amount} onChange={(event) => setAmount(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`recurrence-${budget.id}`}>{t('Recurrence')}</Label>
              <select id={`recurrence-${budget.id}`} value={recurrence}
                onChange={(event) => setRecurrence(event.target.value as Budget["recurrence"])}
                className="w-full rounded-md border bg-background p-2 text-sm">
                <option value="weekly">{t('Weekly')}</option><option value="monthly">{t('Monthly')}</option><option value="yearly">{t('Yearly')}</option>
              </select>
            </div>
            {update.error && <p role="alert" className="text-sm text-destructive">{update.error.message}</p>}
            <Button type="submit" disabled={update.isPending} className="w-full">{t('Save')}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
