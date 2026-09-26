"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTheme } from "next-themes"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { setTheme } = useTheme()
  const [name, setName] = useState("")
  const [feedback, setFeedback] = useState("")

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Session expirée.")
      const { data, error } = await supabase.from("profiles")
        .select("id, full_name, currency, theme_preference").eq("id", user.id).single()
      if (error) throw error
      return data
    },
  })
  useEffect(() => {
    if (profile?.theme_preference && ["light", "dark", "system"].includes(profile.theme_preference)) {
      setTheme(profile.theme_preference)
    }
  }, [profile?.theme_preference, setTheme])
  const saveName = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("Profil introuvable.")
      const value = name.trim()
      if (!value) throw new Error("Saisis ton nom.")
      const { error } = await supabase.from("profiles").update({ full_name: value }).eq("id", profile.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-settings"] })
      setFeedback("Profil enregistré.")
    },
  })
  const changeTheme = useMutation({
    mutationFn: async (value: "light" | "dark" | "system") => {
      if (!profile) throw new Error("Profil introuvable.")
      const { error } = await supabase.from("profiles").update({ theme_preference: value }).eq("id", profile.id)
      if (error) throw error
      return value
    },
    onSuccess: (value) => {
      setTheme(value)
      queryClient.invalidateQueries({ queryKey: ["profile-settings"] })
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-semibold">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Personnalise ton compte Rasid.</p>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Chargement...</p>}
      {error && <p role="alert" className="text-sm text-destructive">Impossible de charger ton profil.</p>}
      {profile && <>
        <Card className="rounded-2xl"><CardContent className="space-y-5 p-6">
          <div>
            <h2 className="font-heading text-lg font-semibold">Profil</h2>
            <p className="text-sm text-muted-foreground">Ton nom affiché dans le dashboard.</p>
          </div>
          <form className="flex max-w-lg flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(event) => { event.preventDefault(); setFeedback(""); saveName.mutate() }}>
            <div className="flex-1 space-y-2">
              <Label htmlFor="full-name">Nom complet</Label>
              <Input id="full-name" placeholder={profile.full_name || "Ton nom"} value={name}
                onChange={(event) => setName(event.target.value)} />
            </div>
            <Button type="submit" disabled={saveName.isPending}>Enregistrer</Button>
          </form>
          {feedback && <p role="status" className="text-sm text-primary">{feedback}</p>}
          {saveName.error && <p role="alert" className="text-sm text-destructive">{saveName.error.message}</p>}
          <div className="border-t pt-4">
            <p className="text-sm font-medium">Devise du compte : {profile.currency}</p>
            <p className="text-xs text-muted-foreground">La devise choisie à l&apos;inscription est définitive.</p>
          </div>
        </CardContent></Card>
        <Card className="rounded-2xl"><CardContent className="space-y-4 p-6">
          <h2 className="font-heading text-lg font-semibold">Apparence</h2>
          <div className="flex flex-wrap gap-2" aria-label="Choisir le thème">
            {(["light", "dark", "system"] as const).map((option) => (
              <Button key={option} type="button" variant={profile.theme_preference === option ? "default" : "outline"}
                disabled={changeTheme.isPending} onClick={() => changeTheme.mutate(option)}>
                {option === "light" ? "Clair" : option === "dark" ? "Sombre" : "Système"}
              </Button>
            ))}
          </div>
          {changeTheme.error && <p role="alert" className="text-sm text-destructive">Impossible de changer le thème.</p>}
        </CardContent></Card>
        <Card className="rounded-2xl"><CardContent className="flex items-center justify-between gap-4 p-6">
          <div>
            <h2 className="font-heading text-lg font-semibold">Catégories</h2>
            <p className="text-sm text-muted-foreground">Ajoute et organise tes catégories personnalisées.</p>
          </div>
          <Button asChild variant="outline"><Link href="/dashboard/categories">Gérer</Link></Button>
        </CardContent></Card>
      </>}
    </div>
  )
}
