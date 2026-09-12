import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-heading font-semibold">
        Bonjour, {profile?.full_name || "toi"} 👋
      </h1>
      <p className="text-muted-foreground mt-2">
        Devise : {profile?.currency}
      </p>
    </div>
  )
}