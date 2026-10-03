import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deleteAccount } from '../supabase/functions/delete-account/handler.js'

function fixture({ missingUser = false, wrongPassword = false, revokeFails = false } = {}) {
  const calls = []
  const env = (key) => ({ SUPABASE_URL: 'https://test.invalid', SUPABASE_ANON_KEY: 'public', SUPABASE_SERVICE_ROLE_KEY: 'private' })[key]
  const createClient = (_url, key) => key === 'private' ? { auth: { admin: {
    signOut: async (_jwt, scope) => { calls.push(['revoke', scope]); return { error: revokeFails ? new Error('revoke failed') : null } },
    deleteUser: async (id, soft) => { calls.push(['delete', id, soft]); return { error: null } },
  } } } : { auth: {
    getUser: async () => ({ data: { user: missingUser ? null : { id: 'caller', email: 'caller@example.com' } }, error: null }),
    signInWithPassword: async ({ email }) => { calls.push(['reauth', email]); return { data: { user: { id: 'caller' }, session: { access_token: 'verified-token' } }, error: wrongPassword ? new Error('wrong password') : null } },
  } }
  return { deps: { env, createClient }, calls }
}
const request = (body = { confirmation: 'DELETE', password: 'current-password', user_id: 'victim' }, auth = 'Bearer token') => new Request('https://test.invalid', { method: 'POST', headers: { authorization: auth, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
test('rejects unauthenticated calls without touching data', async () => {
  const f = fixture(); assert.equal((await deleteAccount(request(undefined, ''), f.deps)).status, 401); assert.deepEqual(f.calls, [])
})
test('requires exact confirmation', async () => {
  const f = fixture(); assert.equal((await deleteAccount(request({ confirmation: 'delete', password: 'x' }), f.deps)).status, 400); assert.deepEqual(f.calls, [])
})
test('rejects invalid user sessions', async () => {
  const f = fixture({ missingUser: true }); assert.equal((await deleteAccount(request(), f.deps)).status, 401); assert.deepEqual(f.calls, [])
})
test('wrong password cannot delete or revoke sessions', async () => {
  const f = fixture({ wrongPassword: true }); assert.equal((await deleteAccount(request(), f.deps)).status, 403); assert.deepEqual(f.calls, [['reauth', 'caller@example.com']])
})
test('never deletes if session revocation fails', async () => {
  const f = fixture({ revokeFails: true }); assert.equal((await deleteAccount(request(), f.deps)).status, 500); assert.equal(f.calls.some(([op]) => op === 'delete'), false)
})
test('ignores injected user ID and deletes verified caller only, after revocation', async () => {
  const f = fixture(); assert.equal((await deleteAccount(request(), f.deps)).status, 200)
  assert.deepEqual(f.calls, [['reauth', 'caller@example.com'], ['revoke', 'global'], ['delete', 'caller', false]])
})
