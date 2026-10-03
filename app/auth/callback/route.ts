import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  if (code) {
    const supabase = await createClient()
    let recovery = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") recovery = true
    })
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    subscription.unsubscribe()
    if (!error) {
      return NextResponse.redirect(new URL(recovery ? "/reset-password" : "/dashboard", url.origin))
    }
  }
  return NextResponse.redirect(new URL("/reset-password?error=invalid", url.origin))
}
