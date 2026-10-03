"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { BrandLogo } from "@/components/shared/brand-logo"
import { LanguageSelect, useT } from "@/components/locale-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export function PasswordRecoveryForm({ mode, validSession = false }: { mode: "request" | "reset"; validSession?: boolean }) {
  const t = useT()
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")
  const [show, setShow] = useState(false)
  const request = mode === "request"
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setError("")
    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") || "").trim()
    const password = String(form.get("password") || "")
    if (request && !z.string().email().safeParse(email).success) { setError(t("Enter a valid email address.")); return }
    if (!request && password.length < 8) { setError(t("Use at least 8 characters.")); return }
    if (!request && password !== form.get("confirm")) { setError(t("Passwords do not match.")); return }
    setBusy(true)
    try {
      const supabase = createClient()
      if (request) {
        // Return through the existing, allowlisted site root. The callback reads the PKCE recovery type.
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/` })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.getUser()
        if (error || !data.user) { setError(t("This link is invalid or expired. Request a new one.")); return }
        const result = await supabase.auth.updateUser({ password })
        if (result.error) throw result.error
        await supabase.auth.signOut({ scope: "local" })
      }
      setDone(true)
    } catch {
      setError(t(request ? "Couldn't send the link. Please wait and try again." : "Couldn't change your password. Try a new password or request another link."))
    } finally { setBusy(false) }
  }
  const invalid = !request && !validSession
  return <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
    <div className="absolute end-5 top-5"><LanguageSelect /></div>
    <div className="w-full max-w-md">
      <Link href="/" className="mb-7 block text-center"><BrandLogo /></Link>
      <Card className="rounded-xl shadow-none"><CardHeader>
        <CardTitle className="font-heading text-2xl">{t(request ? "Forgot password?" : "Reset your password")}</CardTitle>
        <CardDescription>{t(request ? "We'll email you a link to reset your password." : "Choose a new password for your account.")}</CardDescription>
      </CardHeader><CardContent className="space-y-5">
        {done ? <p role="status" className="rounded-lg border bg-muted p-4 text-sm">{t(request ? "If an account exists with this email, you'll receive a reset link. Check your spam folder and open the link in this browser." : "Password updated. Sign in with your new password.")}</p> : invalid ? <div className="space-y-4"><p role="alert" className="text-sm text-destructive">{t("This link is invalid or expired. Request a new one.")}</p><Button asChild className="w-full"><Link href="/forgot-password">{t("Request a new link")}</Link></Button></div> : <form onSubmit={submit} className="space-y-4">
          {request ? <div className="space-y-2"><Label htmlFor="email">{t("Email")}</Label><Input id="email" name="email" type="email" autoComplete="email" required disabled={busy} /></div> : <>
            <div className="space-y-2"><Label htmlFor="password">{t("New password")}</Label><Input id="password" name="password" type={show ? "text" : "password"} autoComplete="new-password" minLength={8} required disabled={busy} /><p className="text-xs text-muted-foreground">{t("Use at least 8 characters.")}</p></div>
            <div className="space-y-2"><Label htmlFor="confirm">{t("Confirm password")}</Label><Input id="confirm" name="confirm" type={show ? "text" : "password"} autoComplete="new-password" minLength={8} required disabled={busy} /></div>
            <Button type="button" variant="ghost" size="sm" aria-pressed={show} onClick={() => setShow(!show)}>{t(show ? "Hide password" : "Show password")}</Button>
          </>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>{t(busy ? "Please wait..." : request ? "Send reset link" : "Change password")}</Button>
        </form>}
        <Link href="/login" className="block text-center text-sm underline underline-offset-4">{t("Back to sign in")}</Link>
      </CardContent></Card>
    </div>
  </div>
}
