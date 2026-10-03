"use client"

import { useRefreshDashboard } from "@/hooks/use-refresh-dashboard"

import { LanguageSelect, useT } from "@/components/locale-provider"

import Link from "next/link"
import { useRef, useState } from "react"
import { KeyRound, Mail, Palette, Tags, UserRound, Wallet, Languages, Camera, Download, ShieldCheck, Monitor, Sun, Moon, Eye, EyeOff, Check, TriangleAlert, Trash2 } from "lucide-react"
import { notify } from "@/components/shared/toast"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTheme } from "next-themes"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ConfirmAction } from "@/components/shared/confirm-action"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PageSkeleton } from "@/components/shared/page-skeleton"

export default function SettingsPage() {
  const refreshDashboard = useRefreshDashboard()
  const t = useT()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()
  const photoInput = useRef<HTMLInputElement>(null)
  const [photoError, setPhotoError] = useState("")
  const [photoBusy, setPhotoBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [confirmSessions, setConfirmSessions] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [deletePassword, setDeletePassword] = useState("")
  const [name, setName] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error(t('Please sign in again.'))
      const { data, error } = await supabase.from("profiles")
        .select("id, full_name, currency, theme_preference, avatar_image, created_at").eq("id", user.id).single()
      if (error) throw error
      return { ...data, email: user.email || "", verified: !!user.email_confirmed_at }
    },
  })
  const saveName = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error(t('Profile not found.'))
      const value = (name ?? profile.full_name ?? "").trim()
      if (!value) throw new Error(t('Name is required.'))
      const { error } = await supabase.from("profiles").update({ full_name: value }).eq("id", profile.id)
      if (error) throw error
    },
    onSuccess: () => {
      void refreshDashboard()
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

  const savePhoto = useMutation({
    mutationFn: async (image: string | null) => {
      if (!profile) throw new Error(t("Profile not found."))
      const { error } = await supabase.from("profiles").update({ avatar_image: image }).eq("id", profile.id)
      if (error) throw error
    },
    onSuccess: () => {
      void refreshDashboard()
      void queryClient.invalidateQueries({ queryKey: ["profile-settings"] })
      notify(t("Photo updated."))
    },
  })
  async function uploadPhoto(file?: File) {
    if (!file) return
    setPhotoError("")
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setPhotoError(t("Choose a JPG, PNG or WebP image under 5 MB.")); return
    }
    setPhotoBusy(true)
    try {
      const bitmap = await createImageBitmap(file)
      const canvas = document.createElement("canvas")
      canvas.width = 128; canvas.height = 128
      const context = canvas.getContext("2d")
      if (!context) throw new Error("Canvas unavailable")
      const side = Math.min(bitmap.width, bitmap.height)
      context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 128, 128)
      bitmap.close()
      const image = canvas.toDataURL("image/webp", 0.75)
      if (!image.startsWith("data:image/webp;base64,") || image.length > 24000) {
        setPhotoError(t("Couldn't process this image. Try another photo.")); return
      }
      await savePhoto.mutateAsync(image)
    } catch {
      setPhotoError(t("Couldn't update your photo."))
    } finally {
      setPhotoBusy(false)
      if (photoInput.current) photoInput.current.value = ""
    }
  }
  const exportData = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error(t("Profile not found."))
      const result: Record<string, unknown> = { exported_at: new Date().toISOString(), currency: profile.currency }
      for (const table of ["transactions", "budgets", "savings_goals", "categories", "alerts"] as const) {
        const rows: unknown[] = []
        for (let offset = 0; ; offset += 1000) {
          const { data, error } = await supabase.from(table).select("*").eq("user_id", profile.id).order("id").range(offset, offset + 999)
          if (error) throw error
          rows.push(...(data ?? []))
          if (!data || data.length < 1000) break
        }
        result[table] = rows
      }
      const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }))
      const link = document.createElement("a")
      link.href = url; link.download = `rasid-backup-${new Date().toISOString().slice(0, 10)}.json`
      link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
    },
    onSuccess: () => notify(t("Your export is ready.")),
  })
  const closeOtherSessions = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut({ scope: "others" })
      if (error) throw error
    },
    onSuccess: () => { setConfirmSessions(false); notify(t("Other sessions signed out.")) },
  })

  const deleteAccount = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation: deleteConfirmation, password: deletePassword }) })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(t(result.code === "invalid_password" ? "Your current password is incorrect." : "Couldn't delete your account. Please sign in and try again."))
    },
    onSuccess: () => {
      queryClient.clear()
      window.location.replace("/login")
    },
  })

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[.14em] text-muted-foreground">{t("Account")}</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">{t("Settings")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("Manage your profile, security and appearance.")}</p>
      </div>
      {isLoading && <PageSkeleton rows={2} />}
      {error && <p role="alert" className="text-sm text-destructive">{t("Couldn't load your profile.")}</p>}
      {profile && <div className="space-y-6">
        <nav aria-label={t("Settings")} className="flex flex-wrap gap-2 border-b pb-5">
          {[["profile", "Profile"], ["appearance", "Appearance"], ["language", "Language"], ["security", "Security"], ["data", "Your data"], ["danger", "Danger zone"]].map(([id, label]) => <a key={id} href={`#${id}`} className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted">{t(label)}</a>)}
        </nav>
        <Card id="profile" className="scroll-mt-24 rounded-xl shadow-none"><CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg border bg-muted"><UserRound className="size-4" /></div><div><h2 className="font-heading text-base font-semibold">{t("Profile")}</h2><p className="text-xs text-muted-foreground">{t("Your personal information")}</p></div></div>
          <div className="flex flex-col gap-5 rounded-xl border bg-muted/30 p-5 sm:flex-row sm:items-center">
            <Avatar className="size-20 border"><AvatarImage src={profile.avatar_image ?? undefined} alt={t("Profile photo")} /><AvatarFallback className="bg-blue-600/10 text-2xl font-semibold text-blue-600 dark:text-blue-400">{(profile.full_name || profile.email).split(" ").slice(0, 2).map((part: string) => part[0]).join("").toUpperCase()}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1"><h3 className="font-medium">{t("Profile photo")}</h3><p className="mt-1 text-xs text-muted-foreground">{t("JPG, PNG or WebP. Maximum 5 MB. Centered square crop.")}</p><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={photoBusy || savePhoto.isPending} onClick={() => photoInput.current?.click()}><Camera className="size-4" />{photoBusy ? t("Saving...") : t("Upload photo")}</Button>{profile.avatar_image && <Button size="sm" variant="ghost" disabled={photoBusy || savePhoto.isPending} onClick={() => savePhoto.mutate(null)}>{t("Remove photo")}</Button>}</div></div>
            <input ref={photoInput} type="file" className="hidden" aria-label={t("Upload photo")} accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadPhoto(event.target.files?.[0])} />
          </div>
          {(photoError || savePhoto.error) && <p role="alert" className="text-sm text-destructive">{photoError || t("Couldn't update your photo.")}</p>}
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); saveName.mutate() }}>
            <div className="max-w-lg space-y-2"><Label htmlFor="full-name">{t("Full name")}</Label><Input id="full-name" required maxLength={100} value={name ?? profile.full_name ?? ""} onChange={(event) => setName(event.target.value)} /></div>
            <Button type="submit" disabled={saveName.isPending}>{saveName.isPending ? t("Saving...") : t("Save profile")}</Button>
          </form>
          {saveName.error && <p role="alert" className="text-sm text-destructive">{saveName.error.message}</p>}
          <div className="grid gap-5 border-t pt-5 sm:grid-cols-2">
            <div className="flex items-start gap-3"><Mail className="mt-0.5 size-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{t("Email address")}</p><p className="mt-1 break-all text-sm font-medium">{profile.email}</p>{profile.verified && <span className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"><Check className="size-3" />{t("Verified email")}</span>}</div></div>
            <div className="flex items-start gap-3"><Wallet className="mt-0.5 size-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{t("Account currency")}</p><p className="mt-1 text-sm font-medium">{profile.currency}</p><p className="mt-1 text-xs text-muted-foreground">{t("Fixed at sign-up, with no automatic conversion.")}</p></div></div>
          </div>
        </CardContent></Card>
        <Card id="appearance" className="scroll-mt-24 rounded-xl shadow-none"><CardContent className="space-y-5 p-6 sm:p-8">
          <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg border bg-muted"><Palette className="size-4" /></div><div><h2 className="font-heading text-base font-semibold">{t("Appearance")}</h2><p className="text-xs text-muted-foreground">{t("Choose the theme that works for you.")}</p></div></div>
          <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label={t("Appearance")}>
            {(["light", "dark", "system"] as const).map((option) => <Button key={option} type="button" variant={theme === option ? "default" : "outline"} aria-pressed={theme === option} disabled={changeTheme.isPending} onClick={() => changeTheme.mutate(option)} className="h-24 flex-col gap-3 rounded-xl">{option === "light" ? <Sun className="size-5" /> : option === "dark" ? <Moon className="size-5" /> : <Monitor className="size-5" />}{option === "light" ? t("Light") : option === "dark" ? t("Dark") : t("System")}</Button>)}
          </div>
          {changeTheme.error && <p role="alert" className="text-sm text-destructive">{t("Couldn't change the theme.")}</p>}
        </CardContent></Card>
        <Card id="language" className="scroll-mt-24 rounded-xl shadow-none"><CardContent className="flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8">
          <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg border bg-muted"><Languages className="size-4" /></div><div><h2 className="font-heading text-base font-semibold">{t("Language")}</h2><p className="text-xs text-muted-foreground">{t("Choose your preferred language.")}</p></div></div>
          <LanguageSelect />
        </CardContent></Card>
        <Card id="security" className="scroll-mt-24 rounded-xl shadow-none"><CardContent className="space-y-5 p-6 sm:p-8">
          <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg border bg-muted"><KeyRound className="size-4" /></div><div><h2 className="font-heading text-base font-semibold">{t("Security")}</h2><p className="text-xs text-muted-foreground">{t("Change your account password.")}</p></div></div>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); changePassword.mutate() }}>
            <div className="grid max-w-xl gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="new-password">{t("New password")}</Label><Input id="new-password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="confirm-password">{t("Confirm password")}</Label><Input id="confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div></div>
            <Button variant="ghost" type="button" size="sm" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}{showPassword ? t("Hide password") : t("Show password")}</Button>
            <Button variant="outline" type="submit" disabled={changePassword.isPending}>{changePassword.isPending ? t("Changing...") : t("Change password")}</Button>
          </form>
          <div className="flex flex-col justify-between gap-4 border-t pt-5 sm:flex-row sm:items-center"><div><h3 className="text-sm font-medium">{t("Other devices")}</h3><p className="mt-1 max-w-md text-xs text-muted-foreground">{t("End other sessions while keeping this device signed in. Existing access may continue briefly.")}</p></div><Button variant="outline" onClick={() => setConfirmSessions(true)}>{t("Sign out other devices")}</Button></div>
          {closeOtherSessions.error && <p role="alert" className="text-sm text-destructive">{t("Couldn't sign out other devices.")}</p>}
          {changePassword.error && <p role="alert" className="text-sm text-destructive">{changePassword.error.message}</p>}
        </CardContent></Card>
        <Card className="rounded-xl shadow-none"><CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg border bg-muted"><Tags className="size-4" /></div><div><h2 className="font-heading text-base font-semibold">{t("Categories")}</h2><p className="text-xs text-muted-foreground">{t("Manage your income and expense categories.")}</p></div></div>
          <Button asChild variant="outline"><Link href="/dashboard/categories">{t("Manage categories")}</Link></Button>
        </CardContent></Card>
        <Card id="data" className="scroll-mt-24 rounded-xl shadow-none"><CardContent className="space-y-5 p-6 sm:p-8"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg border bg-muted"><Download className="size-4" /></div><div><h2 className="font-heading text-base font-semibold">{t("Your data")}</h2><p className="text-xs text-muted-foreground">{t("Download a copy of your financial records.")}</p></div></div><div className="flex flex-col gap-4 rounded-xl border bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">{t("Export account data")}</p><p className="mt-1 text-xs text-muted-foreground">{t("Transactions, budgets, goals, categories and alerts in JSON format.")}</p></div><Button variant="outline" disabled={exportData.isPending} onClick={() => exportData.mutate()}><Download className="size-4" />{exportData.isPending ? t("Exporting...") : t("Download export")}</Button></div>{exportData.error && <p role="alert" className="text-sm text-destructive">{t("Couldn't export your data. Please try again.")}</p>}<p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4" />{t("Your records are private to your account.")}</p></CardContent></Card>
        <Card id="danger" className="scroll-mt-24 rounded-xl border-destructive/40 shadow-none"><CardContent className="space-y-5 p-6 sm:p-8">
          <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive"><TriangleAlert className="size-4" /></div><div><h2 className="font-heading text-base font-semibold text-destructive">{t("Danger zone")}</h2><p className="text-xs text-muted-foreground">{t("Permanent actions for your account.")}</p></div></div>
          <div className="flex flex-col justify-between gap-4 border-t border-destructive/20 pt-5 sm:flex-row sm:items-center"><div><h3 className="text-sm font-medium">{t("Delete account")}</h3><p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">{t("Permanently delete your account, profile photo and all financial records. This cannot be undone. Export your data first if you want a copy.")}</p></div><Button variant="destructive" onClick={() => { deleteAccount.reset(); setDeleteConfirmation(""); setDeletePassword(""); setDeleteOpen(true) }}><Trash2 className="size-4" />{t("Delete account")}</Button></div>
        </CardContent></Card>
        <Dialog open={deleteOpen} onOpenChange={(open) => { if (!deleteAccount.isPending) { setDeleteOpen(open); if (!open) { setDeletePassword(""); setDeleteConfirmation("") } } }}>
          <DialogContent className="max-w-md rounded-xl"><DialogHeader><DialogTitle className="text-destructive">{t("Delete your account permanently?")}</DialogTitle><DialogDescription>{t("All your transactions, budgets, goals, categories and alerts will be deleted. You will be signed out on all devices.")}</DialogDescription></DialogHeader>
            <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (deleteConfirmation === "DELETE" && deletePassword) deleteAccount.mutate() }}>
              <div className="space-y-2"><Label htmlFor="delete-password">{t("Current password")}</Label><Input id="delete-password" type="password" autoComplete="current-password" required maxLength={1024} disabled={deleteAccount.isPending} value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="delete-confirmation">{t("Type DELETE to confirm")}</Label><Input id="delete-confirmation" dir="ltr" autoComplete="off" spellCheck={false} disabled={deleteAccount.isPending} value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} /></div>
              {deleteAccount.error && <p role="alert" className="text-sm text-destructive">{deleteAccount.error.message}</p>}
              <DialogFooter className="gap-2"><Button type="button" variant="outline" disabled={deleteAccount.isPending} onClick={() => { setDeleteOpen(false); setDeletePassword(""); setDeleteConfirmation("") }}>{t("Cancel")}</Button><Button type="submit" variant="destructive" disabled={deleteAccount.isPending || deleteConfirmation !== "DELETE" || !deletePassword}>{t(deleteAccount.isPending ? "Deleting account..." : "Delete account")}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <ConfirmAction open={confirmSessions} onOpenChange={setConfirmSessions} title={t("Sign out other devices?")} description={t("You will stay signed in on this device.")} action={t("Sign out other devices")} pending={closeOtherSessions.isPending} onConfirm={() => closeOtherSessions.mutate()} />
      </div>}
    </div>
  )
}
