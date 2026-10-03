"use client"

import { BrandLogo } from "@/components/shared/brand-logo"
import { LanguageSelect, useT, useLocale } from "@/components/locale-provider"

import { translateLegacy } from "@/lib/i18n"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { signupSchema, type SignupInput } from "@/lib/validations/auth"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
    control,
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
      <Link href="/" className="mb-7 block text-center font-heading text-2xl font-semibold tracking-[-0.05em] text-foreground"><BrandLogo /></Link>
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
              <Controller name="currency" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="currency" ref={field.ref} onBlur={field.onBlur} className="w-full" aria-invalid={!!errors.currency}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => <SelectItem key={currency} value={currency}>{currency}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
              <p className="text-xs text-muted-foreground">
                {t('You can change your currency later in Settings. Amounts are never automatically converted.')}
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
