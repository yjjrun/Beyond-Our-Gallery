# Design QA

## Scope

- Selected direction: `site/design/museum-portal-reference.png`
- Implementation: `/mockup/` at 1280 x 720 and a 390 x 844 mobile frame
- Reviewed: opening composition, four scroll states, research handoff, company gallery, controls, methodology, and mobile opening

## Comparison

The implementation preserves the selected direction's dominant museum object, white-wall and dark-green spatial split, oversized black/pink editorial typography, exhibit annotations, observer silhouette, and thin route line. The live version gives the painting more width and keeps the research copy clear of the WebGL canvas so both remain readable during motion.

## Resolved Findings

- P2: The opening headline crossed the painting and competed with the focal object. Reflowed it into three lines and narrowed its text column.
- P2: The opening navigation collided with the green wall. Reduced spacing and reserved the right edge.
- P2: A CSS green panel masked the visitor. Removed the duplicate fill and retained the actual 3D wall.
- P2: Mobile copy and CTA overlapped the painting. Lowered the canvas artwork on narrow screens and kept the brand on one line.
- P2: Gallery and sector controls changed visually without exposing selection state. Added `aria-pressed`.

## Verification

- Production build and TypeScript completed successfully.
- Intermediate hero frames contain a focal object or financial evidence; no blank handoff frame remains.
- Financial counters resolve to `S$372.5m`, `24.7%`, and `78`.
- Film & Media filtering returns mm2 Asia, G.H.Y Culture & Media, and NoonTalk Media.
- Analyst mode and methodology expansion respond correctly.
- Root `index.html` is unchanged; redesign files are isolated to `/mockup/` and `site/`.

## Result

passed
