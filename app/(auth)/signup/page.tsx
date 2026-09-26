"use client"

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
      setSuccess("Vérifie ta boîte mail pour confirmer ton compte, puis connecte-toi.")
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="absolute -top-32 left-0 size-96 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="relative w-full max-w-md">
      <Link href="/" className="mb-7 block text-center font-heading text-3xl font-bold text-primary">rasid<span className="text-foreground">.</span></Link>
      <Card className="w-full rounded-2xl border-border/70 shadow-xl shadow-primary/5">
        <CardHeader>
          <CardTitle className="text-2xl font-heading">
            Créer ton compte Rasid
          </CardTitle>
          <CardDescription>
            Commence à suivre tes finances dès aujourd&apos;hui
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                placeholder="Ton nom"
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="toi@exemple.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
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
                Ce choix est définitif — toutes tes données seront affichées dans cette devise.
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            {success && (
              <p role="status" className="text-sm text-primary text-center">{success}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Création..." : "Créer mon compte"}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Déjà un compte ?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Se connecter
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
