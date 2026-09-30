"use client"

import { BrandLogo } from "@/components/shared/brand-logo"
import { LanguageSelect, useT, useLocale } from "@/components/locale-provider"

import { translateLegacy } from "@/lib/i18n"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"
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

export default function LoginPage() {
  const t = useT()
  const locale = useLocale()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setError(t("Invalid email or password"))
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="absolute end-5 top-5"><LanguageSelect /></div>
      <div className="relative w-full max-w-md">
      <Link href="/" className="mb-7 block text-center font-heading text-2xl font-semibold tracking-[-0.05em] text-foreground"><BrandLogo /></Link>
      <Card className="w-full rounded-xl border-border shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl font-heading">
            {t('Sign in to Rasid')}
          </CardTitle>
          <CardDescription>
            {t('Access your financial dashboard')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("Signing in...") : t("Sign in")}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              {t("Don't have an account?")}{" "}
              <Link href="/signup" className="text-foreground underline underline-offset-4 font-medium hover:underline">
                {t('Create an account')}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
