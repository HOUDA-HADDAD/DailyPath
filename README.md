# DailyPath — Suivi quotidien communautaire

Application de suivi quotidien pour un groupe : chaque membre remplit chaque
jour son suivi personnel (prières, wird, adhkar, lecture, sport, repos, silence…),
avec **compte individuel**, **données privées** (Row Level Security), **heatmap**,
**série de jours consécutifs**, et **analyses hebdomadaires / annuelles**.

- **Frontend** : Next.js 14 (App Router) + React + Tailwind CSS
- **Backend** : Supabase (Postgres + Auth + RLS)
- **Graphiques** : Recharts
- **Langues** : arabe (RTL) et anglais (LTR), bascule instantanée
- **Hébergement** : Vercel (plan gratuit), déployé depuis GitHub

> 100 % gratuit pour un groupe : le plan gratuit Supabase (jusqu'à ~50 000 MAU,
> 500 Mo de base) et le plan Hobby de Vercel suffisent largement.

---

## 1. Architecture (pensée pour évoluer)

```
src/
├── app/                     # Pages (App Router)
│   ├── login, signup        # Authentification email + mot de passe
│   ├── (app)/               # Zone protégée (garde d'auth dans le layout)
│   │   ├── today            # Formulaire du jour (créer / éditer)
│   │   ├── dashboard        # Heatmap + streak + derniers jours
│   │   ├── analytics/weekly # Analyse hebdomadaire
│   │   ├── analytics/yearly # Analyse mensuelle / annuelle
│   │   ├── profile          # Nom affiché + langue
│   │   └── admin            # Vue admin (désactivée par défaut)
│   └── auth/callback        # Retour de confirmation d'email
├── components/              # UI réutilisable (form, dashboard, analytics…)
└── lib/
    ├── activities/          # ★ config.ts = SOURCE UNIQUE des activités
    ├── analytics/           # Calculs streak / hebdo / annuel
    ├── i18n/                # Dictionnaires en/ar + provider RTL/LTR
    ├── supabase/            # Clients navigateur / serveur / middleware
    └── entries.ts           # Accès données daily_entries
```

**Le point clé** : `src/lib/activities/config.ts` décrit toutes les activités.
Le formulaire, le scoring, le dashboard et les analyses en découlent. **Ajouter
une habitude ne demande pas de reconstruire l'app** (voir §7).

---

## 2. Créer le projet Supabase

1. Aller sur [supabase.com](https://supabase.com) → **New project**.
2. Choisir un nom, un mot de passe de base de données (à conserver), une région
   proche de vos utilisateurs. Plan **Free**.
3. Attendre ~2 minutes que le projet soit prêt.

---

## 3. Exécuter le schéma SQL

Dans Supabase → **SQL Editor** → **New query** :

1. Copier/coller **tout** le contenu de
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) →
   **Run**. Cela crée les tables `profiles` et `daily_entries`, les types enum,
   les triggers et **toutes les policies RLS**.
2. (Optionnel, pour la vue admin) Coller
   [`supabase/migrations/0002_admin.sql`](supabase/migrations/0002_admin.sql) →
   **Run**. Inerte tant qu'aucun admin n'est désigné (voir §6).

### Réglages « Security » (Settings → API / Database)

- **Enable Data API** : **ON** — obligatoire, `supabase-js` en dépend.
- **Automatically expose new tables** : **OFF** (recommandation Supabase). Le
  script `0001_init.sql` contient déjà les `GRANT` explicites pour le rôle
  `authenticated`, donc `profiles` et `daily_entries` restent accessibles.
- **Enable automatic RLS** : **ON** — filet de sécurité : toute nouvelle table
  du schéma `public` sera créée avec RLS activée (verrouillée par défaut).

> Rappel : la sécurité réelle vient des **policies RLS** (chaque utilisateur ne
> voit que ses lignes). Les `GRANT` ne font qu'« exposer » la table à l'API ;
> RLS filtre ensuite ligne par ligne. Le rôle `anon` (déconnecté) n'a aucun accès.

### Confirmation d'email (recommandé pour un petit groupe : la désactiver)

Par défaut Supabase demande une confirmation par email à l'inscription.
Pour simplifier (connexion immédiate après inscription) :
**Authentication → Providers → Email → décocher "Confirm email"**.
Si vous la laissez activée, la route `/auth/callback` gère le retour du lien.

---

## 4. Récupérer les clés API

Supabase → **Project Settings → API** :

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> La clé `anon` est publique **par conception** : toute la sécurité repose sur
> les policies RLS (chaque utilisateur ne voit que ses lignes). Ne jamais
> exposer la clé `service_role`.

---

## 5. Lancer en local

```bash
npm install
cp .env.local.example .env.local   # puis renseigner les 2 clés Supabase
npm run dev
```

Ouvrir http://localhost:3000. Créer un compte, remplir le jour, voir le dashboard.

Scripts utiles :

```bash
npm run typecheck   # vérification TypeScript
npm run build       # build de production
```

---

## 6. Déployer gratuitement sur Vercel

1. Pousser le projet sur un dépôt **GitHub** :

   ```bash
   git init
   git add .
   git commit -m "DailyPath initial"
   git branch -M main
   git remote add origin https://github.com/<vous>/<repo>.git
   git push -u origin main
   ```

2. Sur [vercel.com](https://vercel.com) → **Add New… → Project** → importer le
   dépôt GitHub. Framework détecté : **Next.js** (aucun réglage à changer).
3. **Environment Variables** → ajouter :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - (optionnel) `NEXT_PUBLIC_ENABLE_ADMIN=true`
4. **Deploy**. Vercel fournit une URL `https://<projet>.vercel.app`.
5. **Important** — dans Supabase → **Authentication → URL Configuration** :
   - **Site URL** : votre URL Vercel.
   - **Redirect URLs** : ajouter `https://<projet>.vercel.app/auth/callback`.

À chaque `git push`, Vercel redéploie automatiquement.

---

## 7. Activer la vue administrateur (plus tard, sans reconstruire)

1. Exécuter la migration `0002_admin.sql` (si pas déjà fait).
2. Désigner un admin (SQL Editor) :
   ```sql
   update public.profiles set is_admin = true where id = '<uuid_utilisateur>';
   ```
   (l'UUID est visible dans **Authentication → Users**.)
3. Mettre `NEXT_PUBLIC_ENABLE_ADMIN=true` (local et/ou Vercel) et redéployer.

La page `/admin` affiche des statistiques **agrégées et anonymisées** du groupe.

---

## 8. Personnaliser / étendre

### Remplir les notes explicatives (info-bulles)

Chaque activité a une note explicative **laissée vide volontairement**.
Renseignez-les dans les dictionnaires — l'icône ⓘ apparaîtra automatiquement :

- Anglais : `src/lib/i18n/dictionaries/en.ts` → objet `notes`
- Arabe : `src/lib/i18n/dictionaries/ar.ts` → objet `notes`

### Ajouter une nouvelle activité

1. Ajouter un objet dans `ACTIVITIES` (`src/lib/activities/config.ts`).
   - Stockage **sans migration** : `storage: { kind: "jsonb_key", key: "mon_id" }`
     (rangé dans la colonne `responses` déjà présente).
   - Stockage en **colonne dédiée** : ajouter la colonne via une migration SQL
     puis utiliser `enum_column` / `boolean_column` / `columns` / `jsonb_array`.
2. Ajouter les libellés (`activities`, éventuelles `options`, `notes`) dans
   `en.ts` et `ar.ts`.

Le formulaire, le scoring, le dashboard et les analyses se mettent à jour seuls.

### Ajouter une langue

Dupliquer un dictionnaire, l'enregistrer dans `provider.tsx` et `config.ts`
(`LOCALES`), et ajouter la direction si RTL.

### Couleurs & thème clair / sombre

Le site propose un **thème clair et un thème sombre** (bouton soleil/lune dans la
barre et sur les pages d'auth ; choix mémorisé par cookie `THEME`). Les couleurs
passent par des **tokens sémantiques** (`bg`, `surface`, `content`, `border`,
`primary`…) adossés à des variables CSS :

- Pour **ajuster une teinte**, modifie les variables dans
  [`src/app/globals.css`](src/app/globals.css) (`:root` = clair,
  `:root[data-theme="dark"]` = sombre). Les composants s'adaptent tout seuls.
- Les couleurs des **graphiques** (Recharts, qui reçoit des couleurs en props)
  sont dans [`src/lib/theme/chart.ts`](src/lib/theme/chart.ts).

---

## 9. Modèle de données (rappel)

`daily_entries` : `id`, `user_id`, `entry_date`, les 5 prières (booléens),
`quran_wird` / `hadith_wird` (enum complete/partial/none), `nafl_prayers` (jsonb),
`adhkar_morning_evening` (enum both/one/none), `daily_adhkar` (jsonb),
`program_wird` (enum all/partial/none), `personal_reading` / `sport` (booléens),
`rest` (enum healthy/draining/none), `silence` (booléen), `responses` (jsonb
d'extension), `created_at`, `updated_at`, **contrainte unique `(user_id, entry_date)`**.

RLS : chaque utilisateur ne peut lire/écrire que ses propres lignes.
