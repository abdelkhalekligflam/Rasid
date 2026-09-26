"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Pencil, Archive } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Budget = { id: string; amount_limit: number; recurrence: "weekly" | "monthly" | "yearly"; categories: { name: string } | null }

export function BudgetActions({ budget }: { budget: Budget }) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
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
    onSuccess: refresh,
  })
  return (
    <>
      <div className="flex gap-1">
        <Button size="icon-sm" variant="ghost" aria-label="Modifier le budget" onClick={() => setOpen(true)}>
          <Pencil aria-hidden="true" />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="Archiver le budget" disabled={archive.isPending}
          onClick={() => { if (window.confirm("Archiver ce budget ?")) archive.mutate() }}>
          <Archive aria-hidden="true" />
        </Button>
      </div>
      {archive.isError && <p role="alert" className="text-xs text-destructive">Archivage impossible.</p>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier {budget.categories?.name || "le budget"}</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); update.mutate() }}>
            <div className="space-y-2">
              <Label htmlFor={`limit-${budget.id}`}>Plafond</Label>
              <Input id={`limit-${budget.id}`} type="number" min="0.01" step="0.01" required
                value={amount} onChange={(event) => setAmount(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`recurrence-${budget.id}`}>Récurrence</Label>
              <select id={`recurrence-${budget.id}`} value={recurrence}
                onChange={(event) => setRecurrence(event.target.value as Budget["recurrence"])}
                className="w-full rounded-md border bg-background p-2 text-sm">
                <option value="weekly">Hebdomadaire</option><option value="monthly">Mensuel</option><option value="yearly">Annuel</option>
              </select>
            </div>
            {update.error && <p role="alert" className="text-sm text-destructive">{update.error.message}</p>}
            <Button type="submit" disabled={update.isPending} className="w-full">Enregistrer</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
