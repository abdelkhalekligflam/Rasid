import Link from "next/link"
import { ArrowRight, ChartNoAxesCombined, ShieldCheck, Target, Wallet } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Link href="/" className="font-heading text-2xl font-bold tracking-tight text-primary">rasid<span className="text-foreground">.</span></Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/login" className="font-medium hover:text-primary">Connexion</Link>
          <Link href="/signup" className="rounded-xl bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition hover:opacity-90">
            Commencer
          </Link>
        </nav>
      </header>
      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:pt-24">
          <div>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold tracking-wide text-primary">
              TON ARGENT, EN CLAIR
            </span>
            <h1 className="mt-8 max-w-xl font-heading text-5xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
              Reprends le contrôle de tes finances.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Suis tes revenus et dépenses, garde tes budgets sous contrôle et avance vers tes objectifs d&apos;épargne.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground transition hover:opacity-90">
                Créer mon compte <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/login" className="rounded-xl border bg-card px-6 py-3.5 font-semibold transition hover:bg-muted">
                J&apos;ai déjà un compte
              </Link>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">Une seule devise pour ton compte. Aucune conversion automatique.</p>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
            <div className="relative rounded-3xl border bg-card p-6 shadow-2xl shadow-primary/10 sm:p-8">
              <div className="flex items-center justify-between border-b pb-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Aperçu</p>
                  <p className="mt-1 font-heading text-xl font-semibold">Vue d&apos;ensemble</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Ce mois</span>
              </div>
              <div className="grid gap-3 py-6 sm:grid-cols-2">
                <div className="rounded-2xl bg-muted/70 p-5">
                  <p className="text-sm text-muted-foreground">Budget disponible</p>
                  <p className="mt-3 font-heading text-3xl font-semibold tabular-nums">4 250 MAD</p>
                  <p className="mt-2 text-xs text-primary">↗ Dans les limites</p>
                </div>
                <div className="rounded-2xl bg-muted/70 p-5">
                  <p className="text-sm text-muted-foreground">Épargne</p>
                  <p className="mt-3 font-heading text-3xl font-semibold tabular-nums">2 800 MAD</p>
                  <p className="mt-2 text-xs text-muted-foreground">Objectif : 5 000 MAD</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-sm"><span>Alimentation</span><span className="tabular-nums">65 %</span></div>
                <div className="h-2 rounded-full bg-muted"><div className="h-full w-[65%] rounded-full bg-primary" /></div>
                <div className="flex justify-between text-sm"><span>Transport</span><span className="tabular-nums">38 %</span></div>
                <div className="h-2 rounded-full bg-muted"><div className="h-full w-[38%] rounded-full bg-primary/60" /></div>
              </div>
            </div>
          </div>
        </section>
        <section className="border-t bg-card/60">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 md:grid-cols-3">
            {[
              { icon: Wallet, title: "Chaque mouvement en vue", description: "Ajoute et retrouve tes revenus et dépenses en quelques secondes." },
              { icon: ChartNoAxesCombined, title: "Des budgets qui suivent", description: "Choisis un plafond hebdomadaire, mensuel ou annuel par catégorie." },
              { icon: Target, title: "Des objectifs concrets", description: "Suis ton épargne et célèbre chaque étape franchie." },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="space-y-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon aria-hidden="true" /></div>
                <h2 className="font-heading text-lg font-semibold">{title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl items-center gap-2 px-5 py-8 text-xs text-muted-foreground sm:px-8">
        <ShieldCheck className="size-4" aria-hidden="true" /> Rasid · Ton espace financier personnel
      </footer>
    </div>
  );
}
