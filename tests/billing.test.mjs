import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hasPro, csvCell, FREE_LIMITS, PRO_PRICE_MAD } from '../lib/billing/plans.ts'
const paid = { plan: 'pro', status: 'active', provider: 'paypal', payment_reference: 'verified-payment', current_period_end: '2030-01-01T00:00:00Z' }
const now = Date.parse('2026-10-03T00:00:00Z')
test('Free and missing subscriptions never unlock Pro',()=>{assert.equal(hasPro(null,now),false);assert.equal(hasPro({...paid,plan:'free'},now),false)})
test('Pro requires active paid subscription with a future expiry',()=>{assert.equal(hasPro(paid,now),true);for(const patch of [{status:'cancelled'},{status:'expired'},{provider:null},{payment_reference:null},{current_period_end:null},{current_period_end:'invalid'},{current_period_end:'2026-10-02T00:00:00Z'}])assert.equal(hasPro({...paid,...patch},now),false)})
test('price and Free limits match the published offer',()=>{assert.equal(PRO_PRICE_MAD,49);assert.deepEqual(FREE_LIMITS,{transactions:50,budgets:3,goals:3,categories:5})})
test('CSV quotes descriptions and prevents spreadsheet formula execution',()=>{assert.equal(csvCell('a,"b"'),'"a,""b"""');assert.equal(csvCell('=SUM(A1:A2)'), '"\'=SUM(A1:A2)"');assert.equal(csvCell('  @bad'),'"\'  @bad"');assert.equal(csvCell(null),'""')})
