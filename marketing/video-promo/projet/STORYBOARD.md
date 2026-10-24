---
format: 1920x1080
duration: 96s
message: "Avec Atable, vos clients commandent depuis leur table et votre équipe ne court plus après les commandes."
arc: PAS (hook → promesse) → Installation (plaque, table, tablette) → La salle en 3D (le client scanne) → Demo Loop (le parcours d'une commande, station par station) → Feature-Benefit (le patron) → confiance → CTA
audience: "Patrons de restaurants, bars, chichas et cafés ; décideurs qui choisissent un outil de commande"
mode: autonomous
music: none
tempo: 120 bpm (one beat = 0.5 s, one bar = 2 s); every frame starts on a bar line
---

# Atable — « Le ticket » (publicité, 16:9, ~96 s, avec voix off)

This video tells restaurant, bar, chicha and café owners that **with Atable their customers order from
the table and their team stops running after orders**. It follows ONE order, « Table 4 · N° 001 »,
station by station along a kitchen ticket rail: client → salle → cuisine → équipe → patron → plateforme.
Before the order journey, a three-frame installation sequence (02a–02c, 12–32 s, its own 3-station
« INSTALLATION » rail: 01 PLAQUE · 02 TABLE · 03 TABLETTE) shows what Atable installs: a metal plate per
table with its QR sticker, placed at the left or right end of the table, in three finishes (rose, argenté,
doré), and the provided tablet linked to every QR code. Then a photoreal 3D frame (03a, Blender/Cycles video, 32–40 s)
returns to the Friday rush: the floor plan becomes a real restaurant and the customer at table 4 scans the plate.
Frames 03–11 start 28 s later than in the 68 s cut. The voice-over SSML is sent as fr-FR (edge-tts defaults to
en-US, which made the multilingual voice read « Prête ? » and « Atable » with an English accent).
A French voice-over (edge-tts fr-FR-VivienneMultilingualNeural, assets/audio/voiceover.wav) doubles the on-screen copy,
each line starting on the reveal it echoes; the music bed is ducked under it (assets/audio/soundtrack-vo.wav),
paced on a 120 bpm music grid
(reveals land on beats, i.e. on multiples of 0.5 s inside each frame). The music bed and every sound
effect are produced by the host and mounted at the root — frames never embed audio.

## Video direction

- **Palette (frame.md tokens, by role).** Two surfaces per frame, never three. Default ground
  `cream` #F4EFE6 with `ink` #0C1613 text and `green` #1F4D3A headlines. Gravity frames (01 ends,
  02, 06, 09, 11) use a `green` #1F4D3A ground with `cream` text and `pink` (= Atable gold #E0A33A)
  accents. `cream-2` #E7DCC6 is the thermal-ticket paper and tile fill. `pink-deep` #B9822A for
  gold text on cream. Status colours taken from the app itself, used ONLY on its status rings and
  stamps: orange #B45309 « à valider », blue #1D4ED8 « en préparation », green #047857 « prête ».
- **Type (frame.md roles).** Display = Source Serif 4 weight 500 (headlines, the big numbers);
  body = Source Serif 4 400; chrome = JetBrains Mono 500 UPPERCASE tracked (labels, ticket lines,
  callouts, the rail). Ticket lines and stamps are always mono — they are the receipt voice.
- **The ticket rail (topbar, frames 03–10).** A thin 2px `ink` hairline at y≈64 from x=640 to
  x=1640 with six station dots at x = 660, 852, 1044, 1236, 1428, 1620, labels below in mono
  caption size: « 01 CLIENT · 02 SALLE · 03 CUISINE · 04 ÉQUIPE · 05 PATRON · 06 PLATEFORME ».
  The current station's dot is filled gold with an ink label; past stations are filled ink; future
  stations are hollow and muted. A small mono ticket tag « TABLE 4 » (cream-2 paper, 2px ink border,
  6px radius) sits on the rail above the current dot; at frame start it slides from the previous
  station to the current one (0.0–0.6 s, power3). Left of the rail, at x≈96: the Atable logo mark
  (40px) + « ATABLE » in mono. This exact rail is identical in every frame that carries it.
- **Devices.** Flat, paper-like mockups: rounded rectangles with a 2px `ink` border and no shadow,
  screen corners 6–8px. Phone ≈ 430×735 (screenshots 1170×1992 fitted to the screen). Tablet
  ≈ 1040×650 (screenshots 1920×1200). Desktop window ≈ 1100×690 with a mono title bar showing the
  address (pro.atable.fr/… or console.atable.fr). Zooms are done INSIDE the device screen (the
  screenshot scales and pans under a fixed device frame) with coordinate-target-zoom; highlight
  rings are 4px rounded rectangles in the stated colour, entering with a smooth settle.
- **Stamps.** The signature prop: a rotated (−8°) rectangular or round rubber stamp in mono caps
  (« ENVOYÉE », « VALIDÉE », « PRÊTE »), 4px border in its status colour, 85% opacity fill-less,
  landing from scale 1.35 to 1 in ~0.25 s on power3 with a tiny positional settle — a stamp
  impact, never a bounce.
- **Motion grammar.** One film, one feel: long-tail power3 settles, no back/bounce/elastic, no
  breathing loops, no slow back-half pans. Reveal model: each piece of copy or UI appears on its
  beat in the frame's Scene timing below — never all at t=0. Only aliveness during holds: live UI
  internals (a timer ticking, a caret blinking) or a subtle low-amplitude jitter. Seams inside a
  frame are velocity-matched (cut-catalog.md). All motion lives in the paused GSAP timeline.
- **Rhythm / held frames.** Busy demo frames 03–06 alternate with two deliberate breathers: frame 07
  (calm split, held from 1.6 s) and the last 1.5 s of frame 08. Frame 11 holds still for its last
  2 s as the end card.
- **Layout.** Copy sits in the left 40% (x 120–760), the device or screen in the right 55%;
  content stays inside y 110–896 (bottom 17% caption band kept clear even without captions).
- **Negative list.** No shadows, no gradients, no glassmorphism, no bokeh, no purple/blue « AI »
  glow, no emoji, no stock icons standing in for real screens, no invented marketing statistics,
  no real PIN codes or passwords, no browser chrome other than the mono title bar, no cursor in the
  phone frames (touch is a tap ripple), no « chiffre d'affaires » (say « montant commandé »).
  Failure modes to avoid: slideshow (everything dumped then frozen) and screensaver (everything
  floating independently).

## Frame 1 — Vendredi soir

- scene: Friday 20:30 rush told in big serif lines while waiting-table tags pile up around them
- voiceover: "Vendredi, vingt heures trente. Salle pleine. Tout le monde vous fait signe."
- duration: 6s
- transition_in: cut
- status: animated
- src: compositions/frames/01-vendredi-soir.html
- type: hook
- persuasion: Pain validation
- beat: tension + urgency
- blueprint: kinetic-type-beats (Adapt)
- asset_candidates:
- focal: typography
- roles: none — pure typography
- sfx: clock-tick under 0–3.5 s; soft pop on each waiting tag; low hit at 3.5 s
- on_screen: « VENDREDI · 20:30 » / « Salle pleine. » / « Tout le monde vous fait signe. » / tags « TABLE 7 — ATTEND 12 MIN », « TERRASSE 2 — ATTEND 9 MIN », « BAR — ATTEND 6 MIN », « TABLE 12 — ATTEND 15 MIN », « TABLE 3 — « ON PEUT COMMANDER ? » » / « Et votre équipe court. »

narrativeRole: name the owner's real pain in their own words before any product appears.
keyMessage: at rush hour, ordering is the bottleneck.

Adapt: keep the kinetic-type signature (statements land alone, swapping in place by hard cut); add a pile-up of mono waiting tags so the pain accumulates.
Scene 1 (0.0–1.5s): cream ground. Mono label « VENDREDI · 20:30 » appears top-left of centre at 0.0 (word-by-word reveal); at 0.5 the display line « Salle pleine. » lands centered, large (≈ display-hero), smooth settle.
Scene 2 (1.5–3.5s): hard-cut word-swap (discrete-text-sequence) to « Tout le monde vous fait signe. » at 1.5; from 2.0 the five mono waiting tags (cream-2 paper, 2px ink border) pop in one per beat (2.0, 2.5, 3.0, 3.5 …) at scattered positions around the line, each with a smooth scale-in settle (no overshoot) and a tiny tilt — they start to crowd the text (overwhelm, deterministic positions by index).
Scene 3 (3.5–6.0s): at 3.5 the ground flips to green in one hard cut; the tags stay (now cream on green); the line swaps to « Et votre équipe court. » in cream; at 4.0 the tags slide slightly inward (closing in toward the centre by ~6%) and hold; subtle jitter only. Frame exits on the harness transition.

## Frame 2 — La promesse

- scene: a kitchen ticket prints out of a slot and becomes the Atable lockup
- voiceover: "Et si chaque table pouvait commander toute seule ? Voici À table."
- duration: 6s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/02-la-promesse.html
- type: product_intro
- persuasion: Future pacing
- beat: curiosity → relief
- blueprint: logo-assemble-lockup (Adapt)
- asset_candidates: assets/atable-logo.svg — Atable app icon (green square, plate, fork, knife, gold centre)
- focal: assets/atable-logo.svg
- roles: atable-logo = cutout (printed at the top of the ticket, then grows into the lockup)
- sfx: thermal-printer burst 0.0–1.6 s; soft stamp at 3.0 s; riser 3.6–4.6 s
- on_screen: ticket lines « ATABLE », « TABLE 4 », « COMMANDE N° 001 », « 1 × TACOS 2 VIANDES », « 1 × LIMONADE », « NOTE : SAUCE À PART SVP » / headline « Et si chaque table commandait toute seule ? » / lockup « Atable » + « La commande à table. » / mono « QR CODE · NFC · SANS APPLI · SANS COMPTE »

narrativeRole: land the promise in beat 2 and introduce the ticket that carries the whole film.
keyMessage: every table can order by itself.

Adapt: keep the lockup "comes to exist" signature, but the mark is PRINTED: a ticket feeds out of a printer slot and the logo on its header draws itself on, then the lockup settles beside it.
Scene 1 (0.0–1.6s): green ground. A dark horizontal printer slot (ink, 420px wide) sits at the top centre-right (x≈1260); a cream-2 thermal ticket (360px wide, zigzag torn bottom edge) feeds DOWN out of it in short steps synced to the printer sound; mono lines print one per beat: « ATABLE » (0.2), « TABLE 4 » (0.6), « COMMANDE N° 001 » (1.0), « 1 × TACOS 2 VIANDES » (1.2), « 1 × LIMONADE » (1.4), « NOTE : SAUCE À PART SVP » (1.6).
Scene 2 (1.6–3.0s): on the left (asymmetric 60/40) the cream headline « Et si chaque table commandait toute seule ? » reveals word by word (each word rises into place on its own beat), gold on « toute seule ».
Scene 3 (3.0–4.6s): the Atable logo at the ticket header draws itself (svg-path-draw) and a gold stamp-ring pulses once around it at 3.0; the headline clears upward (velocity-matched) and the wordmark « Atable » lands on the left at display-hero size in cream with the line « La commande à table. » beneath (3.5).
Scene 4 (4.6–6.0s): mono line « QR CODE · NFC · SANS APPLI · SANS COMPTE » types on under the tagline (discrete-text-sequence, type-on) and the frame holds; the ticket stays hanging under the slot.

## Frame 2a — La plaque

- scene: a gold metal plate tilts in from 3D perspective and lies flat; a QR sticker peels off its liner, flies over and is pressed onto it
- voiceover: "L'installation ? On s'en charge. Chaque table reçoit sa plaque en métal, et son QR code."
- duration: 6s
- transition_in: crossfade
- status: animated
- src: compositions/frames/02a-la-plaque.html
- type: feature_showcase
- persuasion: Friction reduction (« on s'en charge »)
- beat: reassurance
- focal: the gold metal plate
- sfx: whoosh 0.2 s; shimmer 1.08 s (sheen); liner whoosh 2.35 s; peel 3.0 s; flight whoosh 3.55 s; press + soft stamp 4.6 s; shimmer 5.12 s; tick 5.5 s
- handoff_out: plate flat at (970, 360) 560×360, sticker pressed at plate (170, 34), copy and callouts gone
- on_screen: installation rail 01 PLAQUE / « L'installation ? » / « On s'en charge. » / « Une plaque en métal par table, avec son QR code. » / callouts « PLAQUE MÉTAL », « AUTOCOLLANT QR · UNIQUE PAR TABLE »

Scene 1 (0.0–1.4s): cream ground, installation rail (tag « INSTALLATION » slides to 01 PLAQUE). The plate (flat metal: bevel light top-left / dark bottom-right, two light facets, a shade facet, two screws, engraved « ATABLE ») tilts in from rotationX 68° / rotationZ −16° with a 12px stepped thickness and lands flat (power3); a sheen band sweeps it (1.05). Left: « L'installation ? » (0.12).
Scene 2 (1.25–3.5s): « On s'en charge. » in gold-deep (1.25), rule (2.3). A sticker sheet (cream-2 liner, dashed die-cut) enters top-right (2.35); the sticker's corner curls back (3.0, CSS var --f), it lifts (3.25) and the liner leaves (3.45).
Scene 3 (3.5–6.0s): « Une plaque en métal par table, » (3.5); the sticker flies over the plate tilted 22° (3.55–4.55), callout PLAQUE MÉTAL (3.75); press on « et son QR code » (4.6) with a squash and a light ripple; callout AUTOCOLLANT QR (4.95); second sheen + sparkle (5.1–5.95); copy and callouts exit (5.5) so only the plate remains for the cut.

## Frame 2b — La table

- scene: the camera pulls back and orbits while a 3D table builds around the plate; the two placements (left end / right end); the plate lifts off and shows its three finishes
- voiceover: "Elle se place au bord de la table, à gauche ou à droite. Trois finitions au choix : rose, argenté ou doré."
- duration: 8s
- transition_in: cut (matched plate)
- status: animated
- src: compositions/frames/02b-la-table.html
- type: feature_showcase
- persuasion: Choice / personalisation
- beat: wonder → control
- focal: the table seen from above, then the lifted plate
- sfx: long whoosh 0.0 s; chair pops 0.5–0.86 s; setting ticks; tick 1.62 s; glide whoosh 2.0 s + tap 2.5 s; lift whoosh 2.85 s; swatch pops 3.45 s; shimmer on each finish 4.45 / 5.1 / 5.62 s; descend whoosh 6.7 s; tap 7.45 s
- handoff_out: top-down table (camera s 0.62 at 1250, 560), gold plate at the right end, no copy
- on_screen: installation rail 02 TABLE / « Au bord de la table. » / « À gauche ou à droite. » / labels « À GAUCHE », « OU À DROITE » / « Trois finitions. » / swatches « ROSE · ARGENTÉ · DORÉ »

3D rig: cam (screen anchor + rotationX) > spin (rotationZ + scale/scaleZ) > off (−target), z = 0 on the table top so the first frame matches 02a exactly. Table 900×520 with 16px thickness, four legs, four chairs with backrests, four place settings; the plate is 560×360 at scale 0.25, centred at x = −360 (left end) or +360 (right end). Opacity is only ever animated on leaves, never on preserve-3d groups.
Scene 1 (0.0–1.6s): from the plate full frame the camera pulls back (s 4 → 0.86) while tilting to 56° and spinning −24° then settling at a 30° high angle; the table fades in under the plate, chairs drop in one per beat, settings pop. Left: « Au bord de la table. » (0.15).
Scene 2 (1.55–2.9s): « À gauche ou à droite. » (1.55); dashed gold-deep outline + « À GAUCHE » on the left end (1.62); the plate glides to the right end with a small lift (2.0–2.5), outline + « OU À DROITE » (2.05).
Scene 3 (2.85–6.3s): the plate lifts off toward the camera (a 2D hero copy takes over from the world plate) and settles above the table at 0.8 scale while the table recedes (s 0.78, 36°). « Trois finitions. » (3.05) and three swatch tiles (3.45). On each spoken word the plate's finish wipes across with a sheen at the wipe front and its swatch lifts with a green ring: rose (4.45), argenté (5.1), doré (5.62); sparkle (6.05).
Scene 4 (6.5–8.0s): copy exits; the camera returns to a straight top-down view while the hero plate lands back on the right end (7.45).

## Frame 2c — La tablette

- scene: the camera pulls back from table 4 to the whole room; the provided tablet slides in; every plate is linked to it by a gold trace along the aisle; orders pulse in
- voiceover: "Et on vous fournit la tablette, reliée à tous vos QR codes. Les commandes y arrivent en direct."
- duration: 6s (scene 6.5 s for the crossfade into frame 3)
- transition_in: cut (matched table, ground flips to green)
- status: animated
- src: compositions/frames/02c-la-tablette.html
- type: feature_showcase
- persuasion: System proof
- beat: control
- focal: the tablet (pro-salle) and the traces
- sfx: long whoosh 0.0 s; tablet whoosh 0.3 s; table pops 0.85–1.17 s; port pop 1.5 s; trace ticks 1.6–2.25 s; pulse blips 3.2–4.12 s; notifications 3.88 s and 4.43 s; riser 4.6 s into frame 3
- on_screen: installation rail 03 TABLETTE / « La tablette, fournie. » / « RELIÉE À TOUS VOS QR CODES » / table numbers 1–6 / « NOUVELLE COMMANDE · TABLE 2 », « NOUVELLE COMMANDE · TABLE 6 » / « LES COMMANDES ARRIVENT EN DIRECT »

Scene 1 (0.0–1.3s): green ground; table 4 continues from 02b (chairs now cream) and the camera pulls back to a 3×2 floor plan in the left column (tables 1–6, plates at alternating ends, all gold); the film's tablet (1060×690 at 0.72, pro-salle) slides in from the right. « La tablette, fournie. » (0.1 / 0.55).
Scene 2 (1.45–2.9s): « RELIÉE À TOUS VOS QR CODES » types on; a gold port appears on the tablet's left edge; one gold trace per plate drops to the central aisle, runs along it like a bus and curves into the port (stroke-dashoffset draw, staggered).
Scene 3 (3.2–6.0s): « LES COMMANDES ARRIVENT EN DIRECT »; light pulses travel along the traces into the tablet, the port rings on each arrival; « NOUVELLE COMMANDE · TABLE 2 » (3.88) with an orange ring on the « À valider » column, then « … TABLE 6 » (4.43); hold.

## Frame 3a — La salle (3D réaliste)

- scene: back to the Friday rush in a photoreal 3D restaurant — the floor plan seen from above becomes a real dining room; the camera cranes down to table 4 where a customer takes his phone and scans the gold plate; the camera enters the phone screen
- voiceover: "Retour au vendredi soir. À la table quatre, un client sort son téléphone, et vise la plaque."
- duration: 8s (scene 8.5 s for the crossfade into frame 3)
- transition_in: crossfade (from the 2D floor plan of 02c)
- status: animated
- src: compositions/frames/03a-la-salle.html — plays assets/video/03a-la-salle.mp4 (Blender 4.5 LTS, Cycles, 255 frames at 30 fps, rendered 1600×900 and scaled to 1080p); the pipeline (scene, retargeting, camera, phone screen) lives in .hyperframes/salle-3d/
- type: simulation
- persuasion: Show-don't-tell (a real customer, a real table)
- beat: immersion → ease
- focal: table 4's customer, his phone and the plate
- sfx: restaurant murmur + cutlery clinks 32–40 s; whoosh 0.9 s (crane); tap 3.85 s (phone); scan beeps 5.05 s; shimmer + pop 5.6 s (QR recognised); whoosh 6.3 s (into the screen)
- on_screen: tag « VENDREDI · 20:34 » (top left, HTML) / tag « TABLE 4 » pinned above table 4 (HTML, positioned per frame from the Blender camera) / in the phone: viewfinder on the plate, gold scan line, green brackets, pill « atable · Table 4 »
- credits: .hyperframes/salle-3d/CREDITS.md (Renderpeople characters and Sketchfab props, CC BY 4.0; Mixamo; Poly Haven CC0)

Look: a warm, contrasted Parisian bistro at night — herringbone parquet, dark-green panelled wainscot, cream plaster, brick behind the bar, two windows on a night street, the Atable sign (enamel logo + brass letters), a gilded mirror, the « Ardoise du jour », brass pendants over every table, wall sconces, candles, plants, a green bar with marble top, beer taps, lit bottle shelf and the staff tablet. Same six tables and plate ends as the 02c floor plan (table 4 front left); each plate is gold metal with its cream QR sticker « TABLE n » and the engraved « A T A B L E ». A packed Friday night: thirty-three photoreal people (Renderpeople scans) driven by motion capture — every chair taken (table 4 keeps only the customer and his friend), customers waiting standing by the entrance and at the end of the bar, three at the counter. The staff is overwhelmed: one waiter in waistcoat and white apron hurries across the aisle with a tray on his shoulder (walk played 30 % faster) glancing at three diners who raise their hand to call him, while the second waiter serves table 1 (takes two plates from his tray and sets them down; the diners turn to him). The customer of table 4 (sitting idle, right arm in IK on the phone, head following the screen; grip solved against the deformed mesh, no finger through the phone) and his friend who turns to look. Front and right walls and the ceiling are invisible to the camera (cut-away seen from above on the brand-green ground).
Scene 1 (0.0–2.4s): top-down view = the floor plan; « VENDREDI · 20:34 » tag; the camera cranes down and orbits to a high 3/4 view; diners talk, laugh and drink, the waiter crosses the aisle with his tray.
Scene 2 (2.2–5.0s): « TABLE 4 » tag pinned over the table; dolly to table 4 (2.4–3.7) then over the shoulder; the customer reaches for his phone lying on the table (3.35), lifts it to look at it (3.85–4.55) and holds it over the plate (4.85–5.45).
Scene 3 (5.0–8.5s): on the screen the gold scan line sweeps the QR (5.05), the brackets turn green (5.6) and the pill « atable · Table 4 » appears (5.7); the camera pushes into the screen (6.2–7.9) until the plate's QR fills the frame, crossfade into frame 3.

## Frame 3 — Un scan

- scene: the phone scans the QR sticker on table 4's gold metal plate (installed in 02a–02c) and the menu opens; zoom on price and allergens
- voiceover: "Un scan, et la carte s'ouvre. Pas d'appli, pas de compte."
- duration: 6s
- transition_in: crossfade
- status: animated
- src: compositions/frames/03-un-scan.html
- type: feature_showcase
- persuasion: Friction reduction
- beat: ease
- blueprint: device-surface-showcase (Adapt)
- asset_candidates: assets/client-carte.png — the Bistrot menu for Table 4 with prices and allergen badges; assets/table-qr.svg — QR code on the table 4 sticker
- focal: assets/client-carte.png
- roles: client-carte = cutout (inside the phone screen) · table-qr = supporting (on the cream QR sticker of the gold plate)
- sfx: whoosh at 0.3 s; scanner double-beep at 1.4 s; soft tick at 3.5 s and 4.5 s
- handoff_out: phone — centre x 1250, y 520, scale 1, opacity 1, static (no motion at the cut), screen showing client-carte at its top (no zoom)
- on_screen: rail station 01 CLIENT / « Un scan. » / « Pas d'appli. Pas de compte. » / « La carte du moment, prix et allergènes compris. » / callouts « PRIX » and « ALLERGÈNES · LAIT, CÉLERI »

narrativeRole: show how simple the customer's first step is.
keyMessage: one scan opens the right menu, no download, no account.

Adapt: keep the stepwise cursorless flow inside the held phone (setup → result), bookended by copy on the left; the "setup" step is the scan of the physical gold plate (same plate as 02a–02c).
Scene 1 (0.0–1.4s): cream ground, ticket rail (tag slides to « 01 CLIENT »). Right side: table 4's gold metal plate (560×360, flat bevel, facets, screws, engraved « ATABLE ») with its cream QR sticker « TABLE 4 » lies at x≈1250 (seen from above, no table line); the phone rises from below (0.3, power3) and settles in front of the tent at centre x 1250; inside the phone screen a camera view shows the gold plate and the QR sticker with four corner brackets; a gold scan line sweeps once (0.8–1.3). Left: « Un scan. » lands at display size (0.5).
Scene 2 (1.4–3.0s): at 1.4 the brackets snap green and the screen wipes up into client-carte (Le Bistrot Démo · Table 4) — inverse zoom-through seam; the tent slides out of view behind the phone. Left: « Pas d'appli. Pas de compte. » reveals in body serif (2.0).
Scene 3 (3.0–4.5s): coordinate-target-zoom inside the screen onto the first item card « Velouté du moment » (image region [30,800,1140,1130]); at 3.5 a ring lands on the price [45,980,210,1045] with a mono callout « PRIX » outside the phone (left of it, joined by a 2px hairline).
Scene 4 (4.5–6.0s): a second ring lands on the allergen badges [960,820,1125,900] with the callout « ALLERGÈNES · LAIT, CÉLERI » (4.5); left copy adds « La carte du moment, prix et allergènes compris. » (5.0); the zoom eases back to the top of the menu by 5.8 so the phone matches the handoff (rings fade with it).

## Frame 4 — Il compose, il envoie

- scene: options ticked, a note typed for the kitchen, send pressed, the confirmation stamped
- voiceover: "Votre client choisit ses options, ajoute une précision pour la cuisine, et envoie. Le paiement, lui, se fait au comptoir."
- duration: 8s
- transition_in: crossfade
- status: animated
- src: compositions/frames/04-il-compose.html
- type: feature_showcase
- persuasion: Show-don't-tell proof
- beat: ease + control
- blueprint: device-surface-showcase (Adapt)
- asset_candidates: assets/client-produit.png — product sheet Tacos 2 viandes with options and « Ajouter · 9,50 € »; assets/client-panier.png — cart with the note « Sauce à part svp » and total 14,50 €; assets/client-confirmation.png — « Commande envoyée ✓ N° 001 », paiement au comptoir
- focal: assets/client-panier.png
- roles: client-produit = cutout (phone screen, step 1) · client-panier = cutout (phone screen, step 2) · client-confirmation = cutout (phone screen, step 3)
- sfx: tap at 0.9 s and 1.4 s; key ticks 2.9–4.4 s; press at 5.0 s; whoosh at 5.3 s; stamp at 6.0 s
- handoff_in: phone — centre x 1250, y 520, scale 1, opacity 1, static at the cut
- handoff_out: phone — centre x 1250, y 520, scale 1, opacity 1, static, screen showing client-confirmation
- on_screen: rail station 01 CLIENT / « Il compose son plat. » / « Une précision pour la cuisine ? » / « Envoyé. » / « Le paiement se fait au comptoir. » / stamp « ENVOYÉE · N° 001 »

narrativeRole: prove that ordering is complete, precise and fast for the customer.
keyMessage: options, notes and sending — in three taps.

Adapt: keep the stepwise flow inside the held phone, capped by a confirming press; the confirmation is sealed by the film's first stamp.
Scene 1 (0.0–2.5s): phone held at the handoff position; screen shows client-produit; coordinate-target-zoom onto the meat options (Poulet [50,935,330,1020], Kebab [50,1080,330,1165]); tap ripples at 0.9 and 1.4 make each tick appear (a cream mask over the checkbox lifts away). Left: « Il compose son plat. » (0.5).
Scene 2 (2.5–5.0s): velocity-matched swipe to client-panier (2.5); zoom onto the note box [40,1225,1130,1462] where « Sauce à part svp » types on with a caret (2.9–4.4, discrete-text-sequence type-on). Left: « Une précision pour la cuisine ? » (3.0).
Scene 3 (5.0–6.5s): zoom eases back; press-release-spring on « Envoyer ma commande » [48,1800,1122,1943] at 5.0; screen slides to client-confirmation (5.3); at 6.0 a gold stamp « ENVOYÉE · N° 001 » hits across the phone's upper screen (stamp grammar). Left: « Envoyé. » (5.5) then mono « LE PAIEMENT SE FAIT AU COMPTOIR » (6.0).
Scene 4 (6.5–8.0s): hold, the stamp settled; the phone ends exactly at the handoff_out state.

## Frame 5 — En salle, en moins de 3 secondes

- scene: the order lifts off the phone, flies to the room tablet and lands in « À valider »; one tap validates it
- voiceover: "En moins de trois secondes, la commande arrive en salle. Validée d'un geste."
- duration: 6s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/05-en-salle.html
- type: feature_showcase
- persuasion: Speed proof
- beat: relief + control
- blueprint: camera-journey (Adapt)
- asset_candidates: assets/client-confirmation.png — confirmation screen N° 001 on the phone; assets/pro-salle.png — room board with À valider / En préparation / Prêtes columns
- focal: assets/pro-salle.png
- roles: pro-salle = cutout (tablet screen) · client-confirmation = supporting (small phone at left, leaves the frame)
- sfx: whoosh 0.2–1.0 s; notification chime at 1.0 s; press at 3.0 s; stamp at 3.4 s
- handoff_out: tablet — centre x 1190, y 520, scale 1, opacity 1, static, screen showing pro-salle at full view
- on_screen: rail station 02 SALLE / « En salle en moins de 3 secondes. » / mono « NOUVELLE COMMANDE · TABLE 4 » / « Validée d'un geste. » / stamp « VALIDÉE »

narrativeRole: show the cause→effect from the customer's tap to the team's screen.
keyMessage: the order reaches the room instantly and is validated in one gesture.

Adapt: keep sub-shape A (action roundtrip): the send fires on the phone, the camera travels to where the consequence renders; here the travel is a card flight from phone to tablet.
Scene 1 (0.0–1.0s): ticket rail (tag slides 01 → 02 SALLE). A small phone (≈55% scale) showing client-confirmation sits at left x≈330; a mono order card « N° 001 · TABLE 4 · 14,50 € » (cream-2, ink border) lifts off its screen and flies right along an arc with a motion-blur streak (motion-blur-streak) toward the tablet, which slides in from the right to centre x 1190 (power3); the phone slides out left.
Scene 2 (1.0–2.6s): the card lands on the À valider column of pro-salle (aligned over the region [384,277,875,781]) and dissolves into the real card; an orange ring settles on that column; mono callout « NOUVELLE COMMANDE · TABLE 4 » above the tablet. Left copy: « En salle en moins de 3 secondes. » (1.0, per-word reveal).
Scene 3 (2.6–4.2s): coordinate-target-zoom onto the « Valider » button [412,672,668,753]; press-release-spring at 3.0; a green stamp « VALIDÉE » lands over the card at 3.4.
Scene 4 (4.2–6.0s): zoom eases back to the full board; left copy « Validée d'un geste. » (4.5); hold at the handoff state.

## Frame 6 — La cuisine voit tout

- scene: dark kitchen board on the tablet, live timers, PRÊTE pressed, the room is notified
- voiceover: "En cuisine, chaque commande a son minuteur. Elle est prête ? La salle est prévenue."
- duration: 6s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/06-la-cuisine.html
- type: feature_showcase
- persuasion: Show-don't-tell proof
- beat: control + calm
- blueprint: device-surface-showcase (Adapt)
- asset_candidates: assets/pro-cuisine.png — dark kitchen board with timers and PRÊTE buttons
- focal: assets/pro-cuisine.png
- roles: pro-cuisine = cutout (tablet screen)
- sfx: soft clock ticks 0.5–3.5 s; press at 3.5 s; counter-bell ding at 3.8 s; stamp at 3.8 s
- handoff_in: tablet — centre x 1190, y 520, scale 1, opacity 1, static at the cut
- on_screen: rail station 03 CUISINE / « La cuisine voit tout. » / mono « CHAQUE COMMANDE A SON MINUTEUR » / « Prête ? La salle est prévenue. » / stamp « PRÊTE »

narrativeRole: show that preparation is organised and visible minute by minute.
keyMessage: the kitchen follows every order; one tap tells the room it is ready.

Adapt: keep the held device whose screen advances; the advance is the timer running and the PRÊTE press.
Scene 1 (0.0–1.5s): green ground (gravity), ticket rail in cream on green (tag slides 02 → 03 CUISINE). The tablet holds at the handoff position showing pro-cuisine; both timers tick live (overlay digits over [414,341,580,405] and the second card's timer, counting up one second per second from 00:10 and 00:09). Left: « La cuisine voit tout. » in cream (0.5).
Scene 2 (1.5–3.5s): coordinate-target-zoom onto card 1 [384,252,740,674]; a gold ring on its timer; mono callout « CHAQUE COMMANDE A SON MINUTEUR » (2.0).
Scene 3 (3.5–6.0s): press-release-spring on « PRÊTE » [418,550,708,644] at 3.5; at 3.8 a green stamp « PRÊTE » lands on the card and a small mono toast « TABLE 4 · PRÊTE À SERVIR » slides in at the tablet's top-right; left copy « Prête ? La salle est prévenue. » (4.0); zoom eases back by 5.5 and holds.

## Frame 7 — Une équipe, des rôles

- scene: two cards side by side — team login by personal code, and the live table map
- voiceover: "Chacun a son code, et chaque table son état."
- duration: 4s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/07-une-equipe.html
- type: benefit_highlight
- persuasion: Rule of two (paired capabilities)
- beat: trust + control
- blueprint: comparison-split (Reproduce)
- asset_candidates: assets/pro-pin.png — « Qui êtes-vous ? » team login on an enrolled tablet; assets/pro-tables.png — table map coloured by state
- focal: assets/pro-tables.png
- roles: pro-pin = cutout (left card) · pro-tables = cutout (right card)
- sfx: whoosh at 0.0 s (two wings); pop at 1.6 s and 1.9 s
- on_screen: rail station 04 ÉQUIPE / left label « UN CODE PAR PERSONNE », badge « Tablette autorisée » / right label « CHAQUE TABLE, SON ÉTAT », badge « Qui attend quoi » / headline « Chacun son rôle. »

narrativeRole: reassure the owner that the team is organised and accountable.
keyMessage: each employee logs in with their own code; the table map shows who is waiting for what.

Scene 1 (0.0–1.6s): cream ground, rail (tag slides 03 → 04 ÉQUIPE). Two cards (≈ 820×520, 2px ink border, 8px radius) enter from opposite wings with mirrored book-open tilts (split-tilt-cards) and settle flat: left shows the pro-pin crop around the avatars (« Qui êtes-vous ? » with Léa, Mehdi, Sofia), right shows pro-tables (orange and blue table tiles). Mono labels above each card: « UN CODE PAR PERSONNE » / « CHAQUE TABLE, SON ÉTAT ». Headline « Chacun son rôle. » centered above the cards (0.5).
Scene 2 (1.6–4.0s): inner-edge pill badges spring-pop (smooth) on each card: « Tablette autorisée » (1.6, green) and « Qui attend quoi » (1.9, orange/blue dots); then hold still (breather).

## Frame 8 — Et vous, vous pilotez

- scene: four feature tiles assemble, each a real crop of the owner's space
- voiceover: "Et vous, vous pilotez tout : la carte, les horaires, les QR codes, et les couleurs de votre établissement."
- duration: 8s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/08-vous-pilotez.html
- type: feature_showcase
- persuasion: Value stacking
- beat: power + ease
- blueprint: grid-card-assemble (Adapt)
- asset_candidates: assets/patron-carte.png — menu editor with the product form; assets/patron-horaires.png — menus and time slots with the week view; assets/patron-qr.png — table QR code with SVG/PNG downloads; assets/patron-theme.png — theme presets and live phone preview
- focal: assets/patron-carte.png
- roles: patron-carte = supporting (tile 1) · patron-horaires = supporting (tile 2) · patron-qr = supporting (tile 3) · patron-theme = supporting (tile 4)
- sfx: whoosh at 0.0 s; pop at 1.5, 2.7, 3.9 and 5.1 s
- on_screen: rail station 05 PATRON / headline « Et vous, vous pilotez. » / tiles « VOTRE CARTE » — « Produits, options, photos, 14 allergènes » · « MIDI, SOIR » — « Chaque carte à son heure » · « QR CODES ET NFC » — « Prêts à imprimer » · « VOS COULEURS » — « Le site prend votre style »

narrativeRole: show the owner controls everything without a technician.
keyMessage: menu, schedules, QR codes and branding — all in the owner's hands.

Adapt: keep the staggered self-assembling grid; tiles are 2×2 real screenshot crops with mono titles, assembled one per 1.2 s instead of a fast cascade.
Scene 1 (0.0–1.5s): cream ground, rail (tag slides 04 → 05 PATRON). Headline « Et vous, vous pilotez. » at headline-xl on the left third (0.3, per-word reveal).
Scene 2 (1.5–6.5s): a 2×2 grid of tiles (each ≈ 520×300, cream-2 fill, 2px green border, 6px radius) on the right two-thirds assembles one tile per 1.2 s, each sliding up into its slot with a smooth settle: (1.5) patron-carte cropped on the product form [1081,182,1779,1125] — « VOTRE CARTE » / « Produits, options, photos, 14 allergènes »; (2.7) patron-horaires cropped on the week view [320,1250,1778,1830] — « MIDI, SOIR » / « Chaque carte à son heure »; (3.9) patron-qr cropped on the QR [300,560,700,960] — « QR CODES ET NFC » / « Prêts à imprimer »; (5.1) patron-theme cropped on presets + preview [341,140,1776,940] — « VOS COULEURS » / « Le site prend votre style ». Each tile's screenshot does a short coordinate-target-zoom (1.0 → 1.08) as it lands, then stops.
Scene 3 (6.5–8.0s): all four tiles held still; a gold 2px rule underlines the headline (6.5). Breather.

## Frame 9 — Les chiffres qui comptent

- scene: the owner's dashboard, its key figures counting up, then the rush heatmap
- voiceover: "Le tableau de bord vous montre l'essentiel : montant commandé, panier moyen, heures de rush."
- duration: 6s
- transition_in: crossfade
- status: animated
- src: compositions/frames/09-les-chiffres.html
- type: feature_showcase
- persuasion: Show-don't-tell proof
- beat: clarity + confidence
- blueprint: dataviz-countup (Adapt)
- asset_candidates: assets/patron-tableau-de-bord.png — dashboard with montant commandé, panier moyen, rush heatmap, top products
- focal: assets/patron-tableau-de-bord.png
- roles: patron-tableau-de-bord = cutout (desktop window, then zoom targets)
- sfx: whoosh at 0.2 s; fast ticks during count-ups 1.0–1.8 s and 2.5–3.2 s; soft hit at 4.0 s
- on_screen: rail station 05 PATRON / « Les chiffres qui comptent. » / « 27 019,10 € » + mono « MONTANT COMMANDÉ · 30 JOURS » / « 30,05 € » + mono « PANIER MOYEN » / mono « VOS HEURES DE RUSH » / mono small « EXEMPLE · DONNÉES DE DÉMONSTRATION »

narrativeRole: show the owner gets clear numbers to decide, not a spreadsheet.
keyMessage: montant commandé, panier moyen, rush hours — at a glance.

Adapt: keep the push-THROUGH onto one hero metric with count-ups; the figures are the dashboard's own demo values (counted up as UI overlays), labelled as demo data.
Scene 1 (0.0–1.0s): green ground, rail in cream. A desktop window (title bar « pro.atable.fr/bistrot/tableau-de-bord ») enters slightly tilted and flattens (power3) on the right; left headline « Les chiffres qui comptent. » in cream (0.3).
Scene 2 (1.0–2.5s): the camera pushes THROUGH (coordinate-target-zoom) onto the KPI « Montant commandé validé » [321,336,672,503]; a large overlay figure counts up 0 → « 27 019,10 € » (counting-dynamic-scale) on the left in cream display, mono label « MONTANT COMMANDÉ · 30 JOURS » under it.
Scene 3 (2.5–4.0s): pan to KPI « Panier moyen » [1058,336,1410,503]; the overlay swaps (velocity-matched) to « 30,05 € » counting up, label « PANIER MOYEN ».
Scene 4 (4.0–6.0s): pull back and pan down to the rush heatmap [321,1190,1778,1546]; mono callout « VOS HEURES DE RUSH » with a gold ring on the darkest evening cells; mono small « EXEMPLE · DONNÉES DE DÉMONSTRATION » bottom-left; hold.

## Frame 10 — Tous vos commerces, en confiance

- scene: one phone pinned while its theme switches from the Bistrot to the Lounge; trust lines cycle beside it
- voiceover: "Plusieurs commerces ? Un seul outil, et des données protégées."
- duration: 6s
- transition_in: blur-crossfade
- status: animated
- src: compositions/frames/10-en-confiance.html
- type: benefit_highlight
- persuasion: Risk reversal
- beat: trust + peace of mind
- blueprint: fixed-anchor-cycle (Adapt)
- asset_candidates: assets/client-carte.png — Bistrot menu (light theme); assets/client-lounge.png — Lounge menu (dark purple theme); assets/console-commerces.png — platform console listing the shops
- focal: assets/client-lounge.png
- roles: client-carte = cutout (phone screen, state A) · client-lounge = cutout (phone screen, state B) · console-commerces = background (desktop card behind the phone, dim ~40%)
- sfx: soft swish at 1.0 s (theme morph); tick at 2.0, 3.0, 4.0, 5.0 s
- on_screen: rail station 06 PLATEFORME / anchor « Un outil. Tous vos commerces. » / cycling lines « Chaque commerce, ses données. » · « Les prix calculés par le serveur. » · « Double authentification pour les patrons. » · « Paiement au comptoir. » / resolve « Sécurisé par conception. »

narrativeRole: remove the last objections (chains, security, payment) before the ask.
keyMessage: one platform for every venue, each with its own look and its own protected data.

Adapt: keep the pinned anchor that never moves while the adjacent region cycles; the phone is pinned and its theme morphs once, while the trust lines cycle in one slot and resolve on an emphasis line.
Scene 1 (0.0–1.0s): cream ground, rail (tag slides 05 → 06 PLATEFORME). The phone is pinned at x≈1250 showing client-carte; behind it, offset up-right and dimmed, a desktop card with console-commerces (title bar « console.atable.fr »). Left anchor « Un outil. Tous vos commerces. » (0.2, per-word).
Scene 2 (1.0–1.6s): theme-crossfade-morph: the phone screen morphs from client-carte to client-lounge (purple) while the phone itself never moves; mono label under the phone swaps « LE BISTROT DÉMO » → « LE LOUNGE DÉMO ».
Scene 3 (2.0–5.0s): under the anchor, one slot cycles by hard-cut token swaps (discrete-text-sequence), each with a gold check: « Chaque commerce, ses données. » (2.0) → « Les prix calculés par le serveur. » (3.0) → « Double authentification pour les patrons. » (4.0) → « Paiement au comptoir. » (5.0 — briefly).
Scene 4 (5.0–6.0s): at 5.5 the slot resolves on « Sécurisé par conception. » in green display weight with a gold rule; hold.

## Frame 11 — Atable

- scene: the end card — logo lockup, the promise, the call to action
- voiceover: "À table ! Vos clients commandent, votre équipe sert. Demandez une démo."
- duration: 6s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/11-atable.html
- type: cta
- persuasion: Inevitability
- beat: confidence + urgency-to-act
- blueprint: logo-assemble-lockup (Adapt)
- asset_candidates: assets/atable-logo.svg — Atable app icon
- focal: assets/atable-logo.svg
- roles: atable-logo = cutout (centre lockup)
- sfx: swell 0.0–1.0 s; final hit at 1.0 s; soft pop at 2.5 s
- on_screen: « Atable » / « Vos clients commandent. » / « Votre équipe sert. » / CTA pill « Demandez une démo » / mono « QR CODE · NFC · PAIEMENT AU COMPTOIR »

narrativeRole: close on the brand and one clear next step.
keyMessage: Atable — customers order, the team serves; ask for a demo.

Adapt: keep the lockup drawing itself in on a cleared stage, extended to an end card with the CTA.
Scene 1 (0.0–1.0s): green ground, no rail. The logo mark draws itself centered (svg-path-draw: plate ring, then fork and knife, then the gold centre fills) and settles at ≈200px; at 1.0 the wordmark « Atable » lands below it at display-hero size in cream.
Scene 2 (1.0–2.5s): « Vos clients commandent. » (1.5) and « Votre équipe sert. » in gold (2.0) reveal per-word under the wordmark.
Scene 3 (2.5–6.0s): a gold pill « Demandez une démo » (ink text) spring-pops smoothly under the lines (2.5); mono « QR CODE · NFC · PAIEMENT AU COMPTOIR » types on below (3.0); hold still to the end; the whole card fades out over the last 0.4 s (final frame exit).
