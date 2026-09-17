"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
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

  const { data: categories } = useQuery({
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
      if (!userData.user) throw new Error("Non connecté")

      const { error } = await supabase.from("budgets").insert({
        user_id: userData.user.id,
        category_id: values.categoryId,
        amount_limit: values.amountLimit,
        recurrence: values.recurrence,
        start_date: new Date().toISOString().split("T")[0],
      })
      if (error) throw error
    },
    onSuccess: () => {
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
          <Plus className="mr-2 h-4 w-4" />
          Nouveau budget
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Nouveau budget</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select onValueChange={(val) => setValue("categoryId", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-sm text-destructive">
                {errors.categoryId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amountLimit">Plafond</Label>
            <Input
              id="amountLimit"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("amountLimit")}
            />
            {errors.amountLimit && (
              <p className="text-sm text-destructive">
                {errors.amountLimit.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Récurrence</Label>
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
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
                <SelectItem value="yearly">Annuel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Création..." : "Créer le budget"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}