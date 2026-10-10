# Living painting background

The homepage background is the lily / butterfly / koi painting, animated by scroll:
petals fall from the lily, the butterflies take off and fly away, and the koi swim
around the pond. At the top of the page every piece sits exactly where it was painted.

## How it works

The painting was split into layers once, offline:

| File | What it is |
| --- | --- |
| `plate.webp`, `plate@2x.webp` | The painting with the loose petals, butterflies and koi painted out (AI inpainting), 1x and 2x |
| `sprites.webp` | One atlas with the 3 petals, each butterfly split into left/right wings, and the 3 koi *straightened* along their spines |
| `garden-data.js` | Generated geometry: where each piece sits, the wing hinge lines, and each koi's swimming loop |
| `painting.webp` | The untouched painting, used for reduced motion or when WebGL is unavailable |
| `garden.js` | The engine (no dependencies) |
| `garden.css` | The fixed layer and the `.garden-window` helper |

At runtime the plate is a fixed `<img>` behind the page and a transparent WebGL canvas
draws the pieces on top:

- **Camera.** The painting covers the viewport and pans down it as you scroll. Keyframes come
  from `data-garden-focus` attributes: `data-garden-focus="0.3"` means "when this element is
  centred on screen, centre the point 30% of the way down the painting".
- **Petals.** The three painted petals start in place, then tumble down (sway, spin and flip
  driven by distance scrolled). New ones detach from the lily, or drift in from above once it
  is off screen. Those that reach the pond land, ripple, float round the swirl and fade.
- **Butterflies.** Each one waits until the first `.garden-window` slides under it, then follows
  a curved flight path off the top as you scroll. Each wing is a separate quad hinged on the
  body, so the flap is real. Scroll back up and they fly home and settle in their painted pose.
- **Koi.** Each fish was straightened into a strip, then gets bent back onto a closed loop
  around the pond as a mesh. Distance swum comes from distance scrolled, plus a slow cruise.
  The body follows the curve of the loop and a travelling wave beats the tail. The loop
  starts with the fish's own spine, so frame 0 matches the painting.

`prefers-reduced-motion: reduce` shows the still painting with no panning. Without WebGL, the
still painting still pans.

## Using it on a page

```html
<link rel="stylesheet" href="assets/garden/garden.css">
<script>document.documentElement.classList.add("has-garden")</script>
<script src="assets/garden/garden-data.js" defer></script>
<script src="assets/garden/garden.js" defer></script>
```

Then give the page somewhere to see the painting:

- make section backgrounds translucent (the homepage uses a 90% paper veil),
- mark keyframes with `data-garden-focus="0…1"`,
- add clear panes where you want the painting uncovered:
  `<div class="garden-window" data-garden-focus="0.86" aria-hidden="true"></div>`.

The page needs to be served over http(s). Opened from `file://`, browsers block WebGL from
reading the sprites, so you only get the still painting. Run `python3 -m http.server` in the
repo root and open `http://localhost:8000`.

## Tuning

Set options before `garden.js` loads:

```html
<script>window.BOG_GARDEN_CONFIG = { petals: 6, fall: 0.35, idle: false }</script>
```

| Option | Default | Meaning |
| --- | --- | --- |
| `petals` | 10 | Most petals in the air (fewer on small screens) |
| `fall` | 0.5 | Screen px a petal falls per px scrolled |
| `idleFall` | 10 | px/s petals drift while you're not scrolling |
| `koiSpeed` | `[0.34, 0.42, 0.3]` | Painting px each koi swims per px scrolled |
| `koiIdle` | `[7, 9, 6]` | Koi cruising speed when idle (painting px/s) |
| `flight` | 0.9 | Screens of scrolling a butterfly takes to fly off |
| `idle` | true | Keep a little motion going between scrolls (false = moves only on scroll, and the loop sleeps) |
| `assets` | – | `{plate, plate2x, painting, sprites}` URLs if the images live elsewhere |

You can also change these live in the console (`BOG_GARDEN.config.fall = 0.8`).
`BOG_GARDEN.stats.ms` shows the average JS time per frame (about 0.2–0.4 ms).

## Regenerating the assets

The layer split, inpainting, upscaling and koi straightening are done by the Python pipeline
that ships alongside this change (not in the site repo). You only need it if the painting
changes.
