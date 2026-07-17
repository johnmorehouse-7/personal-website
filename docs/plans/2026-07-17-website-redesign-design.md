# Website Redesign — Design Doc

**Date:** 2026-07-17
**Goal:** Give the personal site real character. Move it from a flat, generic, "vibe-coded" minimal theme to a bold-but-credible, editorial, lightly-animated site — without leaving Hugo or adding heavy dependencies.

## Direction (decided)

- **Character:** Modern & bold, executed in the harder editorial register — **light + high-contrast + kinetic typography**. Boldness comes from scale, weight, and space, not from dark mode or color noise.
- **Scope:** A real redesign (new visual identity + new sections), not just a polish pass.
- **Signature element:** A kinetic-typography hero.

## What's wrong with the current site (diagnosis)

- Zero motion or interactivity — content just appears.
- Generic `-apple-system` system font reads as "default," not "designed."
- Cramped 720px column; centered, hierarchy-less hero stack.
- "Recent Updates" — the most alive content — is a plain bullet list.
- No personality cues (bikes, travel, reading) despite good photos on hand.

---

## 1. Visual system

**Palette (warm paper, near-black, one green):**

```
--paper:    #f7f5f0   warm off-white (not sterile #fff)
--ink:      #16130d   near-black with warmth (not pure #000)
--ink-soft: #55504a   muted body/secondary
--green:    #0a6b34   accent, nudged for AA contrast on paper
--line:     #e0dcd3   hairline rules/borders
```

One accent only.

**Typography (two real, self-hosted faces):**
- **Display:** Space Grotesk — hero + headings. Big, confident, characterful. Hero name up to ~6rem (`clamp`), tight letter-spacing, weight 600–700.
- **Body:** Inter.

**Layout & space:**
- Widen content column from 720px to ~960px with generous margins.
- Asymmetric, left-weighted grid on the home page (not centered).
- Lots of negative space.

**Motion principles (restrained, purposeful):**
- Staggered reveal on load for the hero (name → tagline → cycling word → links).
- Scroll-triggered fade-and-rise for sections (`IntersectionObserver`, ~16px rise, ~400ms).
- Micro-interactions: animated underline wipe on links; subtle lift on photo/cards on hover.
- **`prefers-reduced-motion` respected everywhere** — degrades to instant.

---

## 2. Home page

**Kinetic hero — left-weighted, asymmetric:**

```
┌─────────────────────────────────────────────┐
│                                    ●          │  photo, top-right, small & offset
│  JOHN                                         │
│  MOREHOUSE                                    │  huge display type
│                                               │
│  economist working on  real estate ▏          │  cycling word (green)
│                        climate risk           │
│                        insurance              │
│                                               │
│  Head of Analytics at Zephyr Resilience.      │  one-line intro
│                                               │
│  Email · LinkedIn · GitHub · Substack · CV    │  links, underline-wipe
└─────────────────────────────────────────────┘
```

- **On load:** name slides/fades up in two staggered lines → intro fades in → cycling word starts.
- **Cycling word:** rotates `real estate → climate risk → insurance` (~2.2s loop), green-accented, slide-up-and-mask transition. Animates the actual tagline — meaningful, not decorative.
- **Cursor-reactive name:** subtle variable-weight shift or 2–3° parallax lean toward pointer. Disabled under reduced-motion / touch.

**"Recent Updates" → reworked into a real feed:** vertical timeline with hairline rule; each entry = green **date chip** + title link + source tag (JAERE, Substack, Working Paper). Rows fade-and-rise on scroll.

**Below the fold:** short "currently / selected work" teaser linking into Research and Writing.

---

## 3. Inner pages

**Research page** — credibility centerpiece. Structured publication list, data-driven from `data/papers.yaml` (explicit `weight`/order field — never auto-sorts).

Each entry: year + venue chip, title, 2–3 line abstract, buttons for PDFs/slides.

**Exact order (published first, then working papers in this order):**

1. **Downwind and Out** — *JAERE* (published) — journal link (uchicago)
2. **Labor Market Power and Spatial Policies** — working paper — external link (sanity CDN)
3. **Emmett / climate migration** (Reynier–Morehouse) — working paper — `reynier-morehouse-climate-migration.pdf`
4. **JMP** — working paper — `jmp.pdf`
5. **Airbnb** — working paper — `airbnb.pdf`

Slides available to attach where relevant: `aere_pres.pdf`, `frb.pdf`, `mea.pdf`, `osweet.pdf`.

Rows fade-and-rise on scroll; hover lifts the row and surfaces the buttons.

**Writing page** — clean list linking to Substack. Fetch latest posts at **build time** via `resources.GetRemote` on `morehouses.substack.com/feed` (title, date, excerpt, link). Falls back to a styled "Read on Substack" card if the fetch fails.

**About / Photos** — personality lands here. Editorial About layout + a **curated asymmetric photo strip** (not a grid) from `croatia`, `lucerne`, `gravel`, `hains` — offset sizes, subtle hover zoom, captions ("Croatia, 2024").

**CV** — stays a PDF link, restyled button. **Contact** — restyled to match.

---

## 4. Tech approach

Stay in Hugo; zero heavy frameworks. Theme-level redesign — existing content keeps working.

- **Fonts:** self-hosted Space Grotesk + Inter via Hugo asset pipeline (`woff2`, `font-display: swap`). No render-blocking, no external Google dependency.
- **CSS:** rewrite `main.css` around the token system + a small layout grid; minified through the existing pipeline.
- **Motion:** ~40–60 lines of **vanilla JS** in `main.js` — no GSAP. `IntersectionObserver` (scroll reveals), tiny `requestAnimationFrame` loop (cursor-reactive name), interval-driven word cycler. All gated behind `prefers-reduced-motion` + pointer/touch checks.
- **Data-driven content:** `data/papers.yaml` (Research); `resources.GetRemote` on Substack RSS (Writing).
- **New layouts:** `research.html`, `writing.html`; restyled `home`/`about`/`page`; new menu entries.
- **Performance budget:** stays fast static — no CLS from fonts/images, lazy-load photos, everything works with JS disabled (motion is progressive enhancement).

**Build & verify:** run `hugo server` locally; screenshot each page (desktop + mobile) to confirm it looks designed before calling it done. Use the `ce-frontend-design` skill during the build.

---

## Out of scope (YAGNI)

- Dark mode / theme toggle (chose committed light palette).
- CMS, comments, analytics dashboards.
- Any JS framework or build step beyond Hugo's pipeline.
