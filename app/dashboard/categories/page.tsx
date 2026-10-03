"use client"

import Link from "next/link"
import { freeLimitMessage } from "@/lib/billing/plans"

import { useRefreshDashboard } from "@/hooks/use-refresh-dashboard"

import { useT, useLocale } from "@/components/locale-provider"
import { categoryName } from "@/lib/i18n"

import { useState } from "react"
import { ConfirmAction } from "@/components/shared/confirm-action"
import { notify } from "@/components/shared/toast"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageSkeleton } from "@/components/shared/page-skeleton"

type Category = {
  id: string
  name: string
  type: "income" | "expense"
  color: string | null
  is_default: boolean
}

export default function CategoriesPage() {
  const refreshDashboard = useRefreshDashboard()
  const t = useT()
  const locale = useLocale()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [confirmCategory, setConfirmCategory] = useState<Category | null>(null)
  const [name, setName] = useState("")
  const [type, setType] = useState<"income" | "expense">("expense")
  const [color, setColor] = useState("#10B981")
  const [actionError, setActionError] = useState("")

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { error: defaultsError } = await supabase.rpc("ensure_account_defaults")
      if (defaultsError) throw defaultsError
      const { data, error } = await supabase.from("categories")
        .select("id, name, type, color, is_default").order("name")
      if (error) throw error
      return data as Category[]
    },
  })
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] })
    queryClient.invalidateQueries({ queryKey: ["transactions"] })
    queryClient.invalidateQueries({ queryKey: ["budgets"] })
  }
  const save = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error(t('Name is required.'))
      if (editing) {
        const { error } = await supabase.from("categories")
          .update({ name: name.trim(), color }).eq("id", editing.id).eq("is_default", false)
        if (error) throw error
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error(t('Please sign in again.'))
        const { error } = await supabase.from("categories").insert({
          user_id: user.id, name: name.trim(), type, color, is_default: false,
        })
        if (error) throw error
      }
    },
    onSuccess: () => { void refreshDashboard(); refresh(); setOpen(false) },
  })
  const remove = useMutation({
    mutationFn: async (category: Category) => {
      const { error } = await supabase.from("categories").delete()
        .eq("id", category.id).eq("is_default", false)
      if (error) throw error
    },
    onSuccess: () => { void refreshDashboard(); refresh(); setConfirmCategory(null); notify(t("Category deleted.")) },
    onError: () => { notify(t("Couldn't delete this category."), true); setActionError(t('This category is used by transactions or budgets and cannot be deleted.')) },
  })
  const startCreate = () => {
    setEditing(null); setName(""); setType("expense"); setColor("#10B981"); setActionError(""); setOpen(true)
  }
  const startEdit = (category: Category) => {
    setEditing(category); setName(category.name); setType(category.type)
    setColor(category.color || "#10B981"); setActionError(""); setOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-semibold">{t("Categories")}</h1>
          <p className="text-sm text-muted-foreground">{t("Organize your income and expenses")}</p>
        </div>
        <Button onClick={startCreate}><Plus aria-hidden="true" /> {t('New category')}</Button>
      </div>
      {actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}
      <Card><CardContent className="p-0">
        {isLoading && <div className="p-4"><PageSkeleton /></div>}
        {error && <p role="alert" className="p-6 text-sm text-destructive">{t("Couldn't load categories.")}</p>}
        {!isLoading && !error && !categories?.length && <p className="p-6 text-sm text-muted-foreground">{t("No categories yet.")}</p>}
        {categories?.map((category) => (
          <div key={category.id} className="flex items-center gap-3 border-b px-5 py-4 last:border-0">
            <span className="size-3 rounded-full" style={{ backgroundColor: category.color || "#94A3B8" }} />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{categoryName(locale, category.name)}</p>
              <p className="text-xs text-muted-foreground">
                {category.type === "income" ? t("Income item") : t("Expense")} · {category.is_default ? t("Default") : t("Custom")}
              </p>
            </div>
            {!category.is_default && (
              <>
                <Button size="icon-sm" variant="ghost" aria-label={`Modifier ${categoryName(locale, category.name)}`} onClick={() => startEdit(category)}>
                  <Pencil aria-hidden="true" />
                </Button>
                <Button size="icon-sm" variant="ghost" aria-label={`Supprimer ${categoryName(locale, category.name)}`}
                  disabled={remove.isPending}
                  onClick={() => {
                    setActionError("")
                    setConfirmCategory(category)
                  }}>
                  <Trash2 aria-hidden="true" />
                </Button>
              </>
            )}
          </div>
        ))}
      </CardContent></Card>
      <ConfirmAction open={!!confirmCategory} onOpenChange={(value) => { if (!value) setConfirmCategory(null) }} title={t("Delete this category?")} description={t("This category can be deleted if no transactions or budgets use it.")} action={t("Delete")} destructive pending={remove.isPending} onConfirm={() => { if (confirmCategory) remove.mutate(confirmCategory) }} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? t("Edit category") : t("New category")}</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); save.mutate() }}>
            <div className="space-y-2">
              <Label htmlFor="category-name">{t("Name")}</Label>
              <Input id="category-name" required maxLength={60} value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            {!editing && <div className="space-y-2">
              <Label htmlFor="category-type">{t("Type")}</Label>
              <select id="category-type" className="w-full rounded-md border bg-background p-2 text-sm" value={type}
                onChange={(event) => setType(event.target.value as "income" | "expense")}>
                <option value="expense">{t("Expense")}</option><option value="income">{t("Income item")}</option>
              </select>
            </div>}
            <div className="space-y-2">
              <Label htmlFor="category-color">{t("Color")}</Label>
              <Input id="category-color" type="color" value={color} onChange={(event) => setColor(event.target.value)} />
            </div>
            {save.error && <div role="alert"><p className="text-sm text-destructive">{freeLimitMessage(save.error, t)}</p>{save.error.message.startsWith("FREE_LIMIT_") && <Link href="/dashboard/billing" className="text-sm underline">{t("View plans")}</Link>}</div>}
            <Button type="submit" className="w-full" disabled={save.isPending}>
              {save.isPending ? t("Saving...") : t("Save")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
