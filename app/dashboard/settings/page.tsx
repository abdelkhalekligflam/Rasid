"use client"

import { LanguageSelect, useT } from "@/components/locale-provider"

import Link from "next/link"
import { useEffect, useState } from "react"
import { KeyRound, Mail, Palette, Tags, UserRound, Wallet, Languages } from "lucide-react"
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
  const t = useT()
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
      if (!user) throw new Error(t('Please sign in again.'))
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
      if (!profile) throw new Error(t('Profile not found.'))
      const value = (name ?? profile.full_name ?? "").trim()
      if (!value) throw new Error(t('Name is required.'))
      const { error } = await supabase.from("profiles").update({ full_name: value }).eq("id", profile.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-settings"] })
      setName(null)
      notify(t("Profile saved."))
    },
  })
  const changeTheme = useMutation({
    mutationFn: async (value: "light" | "dark" | "system") => {
      if (!profile) throw new Error(t('Profile not found.'))
      const { error } = await supabase.from("profiles").update({ theme_preference: value }).eq("id", profile.id)
      if (error) throw error
      return value
    },
    onSuccess: (value) => {
      setTheme(value)
      queryClient.invalidateQueries({ queryKey: ["profile-settings"] })
      notify(t("Appearance updated."))
    },
  })
  const changePassword = useMutation({
    mutationFn: async () => {
      if (password.length < 8) throw new Error(t('Use at least 8 characters.'))
      if (password !== confirmPassword) throw new Error(t('Passwords do not match.'))
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
    },
    onSuccess: () => { setPassword(""); setConfirmPassword(""); notify(t("Password changed.")) },
  })

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[.14em] text-muted-foreground">{t("Account")}</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">{t("Settings")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("Manage your profile, security and appearance.")}</p>
      </div>
      {isLoading && <PageSkeleton rows={2} />}
      {error && <p role="alert" className="text-sm text-destructive">{t("Couldn't load your profile.")}</p>}
      {profile && <div className="space-y-4">
        <Card className="rounded-xl shadow-none"><CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg border bg-muted"><UserRound className="size-4" /></div><div><h2 className="font-heading text-base font-semibold">{t("Profile")}</h2><p className="text-xs text-muted-foreground">{t("Your personal information")}</p></div></div>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); saveName.mutate() }}>
            <div className="max-w-lg space-y-2"><Label htmlFor="full-name">{t("Full name")}</Label><Input id="full-name" required maxLength={100} value={name ?? profile.full_name ?? ""} onChange={(event) => setName(event.target.value)} /></div>
            <Button type="submit" disabled={saveName.isPending}>{saveName.isPending ? t("Saving...") : t("Save profile")}</Button>
          </form>
          {saveName.error && <p role="alert" className="text-sm text-destructive">{saveName.error.message}</p>}
          <div className="grid gap-5 border-t pt-5 sm:grid-cols-2">
            <div className="flex items-start gap-3"><Mail className="mt-0.5 size-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{t("Email address")}</p><p className="mt-1 break-all text-sm font-medium">{profile.email}</p></div></div>
            <div className="flex items-start gap-3"><Wallet className="mt-0.5 size-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{t("Account currency")}</p><p className="mt-1 text-sm font-medium">{profile.currency}</p><p className="mt-1 text-xs text-muted-foreground">{t("Fixed at sign-up, with no automatic conversion.")}</p></div></div>
          </div>
        </CardContent></Card>
        <Card className="rounded-xl shadow-none"><CardContent className="space-y-5 p-6 sm:p-8">
          <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg border bg-muted"><Palette className="size-4" /></div><div><h2 className="font-heading text-base font-semibold">{t("Appearance")}</h2><p className="text-xs text-muted-foreground">{t("Choose the theme that works for you.")}</p></div></div>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("Appearance")}>
            {(["light", "dark", "system"] as const).map((option) => <Button key={option} type="button" variant={profile.theme_preference === option ? "default" : "outline"} aria-pressed={profile.theme_preference === option} disabled={changeTheme.isPending} onClick={() => changeTheme.mutate(option)}>{option === "light" ? t("Light") : option === "dark" ? t("Dark") : t("System")}</Button>)}
          </div>
          {changeTheme.error && <p role="alert" className="text-sm text-destructive">{t("Couldn't change the theme.")}</p>}
        </CardContent></Card>
        <Card className="rounded-xl shadow-none"><CardContent className="flex items-center justify-between gap-4 p-6 sm:p-8">
          <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg border bg-muted"><Languages className="size-4" /></div><div><h2 className="font-heading text-base font-semibold">{t("Language")}</h2><p className="text-xs text-muted-foreground">{t("Choose your preferred language.")}</p></div></div>
          <LanguageSelect />
        </CardContent></Card>
        <Card className="rounded-xl shadow-none"><CardContent className="space-y-5 p-6 sm:p-8">
          <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg border bg-muted"><KeyRound className="size-4" /></div><div><h2 className="font-heading text-base font-semibold">{t("Security")}</h2><p className="text-xs text-muted-foreground">{t("Change your account password.")}</p></div></div>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); changePassword.mutate() }}>
            <div className="grid max-w-xl gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="new-password">{t("New password")}</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="confirm-password">{t("Confirm password")}</Label><Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div></div>
            <Button variant="outline" type="submit" disabled={changePassword.isPending}>{changePassword.isPending ? t("Changing...") : t("Change password")}</Button>
          </form>
          {changePassword.error && <p role="alert" className="text-sm text-destructive">{changePassword.error.message}</p>}
        </CardContent></Card>
        <Card className="rounded-xl shadow-none"><CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg border bg-muted"><Tags className="size-4" /></div><div><h2 className="font-heading text-base font-semibold">{t("Categories")}</h2><p className="text-xs text-muted-foreground">{t("Manage your income and expense categories.")}</p></div></div>
          <Button asChild variant="outline"><Link href="/dashboard/categories">{t("Manage categories")}</Link></Button>
        </CardContent></Card>
      </div>}
    </div>
  )
}
