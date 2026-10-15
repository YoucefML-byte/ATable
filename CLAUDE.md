# Atable — instructions permanentes pour Claude Code

@AGENTS.md

Atable est une plateforme **multi-commerces** de commande à table par QR code / NFC (restaurants, bars,
chichas, cafés…). Un seul code et une seule base servent tous les commerces ; chaque commerce a son
domaine, son thème et ses données isolées. Le client commande sans compte, l'équipe valide chaque
commande, la cuisine prépare, le paiement se fait au comptoir (aucun paiement en ligne).

Le porteur du projet n'est **pas développeur** : il te délègue tout et lit tes comptes rendus. Écris pour
lui en français simple.

## Source de vérité

- La bible : `docs/bible/` (00 index · 01 métier · 02 fonctionnel · 03 architecture · 04 base de données ·
  05 sécurité · 06 normes · 07 UX/UI · 08 qualité et exploitation · 09 roadmap et prompts). **Ce dossier
  n'est pas versionné** (document confidentiel, `.gitignore`) : copie les volumes dans `docs/bible/` sur
  ta machine.
- Décisions : `docs/adr/` (ADR-009 à 011 complètent la bible). Actions humaines : `docs/HUMAN-TODO.md`.
- Revue de la bible et corrections appliquées : `docs/REVUE-BIBLE.md`.

## Stack (ne pas changer sans ADR accepté)

Next.js 16 (App Router, `proxy.ts`, Turbopack) · React 19 · TypeScript strict · pnpm · Tailwind CSS 4 ·
next-intl (fr) · Zod 4 · Supabase (PostgreSQL 17 + RLS, Auth TOTP, Realtime Broadcast privé, Storage,
pg_cron) via `@supabase/ssr` · Vitest · Playwright · pgTAP · Vercel (région `cdg1`).

## Commandes

- `pnpm dev` — serveur local (hôtes : `bistrot.localhost:3000`, `lounge.localhost:3000`,
  `pro.localhost:3000`, `console.localhost:3000`)
- `pnpm db:start` / `pnpm db:reset` / `pnpm db:test` / `pnpm db:types`
- `pnpm check` — lint + types + tests unitaires + pgTAP (avant chaque commit significatif)
- `pnpm build && pnpm start`, puis `E2E_NO_SERVER=1 pnpm e2e` — Playwright sur la version de production
- `supabase migration new <nom>` — nouvelle migration
- Comptes de démonstration : voir `README.md`.

## Règles non négociables

1. **Isolation** : toute table de `public` a la RLS activée et ses politiques **dans la même migration**,
   avec tests pgTAP d'isolation entre deux commerces.
2. **Prix** : calculés uniquement en base (`public_place_order`) ; montants en **centimes entiers** ; le
   client n'envoie jamais de prix.
3. **Sécurité par la base** : les autorisations réelles sont dans PostgreSQL ; les vérifications
   applicatives s'ajoutent, ne remplacent pas.
4. **Clé secrète Supabase** : uniquement dans `src/server/supabase/admin.ts`, pour les usages listés dans
   `src/server/supabase/admin-usage.md`. Tout nouvel usage = ADR.
5. **Fonctions `security definer`** : toujours `set search_path = ''`, permission vérifiée en premier,
   appartenance au commerce vérifiée.
6. **Jamais** de secret, PIN, mot de passe, jeton de session, cookie, jeton de table complet ou clé client
   dans le code, les journaux, les erreurs ou une variable `NEXT_PUBLIC_`.
7. **Migrations** : jamais modifier une migration déjà fusionnée ; migrations rétrocompatibles.
8. **Textes** : aucun texte d'interface en dur, tout dans `messages/fr/*.json`. Vocabulaire : « montant
   commandé », jamais « chiffre d'affaires ».
9. **Pas de fonctionnalité sans test** ; chaque critère d'acceptation (ex. `CLI-05 CA2`) est cité dans le
   nom du test.
10. **Pas de commit sur `main`** ; une branche par étape ; Conventional Commits en anglais.
11. **Pas de nouvelle dépendance** sans justification écrite (volume 06 §13).
12. **Rien en production** sans demande explicite du porteur de projet.

## Organisation du code

`src/proxy.ts` aiguillage par hôte · `src/app/int-site/[host]` site client · `src/app/int-pro` espace pro ·
`src/app/int-console` console · `src/app/api` routes API · `src/features/<domaine>/{schemas,queries,actions}.ts`
· `src/server/*` code serveur uniquement (`import 'server-only'`) · `src/lib` utilitaires purs ·
`src/components/{ui,site,pro,console,auth}` · `supabase/{migrations,tests,seed.sql}` · `tests/{e2e,load}`.

Les dossiers internes sont préfixés `int-` (et non `_`) : voir ADR-010. Les actions serveur ne font pas de
`redirect()` : elles renvoient `redirectTo` et le navigateur navigue (ADR-010).

## Langues

Code et commits en anglais ; interface, comptes rendus, ADR et documentation en français.
