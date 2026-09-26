"use client"

import { LanguageSelect, useT, useLocale } from "@/components/locale-provider"

import { translateLegacy } from "@/lib/i18n"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { signupSchema, type SignupInput } from "@/lib/validations/auth"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const CURRENCIES = ["MAD", "EUR", "USD", "GBP"]

export default function SignupPage() {
  const t = useT()
  const locale = useLocale()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { currency: "MAD" },
  })

  async function onSubmit(data: SignupInput) {
    setLoading(true)
    setError(null)
    setSuccess(null)

    const supabase = createClient()

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          currency: data.currency,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (!signUpData.session) {
      setSuccess(t("Check your inbox to confirm your account, then sign in."))
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="absolute -top-32 left-0 size-96 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="absolute end-5 top-5"><LanguageSelect /></div>
      <div className="relative w-full max-w-md">
      <Link href="/" className="mb-7 block text-center font-heading text-2xl font-semibold tracking-[-0.05em] text-foreground">rasid<span className="text-foreground">.</span></Link>
      <Card className="w-full rounded-xl border-border shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl font-heading">
            {t('Create your Rasid account')}
          </CardTitle>
          <CardDescription>
            {t('Start tracking your finances today')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t("Full name")}</Label>
              <Input
                id="fullName"
                placeholder={t('Your name')}
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">
                  {translateLegacy(locale, errors.fullName.message || "")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("Email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('you@example.com')}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {translateLegacy(locale, errors.email.message || "")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("Password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {translateLegacy(locale, errors.password.message || "")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t("Currency")}</Label>
              <select
                id="currency"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                {...register("currency")}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {t('This choice is permanent. All your data will use this currency.')}
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            {success && (
              <p role="status" className="text-sm text-primary text-center">{success}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("Creating...") : t("Create account")}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              {t("Already have an account?")}{" "}
              <Link href="/login" className="text-foreground underline underline-offset-4 font-medium hover:underline">
                {t('Sign in')}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
