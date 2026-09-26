"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { KeyRound, Mail, Palette, Tags, UserRound, Wallet } from "lucide-react"
import { notify } from "@/components/shared/toast"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTheme } from "next-themes"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageSkeleton } from "@/components/shared/page-skeleton"

export default function SettingsPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { setTheme } = useTheme()
  const [name, setName] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Session expirée.")
      const { data, error } = await supabase.from("profiles")
        .select("id, full_name, currency, theme_preference").eq("id", user.id).single()
      if (error) throw error
      return { ...data, email: user.email || "" }
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
      const value = (name ?? profile.full_name ?? "").trim()
      if (!value) throw new Error("Saisis ton nom.")
      const { error } = await supabase.from("profiles").update({ full_name: value }).eq("id", profile.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-settings"] })
      setName(null)
      notify("Profil enregistré.")
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
      notify("Apparence mise à jour.")
    },
  })
  const changePassword = useMutation({
    mutationFn: async () => {
      if (password.length < 8) throw new Error("Utilise au moins 8 caractères.")
      if (password !== confirmPassword) throw new Error("Les mots de passe ne correspondent pas.")
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
    },
    onSuccess: () => { setPassword(""); setConfirmPassword(""); notify("Mot de passe modifié.") },
  })

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[.14em] text-muted-foreground">Compte</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">Paramètres</h1>
        <p className="mt-2 text-sm text-muted-foreground">Gère ton profil, la sécurité et l’apparence de ton espace.</p>
      </div>
      {isLoading && <PageSkeleton rows={2} />}
      {error && <p role="alert" className="text-sm text-destructive">Impossible de charger ton profil.</p>}
      {profile && <div className="space-y-4">
        <Card className="rounded-xl shadow-none"><CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg border bg-muted"><UserRound className="size-4" /></div><div><h2 className="font-heading text-base font-semibold">Profil</h2><p className="text-xs text-muted-foreground">Tes informations personnelles</p></div></div>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); saveName.mutate() }}>
            <div className="max-w-lg space-y-2"><Label htmlFor="full-name">Nom complet</Label><Input id="full-name" required maxLength={100} value={name ?? profile.full_name ?? ""} onChange={(event) => setName(event.target.value)} /></div>
            <Button type="submit" disabled={saveName.isPending}>{saveName.isPending ? "Enregistrement..." : "Enregistrer le profil"}</Button>
          </form>
          {saveName.error && <p role="alert" className="text-sm text-destructive">{saveName.error.message}</p>}
          <div className="grid gap-5 border-t pt-5 sm:grid-cols-2">
            <div className="flex items-start gap-3"><Mail className="mt-0.5 size-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Adresse email</p><p className="mt-1 break-all text-sm font-medium">{profile.email}</p></div></div>
            <div className="flex items-start gap-3"><Wallet className="mt-0.5 size-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Devise du compte</p><p className="mt-1 text-sm font-medium">{profile.currency}</p><p className="mt-1 text-xs text-muted-foreground">Fixée à l’inscription, sans conversion automatique.</p></div></div>
          </div>
        </CardContent></Card>
        <Card className="rounded-xl shadow-none"><CardContent className="space-y-5 p-6 sm:p-8">
          <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg border bg-muted"><Palette className="size-4" /></div><div><h2 className="font-heading text-base font-semibold">Apparence</h2><p className="text-xs text-muted-foreground">Choisis le thème qui te convient.</p></div></div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Choisir le thème">
            {(["light", "dark", "system"] as const).map((option) => <Button key={option} type="button" variant={profile.theme_preference === option ? "default" : "outline"} aria-pressed={profile.theme_preference === option} disabled={changeTheme.isPending} onClick={() => changeTheme.mutate(option)}>{option === "light" ? "Clair" : option === "dark" ? "Sombre" : "Système"}</Button>)}
          </div>
          {changeTheme.error && <p role="alert" className="text-sm text-destructive">Impossible de changer le thème.</p>}
        </CardContent></Card>
        <Card className="rounded-xl shadow-none"><CardContent className="space-y-5 p-6 sm:p-8">
          <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg border bg-muted"><KeyRound className="size-4" /></div><div><h2 className="font-heading text-base font-semibold">Sécurité</h2><p className="text-xs text-muted-foreground">Modifie le mot de passe de ton compte.</p></div></div>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); changePassword.mutate() }}>
            <div className="grid max-w-xl gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="new-password">Nouveau mot de passe</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="confirm-password">Confirmer le mot de passe</Label><Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div></div>
            <Button variant="outline" type="submit" disabled={changePassword.isPending}>{changePassword.isPending ? "Modification..." : "Modifier le mot de passe"}</Button>
          </form>
          {changePassword.error && <p role="alert" className="text-sm text-destructive">{changePassword.error.message}</p>}
        </CardContent></Card>
        <Card className="rounded-xl shadow-none"><CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg border bg-muted"><Tags className="size-4" /></div><div><h2 className="font-heading text-base font-semibold">Catégories</h2><p className="text-xs text-muted-foreground">Organise tes catégories de revenus et dépenses.</p></div></div>
          <Button asChild variant="outline"><Link href="/dashboard/categories">Gérer les catégories</Link></Button>
        </CardContent></Card>
      </div>}
    </div>
  )
}
