# Visual Direction — Crypto Courses Landing

## Vibe
- Anchor: Glass-tech
- Wildcard: "dark luxury" — gold accent replaces the default cyan/azure glass-tech accent (user override, logged below)

## Palette (locked)
| Token | Value | Role |
|-------|-------|------|
| bg | `#0B0B0D` | page background, near-black |
| surface | `#16151A` | glass panel fill (used with backdrop-blur + low-opacity border) |
| ink | `#F2EFE9` | primary text, warm off-white |
| ink-muted | `#A8A29B` | secondary text |
| accent | `#C9A24B` | single accent — CTA, price, highlights (muted antique gold, not neon) |

Off-black/off-white only, single accent — per Hard Rule 3.

## Typography (locked)
- Display + body: **Geist** (headings + body)
- Mono: **Geist Mono** (price figures, tier labels, nav mono accents)
- Loaded via `next/font/google` (Geist ships on Google Fonts / next/font).

## Spatial language
**Atmospheric** — glass panels with depth, soft light falloff, generous negative space around the hero shader.

## Macrostructure (Phase 2.5)
**Marquee Hero** (full-bleed declarative hero, A5) — chosen because the product is a single declarative offer (3 course tiers, one CTA), not a proof-heavy SaaS pitch.
- Section rhythm: Hero (shader glass plane) → How it works (3 steps, no fake proof) → Course tiers (core offer, live from API) → Final CTA → Footer
- DESIGN_VARIANCE: 7, VISUAL_DENSITY: 3

## Visual Effect Layer (Phase 5)
**Shader background** — React Three Fiber refractive/frosted-glass plane behind the hero headline, lazy-loaded (`ssr:false`), degrades to a static CSS gradient+blur poster on `prefers-reduced-motion` / touch / WebGL failure. No 3D model — geometry is a canvas for the shader only.

## Motion (Phase 2e / 2.6)
- Intensity: **3/3** — full choreography (Framer Motion + Lenis + GSAP ScrollTrigger)
- Smooth scroll tier: **Tier 4** (Lenis + ScrollTrigger sync) per landing + 3/3 matrix. Tier 5 (ScrollSmoother) not used — no Club GreenSock license confirmed.
- Personality: **Premium** (override from vibe default "Energetic" — logged: gold/luxury wildcard calls for restrained fade-up reveals, not punchy tech translates)
  - Signature easing: `cubic-bezier(0.4, 0, 0.2, 1)`
  - Duration palette: 250ms / 400ms / 600ms (quick/standard/slow) — no arbitrary durations
  - Entrance pattern: subtle fade-up, used consistently across all sections

## 2D Visual Assets (Phase 4)
Illustration style: **Geometric flat**, hand-authored as inline SVG/CSS (no external image generation) — interlocking glass-panel shapes in the locked palette, used for: hero backdrop composition (behind/around the shader plane), section divider motifs, OG image. Keeps full palette lock and avoids stock-render/AI-slop risk.

## Icon set (Phase 3)
Custom SVG, single stroke weight (1.5px), single corner family (2px radius), line-style (no fills except tier-status dot). Inventory: nav mark, 3 "how it works" step icons, CTA arrow, tier-check icon, Telegram mark (outline, custom-drawn, not the brand logo asset).
