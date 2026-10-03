# Rasid plans

Pro is priced at **49 MAD per month** independently of the user's tracking currency. Payments are intentionally unavailable until a payment provider is configured. `/dashboard/checkout` collects no payment details and cannot activate Pro.

Free includes 50 stored transactions created in the current UTC month, 3 active budgets, 3 savings goals and 5 custom categories. Default categories do not count. Dashboard, alerts, profile settings and JSON account backup remain available. Existing records are preserved; accounts already above a limit can read, edit or delete their records, but cannot add more in that category until below the limit. Archiving a budget frees an active-budget slot.

Pro removes those limits and enables authenticated CSV transaction export at `/api/billing/export`. CSV cells are escaped against spreadsheet formula injection.

`account_subscriptions` has RLS and read-only access for authenticated owners. New users and existing accounts default to Free. User metadata does not grant access. Only trusted backend credentials may update subscription records. Active Pro requires a provider, unique payment reference and a future `current_period_end`. Expired, cancelled or malformed subscriptions do not unlock Pro.

Before enabling payment, implement a provider checkout endpoint and a signature-verified, idempotent webhook. Verify the actual paid amount (49 MAD), currency, account association and payment status against the provider API before writing the subscription. Record the paid service period from the verified subscription and process cancellations/expiry. Never grant access from a success URL, browser state, user metadata or unverified webhook body. Keep provider and service credentials server-side.

Validation: `node --test tests/billing.test.mjs`, `node --test tests/delete-account.test.mjs`, TypeScript, lint and Next.js build. `tests/free-plan-limits.sql` exercises signup defaults, each quota, budget reactivation, expired Pro, permissions and subscription RLS; all fixtures are rolled back.
