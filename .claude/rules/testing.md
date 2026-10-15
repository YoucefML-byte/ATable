---
paths:
  - 'tests/**'
  - 'supabase/tests/**'
  - '**/*.test.ts'
  - '**/*.test.tsx'
---

# Règles de test

Références : `docs/bible/06-normes-developpement.md` §10, `docs/bible/08-qualite-devops-exploitation.md` §1.

- Le nom de chaque test cite l'identifiant de la bible qu'il couvre : `it('CLI-05 CA2 — idempotence', …)`.
- Un bug corrigé commence par un test qui le reproduit.
- Pas de dépendance à l'heure réelle : horloge injectée (Vitest `vi.setSystemTime`, Playwright `page.clock`) ou paramètre d'instant dans les fonctions SQL de test.
- pgTAP : chaque test d'isolation crée deux commerces et vérifie lecture, insertion, modification et suppression croisées (`tests.login`, `tests.staff_login` de `supabase/tests/00_helpers.sql.inc`).
- Playwright : projets « iphone-13 », « pixel-7 », « tablette » et « bureau » ; hôtes `*.localhost`. Le résolveur DNS de Node ne connaît pas `*.localhost` : faire les appels HTTP de test depuis la page (`page.evaluate(fetch)`).
- Les tests e2e tournent sur la version de production (`pnpm build && pnpm start`) avec `PW_OUTPUT_DIR` hors du projet : un fichier écrit dans le projet relance `next dev`.
- Aucun test ne doit dépendre de l'ordre d'exécution ni de données laissées par un autre test.
- Un test instable est corrigé, jamais simplement relancé ou désactivé sans entrée dans le compte rendu.
