# DailyPath — Suivi quotidien communautaire

Application de suivi quotidien pour un groupe : chaque membre remplit chaque
jour son suivi personnel (prières, wird, adhkar, lecture, sport, repos, silence…),
avec **compte individuel**, **données privées** (Row Level Security), **heatmap**,
**série de jours consécutifs**, et **analyses hebdomadaires / annuelles**.

- **Suivi entièrement personnalisable** : chaque membre compose sa propre liste
  d'activités (création, icône, couleur, ordre, récurrence, rappel) depuis
  Profil → Réglages
- **Compte** : inscription, connexion et **récupération de mot de passe**
- **Frontend** : Next.js 14 (App Router) + React + Tailwind CSS
- **Backend** : Supabase (Postgres + Auth + RLS)
- **Graphiques** : Recharts (chargés à la demande)
- **Langues** : arabe (RTL) et anglais (LTR), bascule instantanée
- **Thème** : clair / sombre
- **Hébergement** : Vercel (plan gratuit), déployé depuis GitHub

> 100 % gratuit pour un groupe : le plan gratuit Supabase (jusqu'à ~50 000 MAU,
> 500 Mo de base) et le plan Hobby de Vercel suffisent largement.

---

## 1. Architecture (pensée pour évoluer)

```
src/
├── app/                        # Pages (App Router)
│   ├── login, signup           # Authentification email + mot de passe
│   ├── forgot-password         # Demande de réinitialisation
│   ├── reset-password          # Choix du nouveau mot de passe
│   ├── (app)/                  # Zone protégée (garde d'auth dans le layout)
│   │   ├── today               # Formulaire du jour (créer / éditer)
│   │   ├── dashboard           # Heatmap + streak + derniers jours
│   │   ├── analytics/weekly    # Analyse hebdomadaire
│   │   ├── analytics/yearly    # Analyse mensuelle / annuelle
│   │   ├── profile             # Identité du compte
│   │   ├── profile/settings    # ★ Réglages : activités, langue, thème
│   │   └── admin               # Vue admin (désactivée par défaut)
│   └── auth/callback           # Retour des liens email (confirmation, reset)
├── components/
│   ├── ui/                     # Primitives (Button, Modal, Icon, Skeleton…)
│   ├── form/                   # Formulaire du jour
│   ├── settings/               # Gestion des activités + aperçu
│   ├── dashboard/, analytics/  # Visualisations
│   └── auth/, layout/
└── lib/
    ├── activities/             # ★ Cœur du domaine (voir ci-dessous)
    ├── analytics/              # Calculs streak / hebdo / annuel
    ├── i18n/                   # Dictionnaires en/ar + provider RTL/LTR
    ├── theme/                  # Thème clair/sombre, accents, couleurs graphiques
    ├── reminders/              # Rappels locaux
    ├── supabase/               # Clients navigateur / serveur / middleware
    ├── validation.ts           # Validation des saisies
    └── entries.ts              # Accès données daily_entries
```

**Le point clé** — `src/lib/activities/` :

| Fichier | Rôle |
|---|---|
| `config.ts` | Catalogue **par défaut** (semé au premier usage) |
| `types.ts` | `UserActivity` **étend** `ActivityConfig` + présentation/planning |
| `store.ts` | CRUD Supabase (créer, modifier, supprimer, réordonner, restaurer) |
| `provider.tsx` | État partagé : réglages et « Aujourd'hui » restent synchronisés |
| `recurrence.ts` | Quelles activités sont dues à une date donnée |
| `serialization.ts` | Formulaire ⇄ base, piloté par le `storage` de chaque activité |
| `scoring.ts` | Taux de complétion, scores par catégorie |

Comme `UserActivity` étend `ActivityConfig`, le moteur (sérialisation, scoring,
analyses) accepte la liste dynamique **sans modification** : seule la liste
change, jamais le contrat.

---

## 2. Créer le projet Supabase

1. Aller sur [supabase.com](https://supabase.com) → **New project**.
2. Choisir un nom, un mot de passe de base de données (à conserver), une région
   proche de vos utilisateurs. Plan **Free**.
3. Attendre ~2 minutes que le projet soit prêt.

---

## 3. Exécuter le schéma SQL

Dans Supabase → **SQL Editor** → **New query** :

Exécuter les fichiers **dans l'ordre**, un par un :

1. [`0001_init.sql`](supabase/migrations/0001_init.sql) → **Run**.
   Crée `profiles` et `daily_entries`, les types enum, les triggers et
   **toutes les policies RLS**.
2. [`0003_user_activities.sql`](supabase/migrations/0003_user_activities.sql) →
   **Run**. Crée `user_activities` : la liste d'activités **propre à chaque
   utilisateur** (obligatoire pour l'écran « Aujourd'hui » et les réglages).
3. (Optionnel, vue admin) [`0002_admin.sql`](supabase/migrations/0002_admin.sql)
   puis [`0004_admin_simplify.sql`](supabase/migrations/0004_admin_simplify.sql)
   → **Run**. Inertes tant qu'aucun admin n'est désigné (voir §6).

> Mise à jour d'une installation existante : il suffit de jouer `0003` (et
> `0004` si la vue admin est utilisée). Aucune donnée n'est perdue — les
> activités d'origine gardent leurs colonnes, et le catalogue par défaut est
> semé automatiquement à la première connexion de chaque membre.

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

### Mot de passe oublié

Le parcours complet est intégré : lien « Mot de passe oublié ? » sur la
connexion → email de réinitialisation → `/auth/callback` → `/reset-password`
(validation, indicateur de robustesse, gestion du lien expiré).

Pour qu'il fonctionne en production, **Authentication → URL Configuration** doit
lister `https://<votre-domaine>/auth/callback` dans **Redirect URLs** (voir §6).
En local, `http://localhost:3000/auth/callback` doit y figurer aussi.

> Sécurité : la confirmation affichée est identique que l'adresse existe ou non
> (pas d'énumération de comptes), et le paramètre `next` du callback est
> restreint aux chemins internes (pas de redirection ouverte).

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

> **Windows + OneDrive** : ce projet est dans un dossier synchronisé. La
> synchronisation verrouille parfois `.next` et fait échouer `next dev` /
> `next build` (`EBUSY`, `EINVAL: readlink`). Si cela arrive, supprimez `.next`
> et relancez. Pour éviter le problème durablement, excluez `.next` et
> `node_modules` de la synchronisation OneDrive (clic droit → « Toujours
> conserver sur cet appareil » désactivé / paramètres OneDrive → dossiers
> exclus), ou déplacez le projet hors de OneDrive.

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

### Personnaliser ses activités (depuis l'application)

**Profil → Réglages → Suivi du jour** permet à chaque membre, sans
toucher au code, de : créer / modifier / supprimer une activité, l'activer ou
la désactiver, la réordonner, choisir son icône et sa couleur, définir un
rappel et une récurrence (tous les jours ou certains jours), rédiger la note
explicative, et **rétablir la configuration d'origine**. Les changements sont
visibles immédiatement sur « Aujourd'hui ».

- Les activités d'origine gardent leurs **colonnes dédiées** → historique et
  analyses préservés.
- Les activités créées par l'utilisateur sont rangées dans la colonne
  `responses` (jsonb) → **aucune migration** n'est nécessaire.
- Supprimer une activité ne supprime jamais les journées déjà enregistrées.

### Remplir les notes explicatives (info-bulles)

Deux possibilités :

- **Depuis l'app** (recommandé) : Profil → Réglages → modifier une activité →
  champ « Explication ». La note est propre à chaque utilisateur.
- **Par défaut pour tout le monde** : dictionnaires `notes` dans
  `src/lib/i18n/dictionaries/en.ts` et `ar.ts`. L'icône ⓘ n'apparaît que
  lorsqu'une note existe.

### Modifier le catalogue par défaut (pour les nouveaux membres)

`src/lib/activities/config.ts` définit le catalogue **semé au premier usage**,
et `src/lib/activities/defaults.ts` son icône/couleur par défaut. Modifier ces
fichiers change ce que reçoivent les nouveaux comptes ; les membres existants
gardent leur liste (ou peuvent la réinitialiser depuis les réglages).

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

`user_activities` (migration 0003) : la liste d'activités propre à chaque
utilisateur — `activity_key`, `label`, `note`, `type`, `options` / `scale`,
`icon`, `color`, `sort_order`, `enabled`, `required`, `weight`, `storage`
(où ranger la réponse dans `daily_entries`), `is_builtin`, `reminder_enabled`,
`reminder_time`, `recurrence`, **contrainte unique `(user_id, activity_key)`**.

RLS : chaque utilisateur ne peut lire/écrire que ses propres lignes, sur les
trois tables.
