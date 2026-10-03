export async function deleteAccount(request, { createClient, env }) {
  const reply = (status, code) => Response.json({ ok: status === 200, code }, { status, headers: { "Cache-Control": "no-store" } })
  if (request.method !== "POST") return reply(405, "method_not_allowed")
  const authorization = request.headers.get("authorization") || ""
  if (!authorization.startsWith("Bearer ")) return reply(401, "unauthorized")
  let body
  try { body = await request.json() } catch { return reply(400, "invalid_request") }
  if (body?.confirmation !== "DELETE" || typeof body?.password !== "string" || !body.password || body.password.length > 1024) return reply(400, "invalid_request")
  const url = env("SUPABASE_URL")
  const key = env("SUPABASE_ANON_KEY")
  const secret = env("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !key || !secret) return reply(503, "unavailable")
  const options = { auth: { persistSession: false, autoRefreshToken: false } }
  try {
    const caller = createClient(url, key, options)
    const { data: { user }, error } = await caller.auth.getUser(authorization.slice(7))
    if (error || !user?.email) return reply(401, "unauthorized")
    // Never accept a user ID or email supplied by the caller.
    const { data: verified, error: passwordError } = await caller.auth.signInWithPassword({ email: user.email, password: body.password })
    if (passwordError || verified.user?.id !== user.id || !verified.session) return reply(403, "invalid_password")
    const admin = createClient(url, secret, options)
    const { error: signOutError } = await admin.auth.admin.signOut(verified.session.access_token, "global")
    if (signOutError) return reply(500, "delete_failed")
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id, false)
    if (deleteError) return reply(500, "delete_failed")
    return reply(200, "deleted")
  } catch { return reply(500, "delete_failed") }
}
