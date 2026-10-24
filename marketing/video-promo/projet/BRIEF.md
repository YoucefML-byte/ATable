---
workflow: product-launch-video
flow: automation
storyboard: no
message: "Avec Atable, vos clients commandent depuis leur table et votre équipe ne court plus après les commandes."
destination: website
aspect: 1920x1080
language: fr
audience: "Patrons de restaurants, bars, chichas et cafés ; décideurs qui choisissent un outil de commande"
length: 60s
angle: "Le ticket — le parcours d'une commande raconté par un ticket de cuisine, de la table au tableau de bord"
narration: yes (voix off FR, Vivienne — edge-tts fr-FR-VivienneMultilingualNeural, assets/audio/voiceover.wav)
---

## Intent

Une publicité en motion design pour Atable, la plateforme de commande à table par QR code ou NFC
(restaurants, bars, chichas, cafés). Elle doit expliquer comment l'application fonctionne et montrer
ses fonctionnalités, avec des zooms sur les vrais écrans, et convaincre des entreprises et des clients
d'acheter le service. Niveau portfolio : « je compte sur toi pour que je fasse un truc impressionnant ».
Le porteur de projet a délégué tous les choix (« fais tous les choix qui te semblent les plus logiques »).

Concept retenu (pitch 2, avec la plongée dans les écrans du pitch 1) : toute la pub est racontée par un
ticket de cuisine « Table 4 » qui s'imprime, glisse le long du rail et passe de station en station
(table → salle → cuisine → patron → plateforme). À chaque station, un vrai écran de l'application
s'ouvre en gros plan et la caméra zoome sur le geste qui compte. Papier thermique, écriture de caisse,
tampons « VALIDÉ » et « PRÊTE ». Ouverture : le bruit d'une imprimante de cuisine dans le noir.

## Assets

- ../../shots-tour/client-carte.png — site client, la carte du Bistrot (1170×1992, téléphone).
- ../../shots-tour/client-produit.png — fiche produit Tacos 2 viandes avec options (téléphone).
- ../../shots-tour/client-panier.png — panier avec la note « Sauce à part svp », total 14,50 € (téléphone).
- ../../shots-tour/client-confirmation.png — « Commande envoyée ✓ N° 001 », paiement au comptoir (téléphone).
- ../../shots-tour/client-lounge.png — site du Lounge, thème sombre violet (téléphone).
- ../../shots-tour/pro-salle.png — écran Salle : À valider / En préparation / Prêtes (tablette 1920×1200).
- ../../shots-tour/pro-cuisine.png — écran Cuisine sombre avec minuteurs et boutons PRÊTE (tablette).
- ../../shots-tour/pro-pin.png — « Qui êtes-vous ? » connexion de l'équipe par code (tablette).
- ../../shots-tour/pro-tables.png — vue des tables colorées par état (tablette).
- ../../shots-tour/patron-carte.png, patron-horaires.png, patron-qr.png, patron-theme.png,
  patron-tableau-de-bord.png — espace du patron (ordinateur 1800 px de large).
- ../../shots-tour/console-commerces.png, console-commerce.png — console de la plateforme.
- /home/user/atable/public/icons/icon.svg — logo Atable (carré vert #1F4D3A, assiette et couverts blancs, point doré #E0A33A).

## Customizations

- Zooms et recadrages sur les vrais écrans à chaque fonctionnalité.
- Musique et bruitages fabriqués localement (aucun compte HeyGen relié) : imprimante de ticket, tampons,
  sonnette de comptoir, clics.

## Notes

- Pas de voix off : la seule voix française disponible ici est robotique ; une pub doit aussi fonctionner
  sans le son (lecture automatique muette sur les sites et LinkedIn). Les textes animés portent l'explication.
- Vocabulaire du projet : « montant commandé », jamais « chiffre d'affaires ». Le paiement se fait au
  comptoir (aucun paiement en ligne). Le client commande sans compte et sans application à installer.
- Ne montrer aucun vrai code PIN, mot de passe ni jeton de table.
- « Atable » est un nom de travail ; adresses de production prévues : pro.atable.fr, console.atable.fr.
- Pas de chiffres marketing inventés présentés comme des mesures (ex. « +30 % de ventes »).

## Mise à jour — séquence installation (88 s)

Ajout demandé : montrer comment Atable s'installe. Chaque table reçoit une plaque métallique, avec un
autocollant QR code propre à la table ; la plaque se place au bord de la table, côté gauche ou côté droit ;
trois couleurs au choix : rose, argenté ou doré ; une tablette est fournie, reliée aux QR codes, pour que
l'équipe voie les commandes et fasse tout le travail disponible dans l'application. Voix : Vivienne.
Trois plans insérés après « La promesse » (02a la plaque, 02b la table, 02c la tablette, 12–32 s) ; le plan 03
scanne désormais la plaque dorée de la table 4 au lieu d'un chevalet en carton.

## Mise à jour — prononciation et plan 3D (96 s)

- Prononciation : edge-tts envoyait le texte en en-US ; la voix multilingue lisait « Prête ? » et « Atable »
  à l'anglaise. Le SSML est maintenant envoyé en fr-FR, « Prête ? » devient « Elle est prête ? » et la marque est
  écrite « À table » dans le texte lu (à l'écran elle reste « Atable »). Vérifié avec Whisper (langue perçue du mot).
- Nouveau plan 03a (32–40 s) en vraie 3D (three.js) : le plan de salle devient un restaurant, un client de la
  table 4 sort son téléphone et scanne la plaque, la caméra entre dans l'écran.

## Mise à jour — plan 3D réaliste (03a)

- Le plan 03a (32–40 s) est refait en 3D réaliste : rendu Blender 4.5 / Cycles joué en vidéo
  (`assets/video/03a-la-salle.mp4`) sous les repères HTML « VENDREDI · 20:34 » et « TABLE 4 ». Même histoire,
  même minutage et même trajectoire de caméra qu'avant ; les 6 tables gardent la disposition du plan 02c.
- Restaurant plus riche et plus contrasté (bistrot de nuit, lambris vert, laiton, bougies, bar, ardoise, miroir),
  vrais personnages (scans Renderpeople) animés en capture de mouvement (Mixamo), serveur en gilet et tablier
  avec plateau. Pipeline et crédits CC-BY : `.hyperframes/salle-3d/` (README.md, CREDITS.md).
