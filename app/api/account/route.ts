import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ code: "unauthorized" }, { status: 403 })
  let body
  try { body = await request.json() } catch { return NextResponse.json({ code: "invalid_request" }, { status: 400 }) }
  if (body?.confirmation !== "DELETE" || typeof body?.password !== "string" || !body.password || body.password.length > 1024) return NextResponse.json({ code: "invalid_request" }, { status: 400 })
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ code: "unauthorized" }, { status: 401 })
  const { data, error: invokeError } = await supabase.functions.invoke("delete-account", { body: { confirmation: "DELETE", password: body.password } })
  if (invokeError) {
    let code = "delete_failed"
    if ("context" in invokeError && invokeError.context instanceof Response) {
      const response = await invokeError.context.json().catch(() => null)
      if (response?.code === "invalid_password") code = "invalid_password"
    }
    return NextResponse.json({ code }, { status: 400 })
  }
  if (!data?.ok) return NextResponse.json({ code: "delete_failed" }, { status: 500 })
  await supabase.auth.signOut({ scope: "local" })
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
}
