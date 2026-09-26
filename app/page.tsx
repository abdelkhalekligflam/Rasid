import Link from "next/link"
import { ArrowRight, ArrowUpRight, ChartNoAxesCombined, CircleCheck, Target, Wallet } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="font-heading text-xl font-semibold tracking-[-0.05em]">rasid<span className="text-emerald-500">.</span></Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/login" className="text-muted-foreground transition hover:text-foreground">Connexion</Link>
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-md border bg-foreground px-3.5 py-2 font-medium text-background transition hover:opacity-80">Commencer <ArrowRight className="size-3.5" /></Link>
          </nav>
        </div>
      </header>
      <main>
        <section className="relative mx-auto max-w-6xl px-5 pb-20 pt-24 sm:px-8 sm:pt-32">
          <div className="max-w-3xl">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"><span className="size-1.5 rounded-full bg-emerald-500" /> Votre espace financier, simplifié</p>
            <h1 className="font-heading text-5xl font-semibold leading-[1.08] tracking-[-0.065em] sm:text-7xl">Une vue claire sur votre argent.</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">Transactions, budgets et objectifs réunis dans un espace pensé pour prendre de meilleures décisions, chaque jour.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="inline-flex h-11 items-center gap-2 rounded-md bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-80">Créer un compte <ArrowUpRight className="size-4" /></Link>
              <Link href="/login" className="inline-flex h-11 items-center rounded-md border bg-card px-5 text-sm font-medium transition hover:bg-muted">Voir mon espace</Link>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">Gratuit pour commencer · Une devise fixe par compte</p>
          </div>
          <div className="mt-20 overflow-hidden rounded-xl border bg-card shadow-[0_20px_80px_-40px_rgba(0,0,0,.25)] dark:shadow-none">
            <div className="flex h-11 items-center gap-1.5 border-b px-5"><span className="size-2 rounded-full bg-border" /><span className="size-2 rounded-full bg-border" /><span className="size-2 rounded-full bg-border" /><span className="ml-4 text-xs text-muted-foreground">rasid / vue d’ensemble</span></div>
            <div className="grid md:grid-cols-[190px_1fr]">
              <aside className="hidden border-r p-5 md:block"><div className="mb-9 font-heading font-semibold tracking-tight">rasid<span className="text-emerald-500">.</span></div><div className="space-y-2 text-xs"><div className="rounded-md bg-muted px-3 py-2.5 font-medium">Vue d’ensemble</div><div className="px-3 py-2.5 text-muted-foreground">Transactions</div><div className="px-3 py-2.5 text-muted-foreground">Budgets</div><div className="px-3 py-2.5 text-muted-foreground">Objectifs</div></div></aside>
              <div className="p-6 sm:p-9"><div className="flex items-start justify-between"><div><p className="text-xs text-muted-foreground">Septembre 2026</p><h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight">Vue d’ensemble</h2></div><span className="rounded-md border px-2.5 py-1.5 text-xs text-muted-foreground">Ce mois</span></div>
                <div className="mt-8 grid gap-3 sm:grid-cols-3">{[["Solde total", "12 450 MAD", "+ 8,2 %"], ["Revenus", "8 200 MAD", "+ 12,4 %"], ["Dépenses", "3 950 MAD", "− 3,1 %"]].map(([label, value, change]) => <div key={label} className="rounded-lg border p-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-3 font-heading text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">{value}</p><p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{change} ce mois</p></div>)}</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1.5fr_1fr]"><div className="rounded-lg border p-5"><p className="text-sm font-medium">Activité mensuelle</p><p className="mt-1 text-xs text-muted-foreground">Vos revenus et dépenses en un coup d’œil</p><div className="mt-8 flex h-28 items-end justify-between gap-3 border-b border-border px-2">{[45,65,54,82,63,90,72,100,75,85,68,95].map((height, i) => <div key={i} className="flex h-full flex-1 items-end gap-1"><div className="w-full rounded-t-sm bg-foreground/85" style={{height:`${height}%`}} /><div className="w-full rounded-t-sm bg-emerald-500/70" style={{height:`${height*.58}%`}} /></div>)}</div><div className="mt-3 flex justify-between text-[10px] text-muted-foreground"><span>Jan</span><span>Mar</span><span>Mai</span><span>Jul</span><span>Sep</span><span>Nov</span></div></div><div className="rounded-lg border p-5"><p className="text-sm font-medium">Objectif d’épargne</p><p className="mt-1 text-xs text-muted-foreground">Projet personnel</p><p className="mt-9 text-2xl font-semibold tabular-nums">7 500 <span className="text-sm text-muted-foreground">/ 10 000 MAD</span></p><div className="mt-4 h-1.5 rounded-full bg-muted"><div className="h-full w-3/4 rounded-full bg-emerald-500" /></div><p className="mt-3 text-xs text-muted-foreground">75 % de l’objectif atteint</p></div></div>
              </div>
            </div>
          </div>
        </section>
        <section className="border-t bg-card"><div className="mx-auto max-w-6xl px-5 py-20 sm:px-8"><p className="text-xs font-semibold uppercase tracking-[.18em] text-muted-foreground">Tout au même endroit</p><h2 className="mt-4 max-w-lg font-heading text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Moins de friction. Plus de clarté.</h2><div className="mt-12 grid gap-8 md:grid-cols-3">{[{icon:Wallet,title:"Transactions",body:"Gardez une trace claire de chaque revenu et dépense."},{icon:ChartNoAxesCombined,title:"Budgets",body:"Fixez des limites récurrentes et voyez où vous en êtes."},{icon:Target,title:"Objectifs",body:"Avancez vers vos projets, étape par étape."}].map(({icon:Icon,title,body}) => <div key={title} className="border-t pt-6"><Icon className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /><h3 className="mt-6 font-heading text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p></div>)}</div></div></section>
        <section className="border-t"><div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-16 sm:flex-row sm:items-center sm:px-8"><div><h2 className="font-heading text-2xl font-semibold tracking-tight">Prêt à y voir plus clair ?</h2><p className="mt-2 text-sm text-muted-foreground">Votre espace financier vous attend.</p></div><Link href="/signup" className="inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-3 text-sm font-medium text-background">Commencer <ArrowRight className="size-4" /></Link></div></section>
      </main>
      <footer className="border-t"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-7 text-xs text-muted-foreground sm:px-8"><span>© 2026 Rasid</span><span className="inline-flex items-center gap-1.5"><CircleCheck className="size-3.5" /> Une devise par compte</span></div></footer>
    </div>
  )
}
