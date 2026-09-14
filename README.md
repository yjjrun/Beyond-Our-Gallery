# Beyond Our Gallery

An editorial research gallery for overlooked SGX art, experience, attractions, media and live-events companies.

By Jiarun Yang, 2026 · Live at [beyondourgallery.com](https://beyondourgallery.com)

## Experience

- Scroll-directed museum opening with a physical 3D painting and financial reverse
- Searchable company gallery with Gallery and Analyst views
- Animated evidence charts, score rings and methodology details
- Responsive layouts with reduced-motion support
- Standalone Kingsmen Creatives, Straco Corporation and scoring-methodology pages

## Stack

The immersive mockup source lives in `site/` and uses Next.js, Tailwind CSS, React Three Fiber, GSAP ScrollTrigger and Framer Motion. GitHub Pages serves its static export from `/mockup`, alongside the original homepage and existing research pages.

```bash
cd site
pnpm install
pnpm dev
pnpm build:pages
```

The production export replaces only the `mockup/` directory. It leaves the root homepage, `.nojekyll`, `CNAME`, the existing `assets/` directory and all standalone analysis pages intact.

## Disclaimer

Research is based on public disclosures, is not affiliated with covered companies and is not investment advice.
