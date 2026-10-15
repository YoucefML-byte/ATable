---
paths:
  - 'src/app/**'
  - 'src/components/**'
  - 'src/features/**/*.tsx'
  - 'messages/**'
---

# Règles d'interface

Références : `docs/bible/06-normes-developpement.md` §4 et §7, `docs/bible/07-ux-ui-design-system.md`.

- Composants serveur par défaut ; `'use client'` le plus bas possible et seulement si nécessaire.
- Aucun texte en dur : `useTranslations` / `getTranslations` et clés dans `messages/fr/<espace>.json` (forme `espace.ecran.element`).
- Couleurs et espacements uniquement via les jetons Tailwind et les variables de thème.
- Site client : aucune bibliothèque lourde (graphiques, éditeurs, animations) ; images `<img>` dimensionnées avec `srcset` ; polices via `next/font`.
- Zones tactiles : 44 px (site client), 48 px (espace pro), 56 px (actions principales salle et cuisine).
- Chaque écran gère : chargement, vide, erreur, hors ligne, contenus longs.
- Accessibilité : libellés, focus visible, navigation clavier, `aria-live` pour les notifications, `prefers-reduced-motion` ; jamais d'information portée par la couleur seule.
- Prix : toujours `formatPrice()` ; dates : fuseau du commerce, jamais celui du navigateur.
- Les dossiers internes s'appellent `src/app/int-site`, `int-pro`, `int-console` (ADR-010) : le proxy y réécrit les hôtes.
