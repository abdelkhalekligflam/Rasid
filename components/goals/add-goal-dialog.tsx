"use client"

import { useRefreshDashboard } from "@/hooks/use-refresh-dashboard"

import { useT, useLocale } from "@/components/locale-provider"

import { translateLegacy } from "@/lib/i18n"
import { useState } from "react"
import { z } from "zod"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarIcon, Plus } from "lucide-react"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { goalSchema, type GoalInput } from "@/lib/validations/goal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

export function AddGoalDialog() {
  const refreshDashboard = useRefreshDashboard()
  const t = useT()
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const supabase = createClient()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof goalSchema>, unknown, GoalInput>({
    resolver: zodResolver(goalSchema),
  })

  const selectedDate = useWatch({ control, name: "targetDate" })

  const mutation = useMutation({
    mutationFn: async (values: GoalInput) => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error(t('Please sign in again.'))

      const { error } = await supabase.from("savings_goals").insert({
        user_id: userData.user.id,
        name: values.name,
        target_amount: values.targetAmount,
        target_date: values.targetDate
          ? format(values.targetDate, "yyyy-MM-dd")
          : null,
      })
      if (error) throw error
    },
    onSuccess: () => { void refreshDashboard();
      queryClient.invalidateQueries({ queryKey: ["goals"] })
      reset()
      setOpen(false)
    },
  })

  function onSubmit(values: GoalInput) {
    mutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="me-2 h-4 w-4" />
          {t('New goal')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">{t('New goal')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('Goal name')}</Label>
            <Input
              id="name"
              placeholder={t("e.g. Emergency fund")}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{translateLegacy(locale, errors.name.message || "")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAmount">{t('Target amount')}</Label>
            <Input
              id="targetAmount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("targetAmount")}
            />
            {errors.targetAmount && (
              <p className="text-sm text-destructive">
                {translateLegacy(locale, errors.targetAmount.message || "")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('Target date (optional)')}</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-start font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="me-2 h-4 w-4" />
                  {selectedDate
                    ? format(selectedDate, "dd/MM/yyyy")
                    : t("Choose a date")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  defaultMonth={selectedDate}
                  onSelect={(date) => { if (date) { setValue("targetDate", date, { shouldValidate: true, shouldDirty: true }); setDateOpen(false) } }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? t("Creating...") : t("Create goal")}
          </Button>
          {mutation.error && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
        </form>
      </DialogContent>
    </Dialog>
  )
}
