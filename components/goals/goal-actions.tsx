"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Pencil, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Goal = { id: string; name: string; target_amount: number; target_date: string | null }

export function GoalActions({ goal }: { goal: Goal }) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(goal.name)
  const [target, setTarget] = useState(String(goal.target_amount))
  const [date, setDate] = useState(goal.target_date || "")
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["goals"] })
  const update = useMutation({
    mutationFn: async () => {
      const value = Number(target)
      if (!name.trim() || !Number.isFinite(value) || value <= 0) throw new Error("Nom et montant cible positif obligatoires.")
      const { error } = await supabase.from("savings_goals")
        .update({ name: name.trim(), target_amount: value, target_date: date || null }).eq("id", goal.id)
      if (error) throw error
    },
    onSuccess: () => { refresh(); setOpen(false) },
  })
  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("savings_goals").delete().eq("id", goal.id)
      if (error) throw error
    },
    onSuccess: refresh,
  })
  return (
    <>
      <Button size="icon-sm" variant="ghost" aria-label="Modifier l'objectif" onClick={() => setOpen(true)}>
        <Pencil aria-hidden="true" />
      </Button>
      <Button size="icon-sm" variant="ghost" aria-label="Supprimer l'objectif" disabled={remove.isPending}
        onClick={() => { if (window.confirm("Supprimer cet objectif ?")) remove.mutate() }}>
        <Trash2 aria-hidden="true" />
      </Button>
      {remove.isError && <p role="alert" className="text-xs text-destructive">Suppression impossible.</p>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier l&apos;objectif</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); update.mutate() }}>
            <div className="space-y-2">
              <Label htmlFor={`goal-name-${goal.id}`}>Nom</Label>
              <Input id={`goal-name-${goal.id}`} value={name} required onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`goal-target-${goal.id}`}>Montant cible</Label>
              <Input id={`goal-target-${goal.id}`} type="number" step="0.01" min="0.01" required
                value={target} onChange={(event) => setTarget(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`goal-date-${goal.id}`}>Date cible</Label>
              <Input id={`goal-date-${goal.id}`} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            {update.error && <p role="alert" className="text-sm text-destructive">{update.error.message}</p>}
            <Button type="submit" className="w-full" disabled={update.isPending}>Enregistrer</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
