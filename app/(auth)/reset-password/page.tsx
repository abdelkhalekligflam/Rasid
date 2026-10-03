import { PasswordRecoveryForm } from "@/components/auth/password-recovery-form"
import { createClient } from "@/lib/supabase/server"
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return <PasswordRecoveryForm mode="reset" validSession={!!user && !error && !params.error} />
}
