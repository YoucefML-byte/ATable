# Mettre en ligne la version de test (recette)

But : essayer Atable pour de vrai, avec un téléphone et de vrais QR codes, sans rien payer. La version de
test utilise les données de démonstration (Le Bistrot Démo, Le Lounge Démo) et des adresses gratuites en
`vercel.app`. Tout se fait depuis un navigateur, téléphone compris. Comptez 30 à 45 minutes.

Tout au long du guide, remplacez **PREFIXE** par un nom court de votre choix, en minuscules, par exemple
`atable-yml`. Les adresses seront :

| Espace          | Adresse                              |
| --------------- | ------------------------------------ |
| Site du Bistrot | `https://PREFIXE-bistrot.vercel.app` |
| Site du Lounge  | `https://PREFIXE-lounge.vercel.app`  |
| Espace pro      | `https://PREFIXE-pro.vercel.app`     |
| Console         | `https://PREFIXE-console.vercel.app` |

> Ne collez jamais une clé ou un mot de passe dans une conversation (Claude compris). Collez-les
> uniquement dans les pages de Supabase, Vercel et GitHub indiquées ci-dessous.

## Étape 1 — Supabase (la base de données)

1. Allez sur **supabase.com**, créez un compte (« Continue with GitHub » est le plus simple).
2. **New project** : nom `atable-recette`, région **Paris (eu-west-3)** ou Francfort. Cliquez sur
   _Generate a password_ et **copiez ce mot de passe dans une note** : c'est le _mot de passe de la base_.
   Validez et attendez 1 à 2 minutes.
3. Notez trois valeurs (Project Settings) :
   - **Project ID** (General) : 20 lettres minuscules, par exemple `abcdefghijklmnopqrst` ;
   - **Project URL** (Data API) : `https://abcdefghijklmnopqrst.supabase.co` ;
   - **API Keys** : la clé _Publishable_ (`sb_publishable_…`) et la clé _Secret_ (`sb_secret_…`,
     bouton « Reveal »).
4. Créez un **jeton d'accès** : cliquez sur votre avatar → _Account preferences_ → _Access Tokens_ →
   _Generate new token_, nom `github-recette`. Copiez-le.

## Étape 2 — Vercel (l'hébergement)

1. Allez sur **vercel.com**, créez un compte avec _Continue with GitHub_.
2. _Add New… → Project_ → importez le dépôt **ATable** (autorisez Vercel à le voir si demandé).
3. Avant de cliquer sur _Deploy_, ouvrez **Environment Variables** et ajoutez :

   | Nom                                    | Valeur                        |
   | -------------------------------------- | ----------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`             | la _Project URL_ de l'étape 1 |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | la clé _Publishable_          |
   | `SUPABASE_SECRET_KEY`                  | la clé _Secret_               |
   | `PLATFORM_ROOT_DOMAIN`                 | `PREFIXE.vercel.app`          |
   | `PLATFORM_PRO_HOST`                    | `PREFIXE-pro.vercel.app`      |
   | `PLATFORM_CONSOLE_HOST`                | `PREFIXE-console.vercel.app`  |
   | `PUBLIC_SCHEME`                        | `https`                       |

4. Cliquez sur **Deploy** et attendez la fin (2 à 4 minutes).
5. _Settings → Domains_ du projet : ajoutez les quatre adresses du tableau du haut, une par une
   (`PREFIXE-bistrot.vercel.app`, `PREFIXE-lounge.vercel.app`, `PREFIXE-pro.vercel.app`,
   `PREFIXE-console.vercel.app`). Si Vercel répond qu'une adresse est déjà prise, choisissez un autre
   PREFIXE et corrigez les trois variables `PLATFORM_…` (puis _Deployments → … → Redeploy_).

L'adresse par défaut du projet (par exemple `atable.vercel.app`) affiche « Ce site n'existe pas » : c'est
normal, seules les quatre adresses ci-dessus sont utilisées.

## Étape 3 — GitHub (les paramètres du bouton d'installation)

Sur GitHub, dépôt **ATable** → _Settings_ → _Secrets and variables_ → _Actions_.

Onglet **Secrets** → _New repository secret_, quatre fois :

| Nom                     | Valeur                                                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `SUPABASE_ACCESS_TOKEN` | le jeton d'accès de l'étape 1.4                                                                                              |
| `RECETTE_PROJECT_REF`   | le _Project ID_ (20 lettres)                                                                                                 |
| `RECETTE_DB_PASSWORD`   | le mot de passe de la base (étape 1.2)                                                                                       |
| `RECETTE_DEMO_PASSWORD` | un mot de passe **inventé par vous** (12 caractères ou plus) : ce sera le mot de passe des comptes de démonstration en ligne |

Onglet **Variables** → _New repository variable_ : `RECETTE_PREFIX` = votre PREFIXE.

## Étape 4 — Installer la base

GitHub → onglet **Actions** → **Recette — installer la base** → _Run workflow_ → tapez `RECETTE` →
_Run workflow_. Au bout de 2 à 3 minutes, une coche verte apparaît et le résumé affiche les adresses.

Ce bouton **efface et réinstalle** toute la base de test : relancez-le quand vous voulez repartir des
données de démonstration.

## Étape 5 — Essayer

1. Sur un ordinateur ou une tablette, ouvrez `https://PREFIXE-pro.vercel.app`, connectez-vous avec
   `karim@bistrot.test` et votre `RECETTE_DEMO_PASSWORD`. À la première connexion, l'application demande
   de scanner un QR code avec une application d'authentification (Google Authenticator, Microsoft
   Authenticator…) : c'est la double authentification.
2. Menu **Appareils** → _Enrôler cet appareil_, puis **Se déconnecter** : la tablette affiche maintenant
   l'équipe. Touchez **Sofia** et tapez `518374`, puis **Démarrer le service**.
3. Menu **Tables et QR** (connecté en patron) → _Planche d'impression_ : imprimez ou affichez un QR code,
   scannez-le avec votre téléphone, commandez. La commande apparaît sur la tablette.
4. La console : `https://PREFIXE-console.vercel.app`, compte `admin@atable.test`, même mot de passe.

Codes PIN de l'équipe : Léa `241608`, Mehdi `739215`, Sofia `518374` (Bistrot) ; Inès `362951`,
Yanis `847120`, Nora `905263` (Lounge, compte `samia@lounge.test`).

## Limites de cette version de test

- Les e-mails (invitations, mot de passe oublié) passent par le service gratuit de Supabase, limité à
  quelques envois par heure. Les comptes de démonstration ont des adresses fictives : ils ne reçoivent
  pas d'e-mail.
- Un commerce créé depuis la console reçoit une adresse `slug.PREFIXE.vercel.app` qui ne fonctionne pas
  sur `vercel.app` : ajoutez-lui une adresse `PREFIXE-slug.vercel.app` (Vercel, puis console →
  Domaines → Ajouter → Marquer comme vérifié). Avec un vrai nom de domaine, tout est automatique.
- Le projet Supabase gratuit se met en pause après une semaine sans visite : il suffit de cliquer sur
  _Restore_ dans Supabase.
