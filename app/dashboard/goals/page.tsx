"use client"

import { useT, useLocale } from "@/components/locale-provider"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { fr, enUS, arMA } from "date-fns/locale"

import { createClient } from "@/lib/supabase/client"
import { AddGoalDialog } from "@/components/goals/add-goal-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GoalActions } from "@/components/goals/goal-actions"
import { useCurrency } from "@/hooks/use-currency"
import { PageSkeleton } from "@/components/shared/page-skeleton"
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
  const t = useT()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const supabase = createClient()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const value = parseFloat(amount)
      if (isNaN(value) || value <= 0) throw new Error(t("Invalid amount"))

      const { error } = await supabase.rpc("contribute_to_goal", {
        goal_id: goal.id, amount_to_add: value,
      })
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
          {t('Add funds')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">
            {t("Add funds to")} &quot;{goal.name}&quot;
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="number"
            min="0.01"
            step="0.01"
            placeholder={t("Amount to add")}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {mutation.error && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
          <Button
            className="w-full"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? t("Adding...") : t("Confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function GoalsPage() {
  const t = useT()
  const locale = useLocale()
  const dateLocale = locale === "ar" ? arMA : locale === "fr" ? fr : enUS
  const supabase = createClient()
  const money = useCurrency()

  const { data: goals, isLoading, error: loadError } = useQuery({
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
            {t('Savings goals')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('Track your progress toward your goals')}
          </p>
        </div>
        <AddGoalDialog />
      </div>

      {isLoading && <PageSkeleton />}
      {loadError && <p role="alert" className="text-sm text-destructive">{t("Couldn't load goals.")}</p>}

      {!isLoading && goals?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t('No goals yet. Create your first one!')}
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
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{goal.name}</p>
                  <div className="flex items-center gap-2">
                  {goal.target_date && (
                    <span className="text-xs text-muted-foreground">
                      {t("Target date:")}{" "}
                      {format(new Date(goal.target_date), "MMM yyyy", {
                        locale: dateLocale,
                      })}
                    </span>
                  )}
                  <GoalActions goal={goal} />
                  </div>
                </div>

                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-heading font-semibold tabular-nums">
                    {money(Number(goal.current_amount))}
                  </p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    / {money(Number(goal.target_amount))}
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
                    {reached ? t("Goal reached 🎉") : `${percent}% ${t("complete")}`}
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
