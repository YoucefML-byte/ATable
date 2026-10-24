# Frame packet: 05-en-salle

## Project inputs

- Project: /tmp/claude-0/-home-user/d9c86248-a27b-5219-a42c-2417fcd3c9d6/scratchpad/videos/atable-promo
- Design tokens: /tmp/claude-0/-home-user/d9c86248-a27b-5219-a42c-2417fcd3c9d6/scratchpad/videos/atable-promo/frame.md
- RULES_DIR: /root/.claude/skills/hyperframes-animation/rules

## Assigned storyboard block

## Frame 5 — En salle, en moins de 3 secondes

- scene: the order lifts off the phone, flies to the room tablet and lands in « À valider »; one tap validates it
- voiceover: ""
- duration: 6s
- transition_in: push-slide LEFT
- status: outline
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

## Selected blueprint: camera-journey

# camera-journey — Camera Journey

**intent**: The real viewport camera is the STORYTELLER — a multi-leg journey (dive in → a mid-journey beat fires → travel to the consequence / reposition → landing push, at rest) across ONE continuous world, where the travel itself carries the narrative. Two folded sub-shapes: **(A) action roundtrip** — the camera dives into a UI panel, a cursor/typed action fires, and the camera swoops/pans to another region where the consequence renders as element motion; **(B) cursorless flight** — pure cinematic 3D flight (motion blur, depth-of-field, tilt-to-flatten rotations) over static or self-animating content, no cursor anywhere.

**boundary**: This is NOT `cursor-ui-demo` — there the camera _chases_ the cursor (a servo following the actor); here the camera IS the actor, moving on its own narrative motivation, and in sub-shape A the cursor acts only at the leg hinge (in B it never appears). This is NOT `device-surface-showcase` — there one DEVICE/surface is hero and the camera merely presents it; here no single surface is hero — the journey traverses multiple regions/panels/depth planes and the traversal is the story. This is NOT `spatial-pan-stations` — there pre-placed stations on a flat canvas are visited by repeated pans of the same type; here the legs are heterogeneous (push-in, swoop, pull-back-rotate, whip, dive) and each leg is _motivated_ (by a fired action, or by the reveal it lands on).

**roles served**

- Benefits (from `camera-swoop-panel-action-roundtrip`): when the benefit IS a cause→effect round trip — "do this small thing here, get this big thing there" (comment → chart morphs; agent finding → verified commit; chat message → receipt + ledger). The camera physically connects the action to its payoff, so the viewer _travels_ the value chain instead of being told it.
- Key_Feature (from `cursorless-camera-flight`): when the feature should feel cinematic and inevitable — a payout form or a generated content-plan calendar explored by a flying camera (dives, whip sweeps, tilt-to-flatten, violent final push onto the CTA/hero card), the content acting by itself (a dropdown self-selects; keyword cards simply exist in depth) with no hand on the wheel.

**duration**: 5.6–11.1s (sub-shape A 5.6–9.0s: 001 5.6s · 066 8.6s · 004 9.0s; sub-shape B 6.3–11.1s: Outrank 6.3s · 094 11.1s)

**shot structure** (one oversized `[world]` — a `[UI canvas: design tool / GitHub + agent panels / phone + desktop ledger]` (A) or a `[3D-laid-out space: floating form card / calendar grid with standing keyword cards]` (B) — wrapped by a single virtual camera; content animates as elements _inside_ the world while the camera travels; every leg is a sequential tween on the same camera state)

- **Scene 0 (optional, 0.0–~1.8s) — static prologue.** Camera locked on a `[prologue beat: static promo card with a floating 3D product card / typed headline with an accent word / wide establishing shot of the app]`. A typewriter line may finish (`[headline]` types on, accent word in `[accent color]`). The prologue BREAKS by a hard cut or by the headline shrinking and slipping away as the first dive begins — the stillness exists to make the journey's launch land.

- **Scene 1 (~0.5–2.0s) — LEG 1: dive in.** The camera pushes in FAST and TIGHT onto `[the focal element]`:
  - _Sub-shape A_: a flat whole-viewport push onto `[an actionable element: comment box / agent panel / chat bubble]` where `[typed text]` finishes typing or `[response text]` streams in. The header/context leaves the frame — commitment, not a polite zoom.
  - _Sub-shape B_: the push lands at an ANGLE — a tilted 3D close-up of `[the form region / the calendar grid]`, foreground elements motion-blurred during the travel, neighbors soft under depth-of-field. A huge `[foreground prop: date number / field label]` may dominate the frame, blurred by speed.

- **Scene 2 (~1.5–6.0s) — LEG 2: the mid-journey beat (the hinge).** The camera holds, drifts, or pulls slowly while the content ACTS:
  - _Sub-shape A — the action fires_: a `[cursor]` clicks `[Send / Create PR]` (or a `[message]` sends implicitly) and the acted element CLEARS/vanishes. Optional theater before the click: a `[status spinner]` cycles `[status words]`, `[to-do items]` strike through, `[response text]` streams. The click is the hinge that _motivates_ the next leg.
  - _Sub-shape B — the content self-acts_: a `[dropdown]` expands by itself (pushing `[the field below]` down), shows a `[row hover highlight]` with no cursor, and collapses with the new value selected; OR the flight decelerates INTO FOCUS on `[one card]` — its `[metrics]` sharp, neighboring cards blurred.

- **Scene 3 (~4.0–8.0s) — LEG 3: travel to the consequence / reposition.**
  - _Sub-shape A_: the camera pulls back / swoops / pans to `[region B]` while the CONSEQUENCE builds as element motion — `[bars shrink into the baseline while a node-dotted line draws left→right / a verified commit row slides into the timeline + a reaction pill pops / a receipt card expands row-by-row from a skeleton]`. An optional SECOND leg extends the trip: `[pan up-right to a toolbar → a dropdown cascades open / match cut into an extreme close-up → a fast decelerating zoom-out reveals a ledger table]`.
  - _Sub-shape B_: a repositioning move — a slow pull-back that ROTATES the world flat and centered (3D → straight-on 2D), or a heavily motion-blurred WHIP SWEEP that resolves into a flat lateral pan across `[a month calendar / the full card]`. On the flat hold, quiet element beats may play: a thin `[focus outline]` fades in around one `[field]` and sweeps down to the next; the card keeps a near-imperceptible tilt/scale drift so the hold never dies.

- **Scene 4 (final ~1–2s) — LEG 4: landing.** The journey resolves on the payoff:
  - _Sub-shape A_: the camera comes to REST; the `[cursor]` hovers or drifts toward `[the payoff: an open Export menu item / the commit link / the View-transaction button]`; ends still, on the changed state — the world is visibly different from where the trip began.
  - _Sub-shape B_: a sudden VIOLENT push-in/dive (motion-blurred) onto `[the CTA button scaled huge in frame / the hero keyword card]`, ending holding tight — or holding MID-DIVE (the last frames are still traveling; the flat overview is explicitly not the final image).

**motion vocabulary**: whole-viewport camera push-in (fast/tight and slow/subtle); camera pull-back reframe; camera pan up/right/down; dive/swoop between stacked panels; fast decelerating zoom-out to rest; sudden violent push-in onto a button scaled huge; continuous 3D flight through a card grid; dive into an angled 3D close-up; slow pull-back that rotates/flattens the world to straight-on; heavily motion-blurred whip sweep; motion blur on camera travel; depth-of-field with blurred neighbors; decelerate-into-focus; hard cut / match cut into extreme close-up; near-imperceptible tilt/scale drift on holds; typed text finishing in an input; typewriter headline; headline shrinks and slips away as the camera dives; streaming AI response text; status-word spinner cycling labels; to-do strikethrough draw; cursor click; clicked element clears/vanishes; dropdown cascades open / self-expands and collapses with a row hover highlight (displacing the field below); bar-to-line chart morph (bars shrink into the baseline while a node-dotted line draws left→right, labels persist); commit row slide-in on a timeline; reaction pill appears; skeleton→content card build; receipt/label rows expand row-by-row; thin focus outline fades in and sweeps between fields; camera drift toward a button; 3D card subtle float; cursor hover at rest.

**rule mapping**

- the multi-leg camera itself — sequential push / pull-back / pan / dive phases on one wrapper, plus the micro-drift that keeps holds alive → `multi-phase-camera` (phase sequencing + drift) over `viewport-change` (the base virtual-camera primitive: single `.world` wrapper, one `cam {scale,x,y}` state — one source of truth for every leg)
- diving TIGHT onto an off-center element (comment box, chat bubble, Send button, one keyword card) → `coordinate-target-zoom` (scale + counter-translate; measure the target, don't hand-derive — a journey amplifies centering error on every leg)
- fast decelerating zoom-out from an extreme close-up to rest (066's ledger reveal) → `coordinate-target-zoom` zoom-out variation / `multi-phase-camera` (pull phase, hard `power4.out`)
- motion blur on camera travel (dive, whip sweep, violent final push) → `motion-blur-streak` (Camera-travel carve-out — the blur envelope rides the `.world` wrapper during a leg: the world never leaves frame, the blur peaks at peak velocity and resolves sharp at each landing)
- depth-of-field on neighbors while one card is in focus; decelerate-into-focus → `depth-of-field-blur` (focal pull + blur-the-cluster-while-pushing-in are explicitly in scope; run the DoF tween at the same position as the camera leg)
- the 3D flight itself (sub-shape B's core) — a perspective camera traveling with `rotateX/rotateY/translateZ` through a 3D-laid-out world: the dive into an angled calendar grid, the tilt-to-flatten pull-back (angled 3D → straight-on 2D), the continuous flight between standing cards → `3d-camera-flight` (perspective wrapper + preserve-3d; the 2D camera rules keep owning any flat legs)
- whip sweep → composition: `nudge-curve` (burst-dominant tuning of the slow-fast-slow slide, applied to the world) + `motion-blur-streak` (camera-travel carve-out) on the same window
- typed text finishing in an input; typewriter headline; streaming AI response text; status spinner cycling `[status words]`; skeleton→content state swap → `discrete-text-sequence` (+ `gsap-effects` typewriter; `context-sensitive-cursor` for the input caret)
- which content appears per leg / receipt rows and findings arriving on script windows → `dynamic-content-sequencing`
- cursor click on `[Send / Create PR]` (sub-shape A's hinge) → `cursor-click-ripple` + `press-release-spring` (or `physics-press-reaction` for a weightier press)
- clicked element clears/vanishes; panel state A → B on the return leg → `scale-swap-transition` / `card-morph-anchor`
- to-do strikethrough draw; row hover highlight → `css-marker-patterns` (strike-through) · `asr-keyword-glow` (accent glow on the hovered/selected row)
- bar-to-line chart morph → composite, decomposes cleanly: `stat-bars-and-fills` (bars `scaleY` → baseline) + `svg-path-draw` (node-dotted line draws left→right) at the same timeline position — no single rule names the coordinated chart-type morph, but no new rule needed
- commit row slide-in; reaction pill appears; receipt rows expand row-by-row → `spring-pop-entrance` (single arrivals) / `waterfall-entry` (the row-by-row cascade)
- dropdown self-expands, displacing the field below (094) → `anchored-layout-expand` (the masked edge-anchored expansion of the dropdown body — never tween `height`) + `reactive-displacement` (the expansion tween drives the sibling's displacement)
- focus-ring travel between fields (094: a thin outline fades in on `From`, then sweeps down onto `Amount`) → `ai-tracking-box` restyled as a plain outline (offsets baked at setup; size morphed via scale, never width/height)
- 3D card subtle float; near-imperceptible tilt/scale drift on holds → `sine-wave-loop` (+ `multi-phase-camera`'s drift for the camera-side micro-motion; the _tilt_ component of the drift belongs to `3d-camera-flight`)
- camera drift toward a button; slow subtle zoom-ins riding a hold → `multi-phase-camera` (steady-push mode, tiny spread)

**camera grammar** (the defining layer — this blueprint IS its camera): every leg is a tween on ONE camera state (`viewport-change`'s single `.world` wrapper / `cam` object), sequenced by `multi-phase-camera`, aimed by `coordinate-target-zoom`. Legs must be _motivated_: sub-shape A moves because an action fired (click → swoop to the consequence); sub-shape B moves because the next reveal demands it (dive → focus → reposition → final dive). Vary the leg verbs — a journey of four identical pushes reads as a slideshow. Ease law: hard `out`-family on dives and landings (`power4.out` — violent arrival, sharp settle), `power2.inOut` on repositioning legs; spring/back easing on a camera feels wrong (per `multi-phase-camera`). Sub-shape B layers `3d-camera-flight`'s perspective wrapper under the same single-state discipline.

**Seek-safety (non-negotiable for this much camera):** the entire journey — every leg, every blur envelope, every DoF pull — lives on the ONE paused GSAP timeline, so any frame seek reproduces the exact mid-leg camera pose. One camera state object, transform composed in a single writer (`applyCamera()`), no CSS `transition` anywhere near the wrapper, blur via proxy-tweened attributes / `--dof` vars (both seek-safe), and ending mid-dive is fine — a seek to the last frame just lands mid-tween. Per-leg targets are measured ONCE at setup (after `fonts.ready`) and baked; never `getBoundingClientRect` in `onUpdate`.

**Overflow (required for a clean `check`):** a traveling camera deliberately moves world content past the frame edges on every leg. Keep `overflow: hidden` on the scene root AND mark the moving `.world` wrapper with `data-layout-allow-overflow` — otherwise `check` reports `text_box_overflow` / `container_overflow` for every panel the journey leaves behind (see the same note on `device-surface-showcase`).

## Selected motion rule: coordinate-target-zoom

---
name: coordinate-target-zoom
description: Zoom into a specific non-centered element by combining scale with counter-translation — target ends at viewport center after the zoom completes.
metadata:
  tags: camera, zoom, scale, translate, target, off-center, focus
---

# Coordinate Target Zoom

A simple `scale > 1` on a wrapper pushes off-center content OFF the visible canvas. To zoom _into_ a specific non-centered element, apply scale AND an inverse translation in lockstep so the target lands at viewport center.

## How It Works

Two nested wrappers, separated concerns — never scale and translate on the SAME element (`translate * scale` ≠ `scale * translate` in CSS transform composition):

1. **Outer wrapper** applies `scale` (the zoom) around `transform-origin: 50% 50%`
2. **Inner wrapper** applies `translate(x, y)` (the counter-shift)

The counter-translate is the **negation** of the target's offset from viewport center:

```
T = -offset
```

Derivation: the inner translate moves the target to `offset + T` in pre-scale units; the outer scale S (around center) maps that to `S × (offset + T)`; landing at center means `S × (offset + T) = 0` → **`T = -offset`**. The formula does NOT depend on S — the translate is identical at 1.5×, 2×, or 3×. A common wrong intuition is `T = -offset × (S - 1)`: it coincidentally matches at S = 2 and is wrong at every other scale.

⚠️ **This is the NESTED-wrapper formula.** The single-wrapper camera in [viewport-change.md](viewport-change.md) puts `translate(x,y) scale(S)` on ONE element, where CSS applies scale first — there the counter-translate is **`T = -offset × S`**. The two formulas are not interchangeable; match the formula to the wrapper structure.

## Getting the offset

`T = -offset` is only as good as `offset`. The #1 way this pattern ships broken is hand-computing `offset` from a layout formula, getting the **sign** or magnitude wrong, and letting the zoom amplify a small error off-screen. **Default to measuring the target's real laid-out center; reserve the formula for symmetric rows.**

**Default — measure the actual center (works for ANY layout).** Immune to sign errors because it reads the rendered DOM, not a mental model:

```js
await document.fonts.ready; // metrics final; fallback fonts are 10–30px off → tens of px after a 3×+ zoom
const W = 1920,
  H = 1080;
const r = document.getElementById("target-card").getBoundingClientRect();
const TARGET_OFFSET_X = r.left + r.width / 2 - W / 2;
const TARGET_OFFSET_Y = r.top + r.height / 2 - H / 2;
```

Measure **once at setup** and bake — never per-frame in `onUpdate`. Because the measurement is async (`fonts.ready`), build and register the timeline inside the same `async` setup so the baked offset is ready before `window.__timelines[id]` is published.

**Shortcut — symmetric equal-width row ONLY:**

```js
const index_offset = targetIndex - (N - 1) / 2;
const TARGET_OFFSET_X = index_offset * (CARD_WIDTH + CARD_GAP);
```

⚠️ This assumes every sibling is the **same width**. The moment the row is asymmetric, it gives the wrong answer — often the wrong **sign**: the heavier side shifts the centered target the _opposite_ way you'd guess (e.g. `companion(220) + gap + wordmark + gap + chip(110)` puts the wordmark ~55px **right** of center, but "chip − companion" intuition says left). For anything but equal cards, **measure**.

**Headroom budget — cap the scale from the measured size.** A zoom multiplies any centering error; keep the target ≤ ~88% of the canvas at peak:

```js
const maxScale = Math.min((0.88 * W) / r.width, (0.88 * H) / r.height);
const ZOOM_SCALE = Math.min(DESIRED_SCALE, maxScale);
```

A target filling 97%+ of the frame reads as cut-off the instant its center is slightly off — and a hand-baked offset always is. (The perception gate flags this as `primary-offscreen`; `data-layout-allow-overflow` does **not** exempt it.)

## Recipe

```html
<div class="zoom-outer" id="zoom-outer">
  <div class="zoom-inner" id="zoom-inner">
    <div class="content">
      <div class="card">{other}</div>
      <div class="card target" id="target-card">{target}</div>
      <div class="card">{other}</div>
    </div>
  </div>
</div>
```

```css
.scene {
  overflow: hidden; /* REQUIRED — at zoom > 1 the scaled content leaks past the frame */
}
.zoom-outer {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  transform-origin: 50% 50%; /* center scaling is what the counter-translate math assumes */
  will-change: transform;
}
.zoom-inner {
  display: grid;
  place-items: center;
  will-change: transform;
}
```

```js
// TARGET_OFFSET_X/Y and ZOOM_SCALE come from "Getting the offset" — measured
// at setup (after fonts.ready), baked. Counter-translation = -offset.
const counterX = -TARGET_OFFSET_X;
const counterY = -TARGET_OFFSET_Y;

// Scale and counter-translate MUST share position, duration, AND ease —
// otherwise the target visibly wanders mid-zoom.
tl.to("#zoom-outer", { scale: ZOOM_SCALE, duration: ZOOM_DUR, ease: "power3.inOut" }, ZOOM_AT);
tl.to(
  "#zoom-inner",
  { x: counterX, y: counterY, duration: ZOOM_DUR, ease: "power3.inOut" },
  ZOOM_AT,
);
```

## Variations

- **Zoom out (target → wide view)**: reverse the phases — start zoomed-in, then tween to `scale: 1` + `x: 0, y: 0`; the "reveal" beat is the panorama.
- **Multi-target zoom sequence**: chain zooms (target A → pause → target B → pull back); each segment needs its own counter-translation pair.

## Values

| token      | range                                   | notes                                                                                      |
| ---------- | --------------------------------------- | ------------------------------------------------------------------------------------------ |
| ZOOM_SCALE | 1.5× modest → 3× dominant → 5×+ extreme | cap via the headroom budget; raster media needs `sourceResolution ≥ rendered × ZOOM_SCALE` |
| ZOOM_DUR   | 1.0–2.0s                                | under 0.8s feels like a teleport, over 2.5s drags; both tweens share it                    |
| ZOOM_AT    | after the layout lands + 0.5–1.5s       | give the viewer time to scan the layout before the camera commits                          |
| DWELL      | ≥ 1.0s after the zoom settles           | 1.5–2s ideal — the viewer must be able to read the target (climax dwell)                   |

## Critical Constraints

- **Outer scales, inner translates** — never both transforms on one element; nested wrappers keep the math clean.
- **`transform-origin: 50% 50%` on the outer wrapper** — non-center origin breaks the counter-translate derivation.
- **`overflow: hidden` on the scene root** — zoomed content leaks past the frame otherwise.
- **Scale and counter-translate share duration + ease** at the same timeline position, or the target drifts mid-zoom.
- **Offset measured once at setup** (after `fonts.ready`), baked — never recomputed per-frame, never hand-derived for a non-symmetric layout (wrong sign → target shoved off-frame).
- **Scale within the headroom budget** — target ≤ ~88% of the canvas at peak, derived from the measured size.

## See also

[viewport-change.md](viewport-change.md) (single-wrapper form, `T = -offset × S`) · [multi-phase-camera.md](multi-phase-camera.md) (a zoom phase inside a phased camera) · [sine-wave-loop.md](sine-wave-loop.md) (idle breathing after the zoom settles) · [discrete-text-sequence.md](discrete-text-sequence.md) (text assembly in the target before the zoom).

## Selected motion rule: motion-blur-streak

---
name: motion-blur-streak
description: Fake directional velocity blur on a fast entrance or camera push-through — blur peaks at max speed and resolves to 0 at the settle, so the element streaks in then snaps sharp. Two paths — SVG feGaussianBlur on the motion axis, or an echo/ghost trail that collapses into the lead. Plus a per-frame-driven form for an element riding a baked track (tracked insert, shake-matched title): velocity-gated text-free silhouette ghosts (or a rotate/blur/counter-rotate filter sandwich when a true blur is the look), streak axis from the track delta.
metadata:
  tags: motion-blur, velocity, streak, entrance, fly-in, ghost, echo, svg-filter, kinetic, camera, snap, driven, tracked, baked-track
---

# Motion-Blur Streak

Real motion blur isn't available to a seeked renderer (it integrates over shutter time), so this rule **fakes** it for a fast fly-in or hard camera push-through. The whole point is the _coupling_: the blur envelope rides the **same ease and window** as the position tween, so peak blur lands exactly on peak speed and the element is razor-sharp the instant it stops. Two paths:

- **(A) Directional SVG blur** — inline `<feGaussianBlur stdDeviation="X 0">` (X on the motion axis, 0 across it), tweened via a proxy. Cleanest; a true directional smear.
- **(B) Echo / ghost trail** — 2–4 duplicates at decreasing opacity, offset backward along the motion vector, collapsing into the lead as it settles. No filter cost; a stylized "speed-line" trail.

Both paths assume a **tween window** — an element driven per frame from a baked track has none; that form is the Per-Frame-Driven Carve-In below.

**Entrances and mid-shot moves only — never a mid-composition exit.** A blurred element fleeing off-frame mid-composition reads as a glitch; a hard exit between scenes is the transition's job (`../transitions/overview.md`). Two sanctioned scope extensions: the envelope may ride the **camera wrapper** during a travel leg (Camera-Travel Carve-Out), or become a per-frame function of a baked track for a **driven element** (Per-Frame-Driven Carve-In).

## How It Works

A fast `out`-eased move front-loads velocity — fastest off the start, bleeding to zero at the settle. Map the blur/echo envelope onto that same curve: position travels from an off-frame / pushed-back start to rest over `MOVE_DUR`; in lockstep on the same window and ease the smear goes `PEAK_BLUR → 0` (A) or the ghosts collapse onto the lead (B). By the settle the element is fully crisp and dwells ≥1 s — the contrast between violent streak and still, sharp settle IS the effect. GSAP can't tween an SVG attribute directly: tween a plain `{ v }` proxy and write `setAttribute("stdDeviation", …)` in `onUpdate`, seeding it once at setup so a seek to t=0 shows the streaked start.

## Recipe

```html
<!-- inside a standard scene clip; overflow: hidden on the scene (the smear extends past rest) -->
<svg width="0" height="0" aria-hidden="true" style="position: absolute">
  <filter id="streak" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur id="streak-blur" in="SourceGraphic" stdDeviation="0 0" />
  </filter>
</svg>
<div class="streak-el" id="streak-el" style="filter: url(#streak)">{phrase}</div>
<!-- Path B instead: N-1 aria-hidden .streak-ghost duplicates BEHIND the lead, no filter -->
```

```js
// Path A — proxy-tweened directional blur.
const blurNode = document.getElementById("streak-blur");
const blurProxy = { v: PEAK_BLUR };
const writeBlur = () => blurNode.setAttribute("stdDeviation", `${blurProxy.v} 0`); // X axis only
writeBlur(); // seed frame 0 — a seek to t=0 must show the streaked start, not a sharp pre-frame

tl.fromTo(
  "#streak-el",
  { x: ENTER_FROM_X, opacity: 0 },
  { x: 0, opacity: 1, duration: MOVE_DUR, ease: MOVE_EASE },
  MOVE_START,
);
tl.to(blurProxy, { v: 0, duration: MOVE_DUR, ease: MOVE_EASE, onUpdate: writeBlur }, MOVE_START);

// Path B — ghosts on the SAME window/ease; per-ghost variation by index.
gsap.utils.toArray(".streak-ghost").forEach((g) => {
  const i = Number(g.dataset.i); // 1..N-1, set in HTML
  tl.fromTo(
    g,
    { x: ENTER_FROM_X - i * ECHO_STEP_PX, opacity: GHOST_BASE_OPACITY / i },
    { x: 0, opacity: 0, duration: MOVE_DUR, ease: MOVE_EASE },
    MOVE_START,
  );
});
```

## Variations

- **Vertical streak** — swap axes: `y`, `stdDeviation="0 Y"`, vertical echo offsets.
- **Camera push-through** — `scale: SCALE_FROM → 1` with a symmetric `"B B"` envelope (depth-wise smear, not directional): the wordmark punches out of soft focus and snaps crisp at the lock.
- **Staggered grid streak-in** — each card streaks into its slot at `MOVE_START + i * CARD_STAGGER` with its own blur proxy / ghosts; sharp the instant it lands.
- **Hold-the-streak** — blur on a marginally slower curve than position (position `expo.out`, blur `power3.out`) so the last wisp resolves just after arrival. Sparingly; default is locked envelopes.

## Camera-Travel Carve-Out

The envelope is also sanctioned at **wrapper level**: on the `.world` / camera wrapper of a virtual-camera scene ([viewport-change.md](viewport-change.md), [multi-phase-camera.md](multi-phase-camera.md), [3d-camera-flight.md](3d-camera-flight.md)) during a **travel leg** — a dive, a whip sweep, a violent final push. This does **not** violate "never a mid-composition exit": the world never leaves frame — the camera travels _through_ it, and every leg ends with the world at rest, sharp, inside the frame. Each leg is an **arrival** at the next pose, so the entrance doctrine applies leg by leg. Three deltas from the element-level recipe:

- **Envelope follows the leg's ease.** An `out` leg (dive, final push) uses the base recipe unchanged. An `inOut` repositioning leg peaks mid-leg: split the envelope at the velocity peak — `0 → PEAK` on the in-half ease over the first half, `PEAK → 0` on the out-half over the second. Seed the proxy at **0** for these (the streaked state lives mid-leg, not at t=0; seed-at-`PEAK_BLUR` belongs to the entrance shape, where the first frame IS the fastest).
- **Filter placement.** 2D camera: `filter: url(#streak)` on the `.world` wrapper. 3D flight: on the **perspective stage** above the 3D context — a `filter` on a `preserve-3d` element flattens it and collapses every `translateZ`. Never per-element inside the world: one frame-wide envelope, not N desynced ones.
- **Full-frame blur is heavy** — cap `PEAK_BLUR` ~18–20 at wrapper level (vs 30 for one element); a brief whip may touch ~24. Axis rule as usual: `"X 0"` for a lateral whip/pan, `"B B"` for a dive/push.

### Whip sweep (named composition)

The heavily-blurred lateral whip that resolves into the next region — two rules on one window:

1. **Position** — [nudge-curve.md](nudge-curve.md)'s three-phase chain on the camera state, tuned burst-dominant (tail still ≥3× ramp-in in time).
2. **Blur** — `0 → PEAK` across the ramp-in, held at `PEAK` through the linear burst (constant velocity = constant smear), `PEAK → 0` across the tail.

Swap or reveal the next region's content DURING the burst — the smear masks the change; the `power4.out` tail lands it sharp. Reveal during the burst, read after the tail.

```js
tl.to(cam, { x: WHIP_X * 0.1, duration: 0.12, ease: "power3.in", onUpdate: applyCamera }, WHIP_AT);
tl.to(
  cam,
  { x: WHIP_X * 0.75, duration: 0.1, ease: "none", onUpdate: applyCamera },
  WHIP_AT + 0.12,
);
tl.to(
  cam,
  { x: WHIP_X, duration: 0.35, ease: "power4.out", onUpdate: applyCamera },
  WHIP_AT + 0.22,
);

tl.to(blurProxy, { v: PEAK_BLUR, duration: 0.12, ease: "power3.in", onUpdate: writeBlur }, WHIP_AT);
// blur holds at PEAK through the linear burst (no tween needed — value rests at PEAK)
tl.to(blurProxy, { v: 0, duration: 0.35, ease: "power4.out", onUpdate: writeBlur }, WHIP_AT + 0.22);
```

## Per-Frame-Driven Carve-In (baked tracks)

When the element is not tweened but **driven** — a tracked insert or callout riding a baked per-frame track, a title matched to camera shake — there is no move window to share. The envelope becomes a per-frame function of the track's own delta, computed in the same `onUpdate` that applies the position.

One element per transform, so no write clobbers another:

```html
<!-- .track: position + any fade, the only element either touches -->
<div class="track">
  <!-- ×2, the lead's box -->
  <div class="streak-ghost" aria-hidden="true" data-layout-allow-overlap></div>
  <!-- Path A only: rotate onto the travel axis; same box as .lead so both rotate about one center -->
  <div class="blur-wrap" style="filter: url(#streak)">
    <!-- counter-rotate only; no GSAP transform tweens on it -->
    <div class="lead">…</div>
  </div>
</div>
```

```js
// inside the frame-lookup driver (an ease:"none" proxy → frames[i]); TRACK.x / TRACK.y are baked arrays
const j = Math.max(1, i); // frame 0 borrows the frame-1 delta so a seek to t=0 has a defined state
const dx = TRACK.x[j] - TRACK.x[j - 1];
const dy = TRACK.y[j] - TRACK.y[j - 1];
const speed = Math.hypot(dx, dy); // px per frame
const angle = (Math.atan2(dy, dx) * 180) / Math.PI; // the streak axis IS the travel direction
track.style.transform = `translate(${TRACK.x[i]}px, ${TRACK.y[i]}px)`;

// Path B, driven form (the default here): text-free silhouette clones trail the lead along −delta.
const base = speed > TRAIL_GATE ? Math.min(TRAIL_MAX, TRAIL_K * speed) : 0;
ghost1.style.transform = `translate(${-dx * 0.25}px, ${-dy * 0.25}px)`;
ghost2.style.transform = `translate(${-dx * 0.5}px, ${-dy * 0.5}px)`;
ghost1.style.opacity = String(base); // a fade on .track multiplies in; never read another tween's value
ghost2.style.opacity = String(base * 0.5);

// Path A, driven form: rotate a filter wrapper onto the travel axis, blur along X only, counter-rotate the content.
const sigma = speed > TRAIL_GATE ? Math.min(SIGMA_MAX, 0.5 * speed) : 0;
blurWrap.style.transform = `rotate(${angle}deg)`;
lead.style.transform = `rotate(${-angle}deg)`;
blurNode.setAttribute("stdDeviation", `${sigma} 0`);
```

Three deltas from the tweened recipe:

- **Ghosts are text-free silhouettes** — the lead's box, border, radius and fill with **no content** (`aria-hidden="true"`, `data-layout-allow-overlap`). A 25–50%-opacity clone reads as shape; a clone carrying the text reads as a duplicate element, and content-free clones give the layout and contrast checkers nothing to flag.
- **Velocity-gated, not window-shaped** — the trail exists only above `TRAIL_GATE` px/frame and scales with speed (`min(TRAIL_MAX, TRAIL_K × speed)`): a slow drift shows nothing, a whip shows a 180°-shutter smear. Fade `.track`, never `.lead`: group opacity takes the trail with it, and the ghost opacity stays a pure function of the frame index whatever order frames are seeked in.
- **Axis from the baked delta** — `atan2(dy, dx)` per frame; the streak follows the track around corners with nothing to seed at setup.

**Which path for a driven subtree.** Path B is the default: it costs no filter raster (a full filter region re-rasterizes every frame under per-frame drive), its clones carry no text so the layout and contrast checkers see nothing new, and it degrades to nothing when the track is still. Path A in the driven form is legitimate when a true blur is the look. Both forms measured deterministic on the reference host (2026-09-08: single-card 120-frame and three-card 450-frame drives of each path, hardware-GL and software lanes, every double render bit-identical) — but a per-frame-driven filter is the first thing to re-measure on a new host: keep the double-render frame-hash comparison (`--format png-sequence` twice) in the pipeline rather than trusting one clean run. One earlier build (2026-08) observed 1-LSB `feGaussianBlur` jitter under per-frame load and shipped Path B for that reason.

## Values

| token               | range                                              | notes                                                                                           |
| ------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| MOVE_EASE           | `expo.out` / `power4.out` (default) / `power3.out` | `out`-family ONLY — `in`/`inOut` puts peak speed in the wrong place; position and blur share it |
| MOVE_DUR            | 0.25–0.6s                                          | over ~0.7s reads as a focus pull, not velocity                                                  |
| ENTER_FROM_X/Y      | 40–120% of the element's own dimension             | enough runway for the streak to read                                                            |
| PEAK_BLUR           | 8–30 (default 18)                                  | >30 erases the glyph at the start; ~18–20 cap at wrapper level                                  |
| SCALE_FROM          | 1.3–2.5                                            | push-through variation                                                                          |
| N (ghosts)          | 2–4                                                | >4 reads as strobe, not streak                                                                  |
| ECHO_STEP_PX        | 12–40px                                            | `N × step ≲ ENTER_FROM` so the furthest ghost starts inside the runway                          |
| GHOST_BASE_OPACITY  | 0.3–0.6                                            | opaque ghosts read as duplicate elements                                                        |
| CARD_STAGGER        | 0.05–0.12s                                         | one assembling wave, not separate arrivals                                                      |
| TRAIL_GATE          | 3–6 px/frame (default 4)                           | driven form: below it the track counts as still — no trail, no blur                             |
| TRAIL_K · TRAIL_MAX | 0.05 · 0.32                                        | driven form: ghost opacity `min(TRAIL_MAX, TRAIL_K × speed)` — hits the cap at ~6 px/frame      |
| TRAIL_OFFSETS       | 0.25 / 0.5 of the per-frame delta                  | two clones = a discrete 180° shutter; a third at 0.75 only for a long whip                      |
| SIGMA_MAX           | 8–12                                               | driven Path A: `σ = min(SIGMA_MAX, 0.5 × speed)` along the travel axis                          |

## Critical Constraints

- Blur peaks at peak speed and resolves to 0 at the settle — share the ease and window between position and envelope. A blur that lingers after the stop reads as a focus pull.
- Entrances / mid-shot arrivals only — never a mid-composition exit; wrapper-level use only per the Camera-Travel Carve-Out, per-frame-driven use only per the Per-Frame-Driven Carve-In.
- Seed `stdDeviation` at setup: at `PEAK_BLUR` for the entrance shape, at 0 for a whip / `inOut` leg.
- Generous filter region (`x="-50%" y="-50%" width="200%" height="200%"`) or the smear clips at the element's box edge.
- Directional axis: `"X 0"` horizontal, `"0 Y"` vertical, `"B B"` only for a depth/scale move — symmetric blur on a sideways move looks like defocus.
- Dwell ≥1 s sharp after the snap; a streak landing at the last beat reads as "flashed and gone".
- Heavy element on a solid field — thin type (< ~120px / 800 weight) or a busy backdrop swallows the smear.
- `overflow: hidden` on the scene — the smear / furthest ghost extends past the resting position during travel.
- Driven form: clones are text-free silhouettes (`aria-hidden`, `data-layout-allow-overlap`) inside the faded `.track`, axis from the baked delta; nothing is seeded at setup except the structural frame-0 state.

## See also

`kinetic-beat-slam` (streak as one beat's entrance) · `center-outward-expansion` (grid streak-in) · `scale-swap-transition` (same-footprint morph — not an arrival) · `nudge-curve` (the whip sweep's position half) · `3d-camera-flight` / `viewport-change` (the Camera-Travel Carve-Out's wrappers).

## Selected motion rule: press-release-spring

---
name: press-release-spring
description: Tactile button press with linear compression, spring-based elastic recovery, and layered visual feedback (shadow shrink + release burst + background glow).
metadata:
  tags: spring, press, interaction, button, physics, glow, burst, ui
---

# Press-Release Spring Chain

Separates input (linear compression) from output (spring recovery) to create tactile feel: the overshoot is a natural byproduct of the spring config, not manually coded, with secondary motion (shadow shrink, release burst, background glow) layered on the same trigger frame. This is a **reaction on an element already resting on screen** — an arrival that springs in from nothing is [spring-pop-entrance.md](spring-pop-entrance.md); add a visible cursor actor and it becomes [physics-press-reaction.md](physics-press-reaction.md).

Two phases split at the **release**:

1. **Press**: linear ease → compression (`scale: 1 → PRESS_SCALE`, shadow shrinks). Linear, not spring — the dip must read as instant/tactile, not squishy.
2. **Release**: `back.out(BOUNCE_FACTOR)` spring back to 1.0. Optional burst glow ring expands behind the button; optional environmental glow fades in.

State continuity is critical: the release tween's start value MUST equal the press tween's end value, or the spring snaps to a different position. GSAP threads this automatically when both tweens target the same property at **adjacent positions** — `RELEASE_START = PRESS_START + PRESS_DUR`; a gap or overlap breaks it.

## Recipe

```html
<div class="press-stage">
  <div class="bg-glow" id="bg-glow"></div>
  <!-- Burst sits BEHIND the button (z-index 1 vs 2), same footprint, blurred
       radial gradient, opacity 0. bg-glow is a full-stage radial at negative
       inset so it extends past the stage edges. -->
  <div class="burst" id="burst"></div>
  <button class="btn" id="btn">{buttonLabel}</button>
</div>
```

```js
// Phase 1 — press (linear compression)
tl.to(
  "#btn",
  { scale: PRESS_SCALE, boxShadow: "{btnPressedShadow}", duration: PRESS_DUR, ease: "power1.in" },
  PRESS_START,
);

// Phase 2 — release (spring back; start scale == PRESS_SCALE by adjacency)
tl.to(
  "#btn",
  {
    scale: 1,
    boxShadow: "{btnRestShadow}",
    duration: RELEASE_DUR,
    ease: `back.out(${BOUNCE_FACTOR})`,
  },
  RELEASE_START,
);

// Phase 3 — burst glow pops behind the button, then fades
tl.fromTo(
  "#burst",
  { scale: 1, opacity: 0 },
  {
    scale: BURST_PEAK_SCALE,
    opacity: BURST_PEAK_OPACITY,
    duration: BURST_GROW_DUR,
    ease: "power2.out",
  },
  RELEASE_START,
);
tl.to("#burst", { opacity: 0, duration: BURST_FADE_DUR, ease: "power2.in" }, BURST_FADE_START);

// Phase 4 — environmental glow fades in after release
tl.to(
  "#bg-glow",
  { opacity: BG_GLOW_PEAK_OPACITY, duration: BG_GLOW_FADE_DUR, ease: "power2.out" },
  RELEASE_START,
);
```

## Variations

- **Subtle press** (status save / muted CTA): `PRESS_SCALE` ~0.96, `BOUNCE_FACTOR` ~1.4, burst scale/opacity reduced.
- **Dramatic press** (hero CTA / "ship it"): `PRESS_SCALE` ~0.88, `BOUNCE_FACTOR` ~2.5, burst maxed.
- **Color shift during press** — darken mid-press, return on release; interpolated `backgroundColor` at the same timeline positions as the scale tweens. Same state-continuity rule.
- **State change at release** (approve / confirm) — instead of returning to the rest color, swap to `{successColor}` at `RELEASE_START` and pop a checkmark via a separate `back.out(CHECK_BOUNCE)` tween (1.4–2.0, firmer than the button's bounce — a punctuating "stamp"; pop 0.3–0.6 s) at the same position. The button is now terminal — no further presses expected.

## Values

| token                | range                                      | notes                                                                                      |
| -------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| button footprint     | ≥ 3–5% of canvas area                      | a 320×68 button at 1080p is ~1% and the press reads as visually insignificant              |
| PRESS_SCALE          | 0.88 dramatic · 0.92 default · 0.96 subtle | never <0.85 (broken) or >0.98 (no perceptible dip)                                         |
| PRESS_DUR            | 0.10–0.30 s                                | shorter = snappier; must be shorter than `RELEASE_DUR` (input faster than spring recovery) |
| RELEASE_DUR          | 0.40–0.90 s                                | shorter = tight pop; longer = loose, wobbly settle                                         |
| BOUNCE_FACTOR        | 1.4 soft · 2.0 firm · 2.8 cartoony         | or `elastic.out(amplitude, period)` for a rubbery oscillation instead of one overshoot     |
| RELEASE_START        | `= PRESS_START + PRESS_DUR`                | adjacency = automatic state continuity                                                     |
| BURST_PEAK_SCALE     | 3 subtle · 6 default · 8 max               | beyond ~8 the radial gradient pixelates visibly                                            |
| BURST_PEAK_OPACITY   | 0.4–1.0                                    | grow ≈ fade, 0.4–0.7 s each; blur 40–100 px (hard ring → ambient haze)                     |
| BG_GLOW_PEAK_OPACITY | 0.1 subtle · 0.25 default · 0.45 max       | higher washes the whole composition; fade-in 0.6–1.0 s; inset −300…−500 px at 1080p        |

Color tokens: pressed surface darker than rest; rest shadow large + diffuse, pressed small + tight (the button "sinks toward the surface"); burst gradient darker + more saturated than `{btnBg}` — same-color glow looks washed out; bg glow a low-opacity tint of the button's hue family.

## Critical Constraints

- **State continuity** — release start value exactly equals press end value; enforced by same-property adjacency at `RELEASE_START = PRESS_START + PRESS_DUR`.
- **Linear press, spring release** — both spring → squishy; both linear → mechanical, no overshoot punch.
- **Anchor compression on center** (`transform-origin: 50% 50%`) or the button collapses asymmetrically.
- **Burst behind, not in front** — burst `z-index: 1`, button `z-index: 2`; in front it occludes the button at peak opacity.
- **Don't tween `boxShadow` and `filter` on the same element** — they compete in the layout pipeline; shadow on the button, blur on the separate burst layer.
- **Climax dwell** — after the burst peak + reveal, the composition must run ≥ 1 s more (≥ 2 s for dramatic variants); a reveal at `t = DURATION − 0.2 s` reads as "flashed and gone."

## See also

`spring-pop-entrance` (the ENTRANCE counterpart — arrival, not reaction) · `physics-press-reaction` (this press with a visible cursor actor) · `cursor-click-ripple` (the cursor click that triggers the press) · `sine-wave-loop` (idle micro-float BEFORE the press) · `center-outward-expansion` (badge burst synced to the release).
