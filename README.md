# Rasid

A modern personal finance application built to make everyday money management clear and practical.

## Overview

Rasid helps users manage their finances from one place: balances, monthly income and expenses, budgets, savings goals, recurring activity, alerts, categories, and recent transactions.

## Features

- Authentication and profile setup with a fixed currency (MAD, EUR, USD, GBP)
- Dashboard with balance, monthly income and expenses, savings, charts, and recent transactions
- Create, edit, delete, and filter transactions
- Recurring category budgets with active-period tracking
- Savings goals with contributions
- Threshold, overspending, and goal-completion alerts
- Default and custom categories
- Light, dark, and system themes
- Row Level Security (RLS) for user-owned data

## Tech Stack

**Next.js · React · TypeScript · Supabase · Tailwind CSS · TanStack Query · React Hook Form · Zod · Zustand · Framer Motion · Recharts · shadcn/ui · Radix UI**

## Local Setup

Requirements: Node.js 20.9+ and a configured Supabase project.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Add your Supabase URL and **publishable** key to `.env.local`. Never expose a `service_role` or other secret key through a `NEXT_PUBLIC_` variable.

Open `http://localhost:3000`.

### Quality checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Database

The existing Rasid Supabase project already contains the tables and migrations listed in `supabase/migrations/`. Do not replay them manually on that project.

For a **new** Supabase project, run `supabase/bootstrap.sql` once in the SQL Editor, then apply the numbered migrations in order. Enable email confirmation and configure the site URL in Supabase Auth for the target environment.

All exposed tables use RLS, with policies restricting rows to the authenticated user. Profile currency is immutable after signup.

## Project Structure

- `app/` — App Router pages and layouts
- `components/` — UI, charts, and forms
- `lib/supabase/` — browser/server clients and session refresh
- `lib/validations/` — Zod schemas
- `supabase/` — bootstrap and SQL migrations

> Displayed amounts use the profile currency; Rasid does not perform exchange-rate conversion.

---

Built by [Abdelkhalek Ligflam](https://github.com/abdelkhalekligflam) · [Portfolio](https://portfolio-one-self-87.vercel.app/)
