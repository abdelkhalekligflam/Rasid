"use client"

import { useRefreshDashboard } from "@/hooks/use-refresh-dashboard"

import { useT } from "@/components/locale-provider"

import { useState } from "react"
import { ConfirmAction } from "@/components/shared/confirm-action"
import { notify } from "@/components/shared/toast"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Pencil, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Goal = { id: string; name: string; target_amount: number; target_date: string | null }

export function GoalActions({ goal }: { goal: Goal }) {
  const refreshDashboard = useRefreshDashboard()
  const t = useT()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [name, setName] = useState(goal.name)
  const [target, setTarget] = useState(String(goal.target_amount))
  const [date, setDate] = useState(goal.target_date || "")
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["goals"] })
  const update = useMutation({
    mutationFn: async () => {
      const value = Number(target)
      if (!name.trim() || !Number.isFinite(value) || value <= 0) throw new Error(t('Enter a name and a positive target amount.'))
      const { error } = await supabase.from("savings_goals")
        .update({ name: name.trim(), target_amount: value, target_date: date || null }).eq("id", goal.id)
      if (error) throw error
    },
    onSuccess: () => { void refreshDashboard(); refresh(); setOpen(false) },
  })
  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("savings_goals").delete().eq("id", goal.id)
      if (error) throw error
    },
    onSuccess: () => { void refreshDashboard(); refresh(); setConfirmOpen(false); notify(t('Goal deleted.')) },
    onError: () => notify(t("Couldn't delete the goal."), true),
  })
  return (
    <>
      <Button size="icon-sm" variant="ghost" aria-label={t("Edit goal")} onClick={() => setOpen(true)}>
        <Pencil aria-hidden="true" />
      </Button>
      <Button size="icon-sm" variant="ghost" aria-label={t("Delete goal")} disabled={remove.isPending}
        onClick={() => setConfirmOpen(true)}>
        <Trash2 aria-hidden="true" />
      </Button>
      {remove.isError && <p role="alert" className="text-xs text-destructive">{t("Couldn't delete the goal.")}</p>}
      <ConfirmAction open={confirmOpen} onOpenChange={setConfirmOpen} title={t("Delete this goal?")} description={t("The goal and its progress will be permanently deleted.")} action={t("Delete")} destructive pending={remove.isPending} onConfirm={() => remove.mutate()} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('Edit goal')}</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); update.mutate() }}>
            <div className="space-y-2">
              <Label htmlFor={`goal-name-${goal.id}`}>{t('Name')}</Label>
              <Input id={`goal-name-${goal.id}`} value={name} required onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`goal-target-${goal.id}`}>{t('Target amount')}</Label>
              <Input id={`goal-target-${goal.id}`} type="number" step="0.01" min="0.01" required
                value={target} onChange={(event) => setTarget(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`goal-date-${goal.id}`}>{t('Target date')}</Label>
              <Input id={`goal-date-${goal.id}`} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            {update.error && <p role="alert" className="text-sm text-destructive">{update.error.message}</p>}
            <Button type="submit" className="w-full" disabled={update.isPending}>{t('Save')}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
