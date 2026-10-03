# Support requests

All authenticated users, Free and Pro, can submit bugs, complaints and questions at `/dashboard/support`, accessible from Settings and the sidebar. Requests are private to their owner under RLS. The database limits submissions to 10 per rolling 24 hours; clients cannot change ownership, timestamps, statuses or replies. Account deletion cascades to requests.

## Handling a request

Open Supabase Table Editor → `support_requests`. New requests have status `open`. Set `in_progress` while investigating. Write a user-facing reply in `response` (maximum 4000 characters), and set `resolved` when appropriate. The customer sees the status and reply in their Support page, which refreshes every minute and has a manual Refresh button. Use the user_id to find the contact in Authentication if necessary; no public email directory is exposed.

No email notification, email delivery or response-time guarantee is configured. No screenshot attachments are stored. No external messages are sent automatically. Only trusted dashboard operators / backend service credentials can reply; no browser admin role or service key is added.
