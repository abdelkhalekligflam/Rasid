# Rasid

Application personnelle de suivi de finances avec Next.js 16, TypeScript, Supabase et Tailwind CSS.

## Fonctions

- Authentification et devise fixe choisie à l'inscription (MAD, EUR, USD, GBP)
- Dashboard : solde, revenus et dépenses du mois, épargne, graphiques et transactions récentes
- Transactions : ajout, modification, suppression et filtres
- Budgets récurrents par catégorie, avec suivi de la période active
- Objectifs d'épargne et contributions atomiques
- Alertes de seuil, dépassement et objectif atteint
- Catégories par défaut et personnalisées
- Profil et thème clair, sombre ou système

## Démarrage

Prérequis : Node.js 20.9+ et un projet Supabase configuré.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Renseigner dans `.env.local` l'URL et la clé **publishable** du projet Supabase. Ne jamais utiliser une clé `service_role` ou une clé secrète avec `NEXT_PUBLIC_`.

Ouvrir [http://localhost:3000](http://localhost:3000). Pour vérifier le code :

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Base de données

Le projet Supabase existant de Rasid possède déjà les tables et les migrations listées dans `supabase/migrations/`. Les versions des fichiers correspondent à l'historique des migrations du projet. Ne pas les rejouer manuellement sur ce projet.

Pour un **nouveau** projet Supabase, exécuter `supabase/bootstrap.sql` une fois dans le SQL Editor, puis appliquer les migrations numérotées dans l'ordre. Activer la confirmation d'email et configurer l'URL du site dans Supabase Auth selon l'environnement utilisé.

Toutes les tables exposées ont RLS activé. Les politiques limitent les lignes à l'utilisateur connecté. Les fonctions de trigger ne sont pas directement exécutables par les rôles web. La devise du profil est immuable après l'inscription.

## Structure

- `app/` : pages et layouts App Router
- `components/` : interface, graphiques et formulaires
- `lib/supabase/` : clients navigateur, serveur et rafraîchissement de session
- `lib/validations/` : schémas Zod
- `supabase/` : bootstrap et migrations SQL

Les montants affichés utilisent la devise du profil sans conversion de taux.
