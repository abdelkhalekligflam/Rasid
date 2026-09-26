"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Category = {
  id: string
  name: string
  type: "income" | "expense"
  color: string | null
  is_default: boolean
}

export default function CategoriesPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState("")
  const [type, setType] = useState<"income" | "expense">("expense")
  const [color, setColor] = useState("#10B981")
  const [actionError, setActionError] = useState("")

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
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
      if (!name.trim()) throw new Error("Le nom est obligatoire.")
      if (editing) {
        const { error } = await supabase.from("categories")
          .update({ name: name.trim(), color }).eq("id", editing.id).eq("is_default", false)
        if (error) throw error
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Session expirée.")
        const { error } = await supabase.from("categories").insert({
          user_id: user.id, name: name.trim(), type, color, is_default: false,
        })
        if (error) throw error
      }
    },
    onSuccess: () => { refresh(); setOpen(false) },
  })
  const remove = useMutation({
    mutationFn: async (category: Category) => {
      const { error } = await supabase.from("categories").delete()
        .eq("id", category.id).eq("is_default", false)
      if (error) throw error
    },
    onSuccess: refresh,
    onError: () => setActionError("Impossible de supprimer cette catégorie. Elle est peut-être utilisée par des transactions ou budgets."),
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
          <h1 className="text-2xl font-heading font-semibold">Catégories</h1>
          <p className="text-sm text-muted-foreground">Organise tes revenus et dépenses.</p>
        </div>
        <Button onClick={startCreate}><Plus aria-hidden="true" /> Nouvelle catégorie</Button>
      </div>
      {actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}
      <Card><CardContent className="p-0">
        {isLoading && <p className="p-6 text-sm text-muted-foreground">Chargement...</p>}
        {error && <p role="alert" className="p-6 text-sm text-destructive">Impossible de charger les catégories.</p>}
        {categories?.map((category) => (
          <div key={category.id} className="flex items-center gap-3 border-b px-5 py-4 last:border-0">
            <span className="size-3 rounded-full" style={{ backgroundColor: category.color || "#94A3B8" }} />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{category.name}</p>
              <p className="text-xs text-muted-foreground">
                {category.type === "income" ? "Revenu" : "Dépense"} · {category.is_default ? "Par défaut" : "Personnalisée"}
              </p>
            </div>
            {!category.is_default && (
              <>
                <Button size="icon-sm" variant="ghost" aria-label={`Modifier ${category.name}`} onClick={() => startEdit(category)}>
                  <Pencil aria-hidden="true" />
                </Button>
                <Button size="icon-sm" variant="ghost" aria-label={`Supprimer ${category.name}`}
                  disabled={remove.isPending}
                  onClick={() => {
                    setActionError("")
                    if (window.confirm(`Supprimer la catégorie « ${category.name} » ?`)) remove.mutate(category)
                  }}>
                  <Trash2 aria-hidden="true" />
                </Button>
              </>
            )}
          </div>
        ))}
      </CardContent></Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); save.mutate() }}>
            <div className="space-y-2">
              <Label htmlFor="category-name">Nom</Label>
              <Input id="category-name" required maxLength={60} value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            {!editing && <div className="space-y-2">
              <Label htmlFor="category-type">Type</Label>
              <select id="category-type" className="w-full rounded-md border bg-background p-2 text-sm" value={type}
                onChange={(event) => setType(event.target.value as "income" | "expense")}>
                <option value="expense">Dépense</option><option value="income">Revenu</option>
              </select>
            </div>}
            <div className="space-y-2">
              <Label htmlFor="category-color">Couleur</Label>
              <Input id="category-color" type="color" value={color} onChange={(event) => setColor(event.target.value)} />
            </div>
            {save.error && <p role="alert" className="text-sm text-destructive">{save.error.message}</p>}
            <Button type="submit" className="w-full" disabled={save.isPending}>
              {save.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
