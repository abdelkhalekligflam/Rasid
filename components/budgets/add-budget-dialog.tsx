"use client"

import Link from "next/link"
import { freeLimitMessage } from "@/lib/billing/plans"

import { useRefreshDashboard } from "@/hooks/use-refresh-dashboard"

import { useT, useLocale } from "@/components/locale-provider"
import { categoryName } from "@/lib/i18n"

import { translateLegacy } from "@/lib/i18n"
import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { budgetSchema, type BudgetInput } from "@/lib/validations/budget"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Category = {
  id: string
  name: string
  type: "income" | "expense"
}

export function AddBudgetDialog() {
  const refreshDashboard = useRefreshDashboard()
  const t = useT()
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const supabase = createClient()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof budgetSchema>, unknown, BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { recurrence: "monthly" },
  })

  const { data: categories, error: categoryError } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, type")
        .eq("type", "expense")
        .order("name")
      if (error) throw error
      return data as Category[]
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: BudgetInput) => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error(t('Please sign in again.'))

      const { error } = await supabase.from("budgets").insert({
        user_id: userData.user.id,
        category_id: values.categoryId,
        amount_limit: values.amountLimit,
        recurrence: values.recurrence,
        start_date: format(new Date(), "yyyy-MM-dd"),
      })
      if (error) throw error
    },
    onSuccess: () => { void refreshDashboard();
      queryClient.invalidateQueries({ queryKey: ["budgets"] })
      reset()
      setOpen(false)
    },
  })

  function onSubmit(values: BudgetInput) {
    mutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="me-2 h-4 w-4" />
          {t('New budget')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">{t('New budget')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('Category')}</Label>
            <Select onValueChange={(val) => setValue("categoryId", val)}>
              <SelectTrigger>
                <SelectValue placeholder={t("Choose a category")} />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {categoryName(locale, cat.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-sm text-destructive">
                {translateLegacy(locale, errors.categoryId.message || "")}
              </p>
            )}
            {categoryError && <p role="alert" className="text-sm text-destructive">{t("Couldn't load categories.")}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amountLimit">{t('Limit')}</Label>
            <Input
              id="amountLimit"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("amountLimit")}
            />
            {errors.amountLimit && (
              <p className="text-sm text-destructive">
                {translateLegacy(locale, errors.amountLimit.message || "")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('Recurrence')}</Label>
            <Select
              defaultValue="monthly"
              onValueChange={(val) =>
                setValue("recurrence", val as BudgetInput["recurrence"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">{t('Weekly')}</SelectItem>
                <SelectItem value="monthly">{t('Monthly')}</SelectItem>
                <SelectItem value="yearly">{t('Yearly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? t("Creating...") : t("Create budget")}
          </Button>
          {mutation.error && <div role="alert" className="space-y-2"><p className="text-sm text-destructive">{freeLimitMessage(mutation.error, t)}</p>{mutation.error.message.startsWith("FREE_LIMIT_") && <Link href="/dashboard/billing" className="text-sm underline underline-offset-4">{t("View plans")}</Link>}</div>}
        </form>
      </DialogContent>
    </Dialog>
  )
}
