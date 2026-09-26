"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
import { AddGoalDialog } from "@/components/goals/add-goal-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Goal = {
  id: string
  name: string
  target_amount: number
  current_amount: number
  target_date: string | null
}

function ContributeDialog({ goal }: { goal: Goal }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const supabase = createClient()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const value = parseFloat(amount)
      if (isNaN(value) || value <= 0) throw new Error("Montant invalide")

      const { error } = await supabase
        .from("savings_goals")
        .update({ current_amount: goal.current_amount + value })
        .eq("id", goal.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] })
      queryClient.invalidateQueries({ queryKey: ["unread-alert-count"] })
      queryClient.invalidateQueries({ queryKey: ["alerts"] })
      setAmount("")
      setOpen(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Alimenter
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">
            Alimenter &quot;{goal.name}&quot;
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="number"
            step="0.01"
            placeholder="Montant à ajouter"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button
            className="w-full"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Ajout..." : "Confirmer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function GoalsPage() {
  const supabase = createClient()

  const { data: goals, isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("savings_goals")
        .select("id, name, target_amount, current_amount, target_date")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data as Goal[]
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-semibold">
            Objectifs d&apos;épargne
          </h1>
          <p className="text-muted-foreground text-sm">
            Suis ta progression vers tes objectifs
          </p>
        </div>
        <AddGoalDialog />
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      )}

      {!isLoading && goals?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aucun objectif pour l&apos;instant. Crée le premier !
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals?.map((goal) => {
          const percent = Math.min(
            Math.round((goal.current_amount / goal.target_amount) * 100),
            100
          )
          const reached = goal.current_amount >= goal.target_amount

          return (
            <Card key={goal.id}>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{goal.name}</p>
                  {goal.target_date && (
                    <span className="text-xs text-muted-foreground">
                      Échéance :{" "}
                      {format(new Date(goal.target_date), "MMM yyyy", {
                        locale: fr,
                      })}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-heading font-semibold tabular-nums">
                    {goal.current_amount.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    / {goal.target_amount.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>

                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      reached ? "bg-primary" : "bg-primary/70"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {reached ? "Objectif atteint 🎉" : `${percent}% complété`}
                  </p>
                  {!reached && <ContributeDialog goal={goal} />}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}