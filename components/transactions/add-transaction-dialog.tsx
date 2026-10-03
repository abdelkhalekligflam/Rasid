"use client"

import { useRefreshDashboard } from "@/hooks/use-refresh-dashboard"

import { useT, useLocale } from "@/components/locale-provider"
import { categoryName } from "@/lib/i18n"

import { translateLegacy } from "@/lib/i18n"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarIcon, Plus } from "lucide-react"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import {
  transactionSchema,
  type TransactionInput,
} from "@/lib/validations/transaction"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

type Category = {
  id: string
  name: string
  type: "income" | "expense"
}

export function AddTransactionDialog() {
  const refreshDashboard = useRefreshDashboard()
  const t = useT()
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [type, setType] = useState<"income" | "expense">("expense")
  const supabase = createClient()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof transactionSchema>, unknown, TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { type: "expense", transactionDate: new Date() },
  })

  const selectedDate = useWatch({ control, name: "transactionDate" })

  const { data: categories, error: categoryError } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, type")
        .order("name")
      if (error) throw error
      return data as Category[]
    },
  })

  const filteredCategories = categories?.filter((c) => c.type === type)

  const mutation = useMutation({
    mutationFn: async (values: TransactionInput) => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error(t('Please sign in again.'))

      const { error } = await supabase.from("transactions").insert({
        user_id: userData.user.id,
        category_id: values.categoryId,
        type: values.type,
        amount: values.amount,
        description: values.description || null,
        transaction_date: format(values.transactionDate, "yyyy-MM-dd"),
      })
      if (error) throw error
    },
    onSuccess: () => { void refreshDashboard();
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["transactions-for-budgets"] })
      queryClient.invalidateQueries({ queryKey: ["unread-alert-count"] })
      queryClient.invalidateQueries({ queryKey: ["alerts"] })
      reset()
      setOpen(false)
    },
  })

  function onSubmit(values: TransactionInput) {
    mutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="me-2 h-4 w-4" />
          {t('New transaction')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">{t('New transaction')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === "expense" ? "default" : "outline"}
              className="flex-1"
              onClick={() => {
                setType("expense")
                setValue("type", "expense")
                setValue("categoryId", "")
              }}
            >
              {t('Expense')}
            </Button>
            <Button
              type="button"
              variant={type === "income" ? "default" : "outline"}
              className="flex-1"
              onClick={() => {
                setType("income")
                setValue("type", "income")
                setValue("categoryId", "")
              }}
            >
              {t('Income item')}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>{t('Category')}</Label>
            <Select onValueChange={(val) => setValue("categoryId", val)}>
              <SelectTrigger>
                <SelectValue placeholder={t("Choose a category")} />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories?.map((cat) => (
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
            <Label htmlFor="amount">{t('Amount')}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("amount")}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">
                {translateLegacy(locale, errors.amount.message || "")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('Date')}</Label>
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
                  {selectedDate ? format(selectedDate, "dd/MM/yyyy") : t("Choose a date")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  defaultMonth={selectedDate}
                  onSelect={(date) => { if (date) { setValue("transactionDate", date, { shouldValidate: true, shouldDirty: true }); setDateOpen(false) } }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('Description (optional)')}</Label>
            <Textarea
              id="description"
              placeholder={t("e.g. Groceries")}
              {...register("description")}
            />
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? t("Adding...") : t("Add")}
          </Button>
          {mutation.error && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
        </form>
      </DialogContent>
    </Dialog>
  )
}
