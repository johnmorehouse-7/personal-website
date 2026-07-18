# Website Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Use the `agent-browser` skill for all screenshot verification, and the `ce-frontend-design` skill's judgment when styling.

**Goal:** Rebuild the personal site as a light, high-contrast, editorial design with a kinetic-typography hero and three new sections (Research, Writing, About/Photos), staying entirely in Hugo with vanilla-JS motion.

**Architecture:** Theme-level redesign of the `minimal` theme in place. New CSS token system + grid in `themes/minimal/assets/css/main.css`; ~50 lines of vanilla JS in `themes/minimal/assets/js/main.js` (all motion gated behind `prefers-reduced-motion` and touch/pointer checks); new Hugo layouts (`research.html`, `writing.html`); content-as-data via `data/papers.yaml` and `resources.GetRemote` on the Substack RSS feed.

**Tech Stack:** Hugo 0.153.2 extended, Hugo Pipes (asset bundling/minify/fingerprint), self-hosted woff2 fonts, vanilla JS, `IntersectionObserver`, `requestAnimationFrame`.

**Design source of truth:** `docs/plans/2026-07-17-website-redesign-design.md`

**Working dir:** All work happens in the `redesign` worktree. All paths below are relative to the repo root of that worktree.

**Verification baseline:** `hugo --quiet --gc` exits 0. Local preview: `hugo server -D` (default `http://localhost:1313`). Screenshots via the `agent-browser` skill at 1440px (desktop) and 390px (mobile) widths.

---

## Task 0: Font pairing bake-off (decision task)

**Goal:** Pick the display+body pairing from rendered screenshots before committing the visual system.

**Files:**
- Create (temporary): `themes/minimal/layouts/fonts-compare.html`
- Create (temporary): `content/fonts-compare.md`

**Step 1:** Download three display-font candidates + Inter to `themes/minimal/assets/fonts/` as woff2:
- Space Grotesk (500,700)
- General Sans (500,700) — from Fontshare
- Fraunces (opsz, 600) — a serif alt for contrast
- Inter (400,500,600) — body

Use `curl` against the Google Fonts / Fontshare CSS API `woff2` URLs, or the Fontsource GitHub raw files. Save with clear names, e.g. `space-grotesk-700.woff2`.

**Step 2:** Write `content/fonts-compare.md` with `layout: fonts-compare` front matter.

**Step 3:** Write `fonts-compare.html` rendering the hero name "JOHN MOREHOUSE", the tagline, and a body paragraph three times — once per pairing:
1. Space Grotesk + Inter
2. General Sans + Inter
3. Fraunces + Inter

Each in a `@font-face` + inline-styled block on the paper (`#f7f5f0`) background with ink (`#16130d`) text and one green heading rule.

**Step 4:** Run `hugo server -D`, open `/fonts-compare/`, screenshot at 1440px.

**Step 5:** Present the screenshot to John. **STOP for decision.** Record the chosen pairing here:
> **Chosen pairing:** _________________ (fill in before Task 1)

**Step 6:** Delete `fonts-compare.html` and `content/fonts-compare.md`. Keep only the chosen fonts' woff2 files; delete the rejected ones.

**Step 7:** Commit.
```bash
git add themes/minimal/assets/fonts/ && git commit -m "chore: add self-hosted fonts (chosen pairing)"
```

---

## Task 1: Design tokens + font-face + CSS reset

**Files:**
- Modify: `themes/minimal/assets/css/main.css` (full rewrite of the `:root` + base sections)

**Step 1:** Replace the top of `main.css` with the token system and `@font-face` blocks (adjust family names/weights to the chosen pairing):

```css
/* ---- Fonts (self-hosted) ---- */
@font-face {
  font-family: "Display";
  src: url("../fonts/space-grotesk-700.woff2") format("woff2");
  font-weight: 700; font-display: swap; font-style: normal;
}
@font-face {
  font-family: "Display";
  src: url("../fonts/space-grotesk-500.woff2") format("woff2");
  font-weight: 500; font-display: swap; font-style: normal;
}
@font-face {
  font-family: "Body";
  src: url("../fonts/inter-400.woff2") format("woff2");
  font-weight: 400; font-display: swap; font-style: normal;
}
@font-face {
  font-family: "Body";
  src: url("../fonts/inter-500.woff2") format("woff2");
  font-weight: 500; font-display: swap; font-style: normal;
}
@font-face {
  font-family: "Body";
  src: url("../fonts/inter-600.woff2") format("woff2");
  font-weight: 600; font-display: swap; font-style: normal;
}

:root {
  --paper: #f7f5f0;
  --ink: #16130d;
  --ink-soft: #55504a;
  --green: #0a6b34;
  --green-hover: #084f27;
  --line: #e0dcd3;

  --font-display: "Display", Georgia, sans-serif;
  --font-body: "Body", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

  --max-width: 960px;
  --space: 1.5rem;
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
}
```

**Step 2:** Keep the `* { box-sizing }` reset. Update `body` to `background: var(--paper); color: var(--ink); font-family: var(--font-body);`. Set headings to `font-family: var(--font-display)`.

**Step 3:** Verify with `hugo --quiet` (exit 0) and `hugo server` — confirm fonts load in the browser network tab (no 404s), body text renders in the new face.

**Step 4:** Commit. `git commit -am "feat: design tokens and self-hosted font faces"`

---

## Task 2: Base layout restructure (baseof, head, header, footer)

**Files:**
- Modify: `themes/minimal/layouts/baseof.html`
- Modify: `themes/minimal/layouts/partials/head/css.html` (or wherever CSS is piped)
- Modify: `themes/minimal/layouts/partials/head/js.html`

**Step 1:** In `baseof.html` (or `head/css.html`), fingerprint + preload the CSS and preload the two most-critical font files:
```html
{{ $css := resources.Get "css/main.css" | minify | fingerprint }}
<link rel="preload" as="font" type="font/woff2" href="{{ (resources.Get "fonts/space-grotesk-700.woff2").RelPermalink }}" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="{{ (resources.Get "fonts/inter-400.woff2").RelPermalink }}" crossorigin>
<link rel="stylesheet" href="{{ $css.RelPermalink }}" integrity="{{ $css.Data.Integrity }}">
```

**Step 2:** Wire up JS: bundle `js/main.js` fingerprinted, loaded with `defer`:
```html
{{ $js := resources.Get "js/main.js" | minify | fingerprint }}
<script defer src="{{ $js.RelPermalink }}" integrity="{{ $js.Data.Integrity }}"></script>
```
Ensure `head/js.html` (or footer) is actually included by `baseof.html`.

**Step 3:** Add new menu items in `hugo.toml` — Research (`/research/`), Writing (`/writing/`) — and confirm the menu partial renders them. Keep About, CV, Contact.

**Step 4:** `hugo server`; confirm no 404s, nav shows new links, page still renders.

**Step 5:** Commit. `git commit -am "feat: fingerprinted assets, font preload, new nav items"`

---

## Task 3: Home hero markup + layout CSS (static first)

**Files:**
- Modify: `themes/minimal/layouts/home.html`
- Modify: `themes/minimal/assets/css/main.css`
- Modify: `hugo.toml` params (add `roles` list for the cycling word)

**Step 1:** Add cycling roles to `hugo.toml`:
```toml
[params]
  roles = ["real estate", "climate risk", "insurance"]
```

**Step 2:** Rewrite `home.html` hero as a left-weighted grid. The cycling word ships as real text (first role) so it works with JS off:
```html
{{ define "main" }}
<section class="hero" data-reveal-group>
  <div class="hero__text">
    <h1 class="hero__name" data-reveal>
      <span class="hero__name-line">John</span>
      <span class="hero__name-line">Morehouse</span>
    </h1>
    <p class="hero__tag" data-reveal>
      economist working on
      <span class="hero__cycle" data-cycle>{{ index site.Params.roles 0 }}</span>
    </p>
    <div class="hero__intro" data-reveal>{{ .Content }}</div>
    {{ with site.Params.social }}
    <nav class="hero__links" data-reveal aria-label="Profiles">
      {{ with .email }}<a href="mailto:{{ . }}">Email</a>{{ end }}
      {{ with .linkedin }}<a href="{{ . }}" target="_blank" rel="noopener">LinkedIn</a>{{ end }}
      {{ with .github }}<a href="{{ . }}" target="_blank" rel="noopener">GitHub</a>{{ end }}
      {{ with .substack }}<a href="{{ . }}" target="_blank" rel="noopener">Substack</a>{{ end }}
      <a href="/files/cv.pdf">CV</a>
    </nav>
  </div>
  {{ with site.Params.profile_image }}
  <img src="{{ . }}" alt="John Morehouse" class="hero__photo" data-reveal>
  {{ end }}
</section>

{{ partial "updates.html" . }}
{{ end }}
```
Note: the `## Recent Updates` list is being moved out of `.Content` into a partial (Task 5). Trim `_index.md` accordingly there.

**Step 3:** CSS for the hero — asymmetric grid, oversized name via `clamp`, cycle word masked container:
```css
.hero { display: grid; grid-template-columns: 1fr auto; gap: 2rem 3rem;
        align-items: start; padding: 4rem 0 3rem; }
.hero__name { font-size: clamp(3rem, 9vw, 6rem); line-height: 0.95;
              letter-spacing: -0.03em; font-weight: 700; }
.hero__name-line { display: block; }
.hero__tag { font-size: clamp(1.25rem, 3vw, 1.75rem); color: var(--ink-soft);
             margin-top: 1.5rem; }
.hero__cycle { color: var(--green); font-weight: 600;
               display: inline-block; }
.hero__intro { max-width: 34rem; margin-top: 1.5rem; font-size: 1.1rem; }
.hero__links { display: flex; flex-wrap: wrap; gap: 1.25rem; margin-top: 2rem; }
.hero__photo { width: 120px; height: 120px; border-radius: 50%;
               object-fit: cover; }
@media (max-width: 640px) {
  .hero { grid-template-columns: 1fr; }
  .hero__photo { width: 88px; height: 88px; order: -1; }
}
```

**Step 4:** Animated underline-wipe for links (shared style, used site-wide):
```css
.hero__links a, .content a.link-wipe {
  position: relative; color: var(--ink); text-decoration: none;
}
.hero__links a::after {
  content: ""; position: absolute; left: 0; bottom: -2px; height: 2px;
  width: 100%; background: var(--green); transform: scaleX(0);
  transform-origin: left; transition: transform 0.3s var(--ease);
}
.hero__links a:hover::after { transform: scaleX(1); }
```

**Step 5:** `hugo server`; screenshot `/` at 1440px and 390px. Verify: huge name, tagline with green first role, links, photo placement. No motion yet.

**Step 6:** Commit. `git commit -am "feat: kinetic hero markup and layout (static)"`

---

## Task 4: Hero motion JS

**Files:**
- Modify: `themes/minimal/assets/js/main.js` (full rewrite)

**Step 1:** Write the motion module. Everything guards on reduced-motion and pointer type.
```js
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 1. Staggered reveal on load + on scroll (IntersectionObserver)
  const reveals = document.querySelectorAll("[data-reveal]");
  if (reduce) {
    reveals.forEach((el) => el.classList.add("is-in"));
  } else {
    reveals.forEach((el) => el.classList.add("reveal-init"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });
    reveals.forEach((el) => io.observe(el));
  }

  // 2. Cycling role word (slide-up + mask)
  const cycle = document.querySelector("[data-cycle]");
  const roles = window.__ROLES__ || [];
  if (cycle && roles.length > 1 && !reduce) {
    let i = 0;
    setInterval(() => {
      i = (i + 1) % roles.length;
      cycle.classList.add("is-swapping");
      setTimeout(() => { cycle.textContent = roles[i]; cycle.classList.remove("is-swapping"); }, 250);
    }, 2200);
  }

  // 3. Cursor-reactive lean on the hero name (fine pointer only)
  const name = document.querySelector(".hero__name");
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  if (name && finePointer && !reduce) {
    let raf = null;
    window.addEventListener("mousemove", (ev) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const dx = (ev.clientX / window.innerWidth - 0.5) * 6;   // deg
        const dy = (ev.clientY / window.innerHeight - 0.5) * -4;
        name.style.transform = `rotateY(${dx}deg) rotateX(${dy}deg)`;
        raf = null;
      });
    });
  }
})();
```

**Step 2:** Emit `roles` to JS. In `baseof.html` before the script tag:
```html
<script>window.__ROLES__ = {{ site.Params.roles | jsonify }};</script>
```

**Step 3:** CSS for reveal + cycle-swap states:
```css
.reveal-init { opacity: 0; transform: translateY(16px); }
[data-reveal].is-in { opacity: 1; transform: none;
  transition: opacity 0.5s var(--ease), transform 0.5s var(--ease); }
[data-reveal-group] [data-reveal]:nth-child(2) { transition-delay: 0.08s; }
[data-reveal-group] [data-reveal]:nth-child(3) { transition-delay: 0.16s; }
[data-reveal-group] [data-reveal]:nth-child(4) { transition-delay: 0.24s; }

.hero__name { transform-style: preserve-3d; transition: transform 0.2s var(--ease); }
.hero__cycle { transition: opacity 0.25s var(--ease), transform 0.25s var(--ease); }
.hero__cycle.is-swapping { opacity: 0; transform: translateY(-0.4em); }
```

**Step 4:** `hugo server`; verify in browser: name/tagline/links stagger in on load, word cycles every ~2.2s, name leans toward cursor. Then toggle OS "reduce motion" (or emulate in devtools) and confirm everything appears instantly with no animation and the word stops cycling.

**Step 5:** Commit. `git commit -am "feat: hero motion (reveal, word cycle, cursor lean) with reduced-motion guards"`

---

## Task 5: Updates feed

**Files:**
- Create: `data/updates.yaml`
- Create: `themes/minimal/layouts/partials/updates.html`
- Modify: `content/_index.md` (remove the `## Recent Updates` list; keep the intro prose only)
- Modify: `themes/minimal/assets/css/main.css`

**Step 1:** Move the updates into `data/updates.yaml`:
```yaml
- date: "Jan 2026"
  tag: "Substack"
  title: "Launched my personal Substack"
  url: "https://morehouses.substack.com/"
- date: "Dec 2025"
  tag: "JAERE"
  title: "Downwind and Out accepted at JAERE"
  url: "https://www.journals.uchicago.edu/doi/10.1086/740146"
- date: "Nov 2025"
  tag: "Working paper"
  title: "Labor Market Power and Spatial Policies"
  url: "https://cdn.sanity.io/files/l721pa75/production/39b32e107554e81d2f34b5c63bd6fd10155dcc9f.pdf"
```

**Step 2:** `updates.html` partial — timeline with green date chips, each row `data-reveal`:
```html
<section class="updates" data-reveal-group aria-labelledby="updates-h">
  <h2 id="updates-h" class="section-h" data-reveal>Recent updates</h2>
  <ul class="feed">
    {{ range site.Data.updates }}
    <li class="feed__row" data-reveal>
      <span class="feed__date">{{ .date }}</span>
      <div class="feed__body">
        <span class="feed__tag">{{ .tag }}</span>
        <a class="feed__title" href="{{ .url }}" target="_blank" rel="noopener">{{ .title }}</a>
      </div>
    </li>
    {{ end }}
  </ul>
</section>
```

**Step 3:** CSS — hairline-ruled rows, green chip, hover lift:
```css
.section-h { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.12em;
             color: var(--ink-soft); margin: 4rem 0 1.5rem; }
.feed { list-style: none; }
.feed__row { display: grid; grid-template-columns: 6rem 1fr; gap: 1.5rem;
             padding: 1.25rem 0; border-top: 1px solid var(--line); align-items: baseline; }
.feed__date { color: var(--ink-soft); font-size: 0.9rem; }
.feed__tag { display: inline-block; font-size: 0.7rem; text-transform: uppercase;
             letter-spacing: 0.08em; color: var(--green); border: 1px solid var(--green);
             border-radius: 999px; padding: 0.1rem 0.6rem; margin-right: 0.75rem; }
.feed__title { font-weight: 500; }
.feed__row:hover .feed__title { color: var(--green); }
@media (max-width: 640px) { .feed__row { grid-template-columns: 1fr; gap: 0.5rem; } }
```

**Step 4:** `hugo server`; screenshot `/` — confirm feed renders, chips green, rows reveal on scroll.

**Step 5:** Commit. `git commit -am "feat: data-driven updates feed"`

---

## Task 6: Research page

**Files:**
- Create: `data/papers.yaml`
- Create: `content/research.md`
- Create: `themes/minimal/layouts/research.html`
- Modify: `themes/minimal/assets/css/main.css`

**Step 1:** `data/papers.yaml` — explicit order (published first, then working papers exactly LMP → Emmett → JMP → Airbnb). `order` field controls sort; never auto-sort.
```yaml
- order: 1
  status: "Published"
  year: "2025"
  venue: "JAERE"
  title: "Downwind and Out"
  abstract: "TODO: 2–3 line abstract."
  links:
    - { label: "Journal", url: "https://www.journals.uchicago.edu/doi/10.1086/740146" }
- order: 2
  status: "Working paper"
  year: "2025"
  venue: ""
  title: "Labor Market Power and Spatial Policies"
  abstract: "TODO: 2–3 line abstract."
  links:
    - { label: "PDF", url: "https://cdn.sanity.io/files/l721pa75/production/39b32e107554e81d2f34b5c63bd6fd10155dcc9f.pdf" }
- order: 3
  status: "Working paper"
  year: ""
  venue: ""
  title: "TODO: Emmett / climate migration title"
  abstract: "TODO."
  links:
    - { label: "PDF", url: "/files/papers/reynier-morehouse-climate-migration.pdf" }
- order: 4
  status: "Working paper"
  year: ""
  venue: ""
  title: "TODO: JMP title"
  abstract: "TODO."
  links:
    - { label: "PDF", url: "/files/papers/jmp.pdf" }
- order: 5
  status: "Working paper"
  year: ""
  venue: ""
  title: "TODO: Airbnb title"
  abstract: "TODO."
  links:
    - { label: "PDF", url: "/files/papers/airbnb.pdf" }
```
> **STOP:** ask John for the real titles/abstracts and which slides (`aere_pres`, `frb`, `mea`, `osweet`) attach to which paper before finalizing.

**Step 2:** `content/research.md` with `layout: research`, title "Research".

**Step 3:** `research.html`:
```html
{{ define "main" }}
<h1 class="page-h" data-reveal>Research</h1>
<div class="papers" data-reveal-group>
  {{ range sort site.Data.papers "order" }}
  <article class="paper" data-reveal>
    <div class="paper__meta">
      {{ with .year }}<span>{{ . }}</span>{{ end }}
      <span class="paper__status">{{ .status }}{{ with .venue }} · {{ . }}{{ end }}</span>
    </div>
    <h2 class="paper__title">{{ .title }}</h2>
    <p class="paper__abstract">{{ .abstract }}</p>
    <div class="paper__links">
      {{ range .links }}<a class="btn-ghost" href="{{ .url }}" target="_blank" rel="noopener">{{ .label }}</a>{{ end }}
    </div>
  </article>
  {{ end }}
</div>
{{ end }}
```

**Step 4:** CSS — ruled entries, uppercase meta, ghost buttons revealed/emphasized on hover:
```css
.page-h { font-size: clamp(2.5rem, 6vw, 4rem); letter-spacing: -0.02em; margin: 2rem 0 3rem; }
.paper { padding: 2rem 0; border-top: 1px solid var(--line); transition: transform 0.3s var(--ease); }
.paper:hover { transform: translateX(4px); }
.paper__meta { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em;
               color: var(--ink-soft); display: flex; gap: 0.75rem; margin-bottom: 0.5rem; }
.paper__status { color: var(--green); }
.paper__title { font-size: 1.6rem; margin-bottom: 0.75rem; }
.paper__abstract { color: var(--ink-soft); max-width: 42rem; margin-bottom: 1rem; }
.paper__links { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.btn-ghost { border: 1px solid var(--ink); border-radius: 6px; padding: 0.4rem 0.9rem;
             font-size: 0.85rem; color: var(--ink); transition: all 0.2s var(--ease); }
.btn-ghost:hover { background: var(--green); border-color: var(--green); color: #fff; text-decoration: none; }
```

**Step 5:** `hugo server`; visit `/research/`; screenshot. Verify order is exactly published-first then LMP→Emmett→JMP→Airbnb.

**Step 6:** Commit. `git commit -am "feat: data-driven research page"`

---

## Task 7: Writing page (Substack RSS at build time)

**Files:**
- Create: `content/writing.md`
- Create: `themes/minimal/layouts/writing.html`
- Modify: `themes/minimal/assets/css/main.css`

**Step 1:** `content/writing.md` with `layout: writing`, title "Writing".

**Step 2:** `writing.html` — fetch `morehouses.substack.com/feed` via `resources.GetRemote`, parse with `transform.Unmarshal`, render latest ~6 items; graceful fallback card on failure.
```html
{{ define "main" }}
<h1 class="page-h" data-reveal>Writing</h1>
{{ $feed := resources.GetRemote "https://morehouses.substack.com/feed" }}
{{ if and $feed (not $feed.Err) }}
  {{ $data := $feed.Content | transform.Unmarshal }}
  <ul class="posts" data-reveal-group>
    {{ range first 6 $data.channel.item }}
    <li class="post" data-reveal>
      <a class="post__title" href="{{ .link }}" target="_blank" rel="noopener">{{ .title }}</a>
      <p class="post__desc">{{ .description | plainify | truncate 160 }}</p>
    </li>
    {{ end }}
  </ul>
{{ else }}
  <a class="btn-ghost" href="{{ site.Params.social.substack }}" target="_blank" rel="noopener">Read on Substack →</a>
{{ end }}
{{ end }}
```
> Note: verify the actual RSS field names against a live fetch — Substack RSS is standard RSS 2.0 (`channel.item[].title/link/description/pubDate`). If `transform.Unmarshal` chokes on the XML, fall back to the "Read on Substack" card (already the else branch) and log a TODO to revisit.

**Step 3:** CSS for `.posts/.post/.post__title/.post__desc` mirroring the feed styling.

**Step 4:** `hugo server` (network required for the remote fetch); visit `/writing/`; screenshot. Also test the fallback by temporarily breaking the URL.

**Step 5:** Commit. `git commit -am "feat: writing page with build-time Substack feed"`

---

## Task 8: About + photo strip

**Files:**
- Modify: `content/about.md`
- Modify: `themes/minimal/layouts/page.html` (or add an `about.html`)
- Modify: `themes/minimal/assets/css/main.css`

**Step 1:** Add a curated asymmetric photo strip below the about prose using the existing images (`croatia.jpg`, `lucerne.jpg`, `gravel.jpeg`, `hains.jpeg`). Simplest: a shortcode or a hardcoded block in `about.html`.
```html
<div class="photostrip" data-reveal-group>
  <figure class="photostrip__item" data-reveal><img loading="lazy" src="/images/croatia.jpg" alt="Croatia"><figcaption>Croatia</figcaption></figure>
  <figure class="photostrip__item" data-reveal><img loading="lazy" src="/images/lucerne.jpg" alt="Lucerne"><figcaption>Lucerne</figcaption></figure>
  <figure class="photostrip__item" data-reveal><img loading="lazy" src="/images/gravel.jpeg" alt="Gravel riding"><figcaption>Gravel</figcaption></figure>
  <figure class="photostrip__item" data-reveal><img loading="lazy" src="/images/hains.jpeg" alt="Hains Point"><figcaption>Hains Point</figcaption></figure>
</div>
```
> **STOP:** confirm captions/locations with John.

**Step 2:** CSS — offset sizes (not a uniform grid), subtle hover zoom:
```css
.photostrip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin: 2.5rem 0; }
.photostrip__item { overflow: hidden; border-radius: 8px; margin: 0; }
.photostrip__item:nth-child(2) { transform: translateY(2rem); }
.photostrip__item:nth-child(4) { transform: translateY(2rem); }
.photostrip__item img { width: 100%; height: 220px; object-fit: cover; display: block;
                        transition: transform 0.5s var(--ease); }
.photostrip__item:hover img { transform: scale(1.06); }
.photostrip__item figcaption { font-size: 0.8rem; color: var(--ink-soft); padding: 0.5rem 0; }
@media (max-width: 640px) {
  .photostrip { grid-template-columns: repeat(2, 1fr); }
  .photostrip__item:nth-child(n) { transform: none; }
}
```

**Step 3:** `hugo server`; visit `/about/`; screenshot desktop + mobile.

**Step 4:** Commit. `git commit -am "feat: about page photo strip"`

---

## Task 9: Restyle Contact + CV + generic pages + header/footer

**Files:**
- Modify: `themes/minimal/layouts/page.html`
- Modify: `themes/minimal/assets/css/main.css`
- Modify: `content/contact.md` if needed

**Step 1:** Restyle header (site title in Display face, thin rule instead of the old green gradient bar), nav with underline-wipe + active state, footer minimal.

**Step 2:** Restyle `.btn` (CV button) to match `.btn-ghost` family or a solid green variant; ensure contact items use the new type scale.

**Step 3:** `hugo server`; screenshot `/contact/` and confirm header/footer consistent across all pages.

**Step 4:** Commit. `git commit -am "feat: restyle header, footer, contact, buttons"`

---

## Task 10: Global polish + accessibility + reduced-motion audit

**Files:**
- Modify: `themes/minimal/assets/css/main.css`, `themes/minimal/assets/js/main.js`

**Step 1:** Add global `@media (prefers-reduced-motion: reduce) { *,*::before,*::after { animation: none !important; transition: none !important; } }` as a safety net, and confirm `.is-in` fallback covers all reveal elements.

**Step 2:** Check color contrast (ink/green on paper ≥ AA), focus-visible outlines on all links/buttons, `alt` text on images, heading order.

**Step 3:** Run Lighthouse (or agent-browser audit) on `/` — confirm no CLS from fonts/images, performance stays green.

**Step 4:** Commit. `git commit -am "chore: a11y and reduced-motion polish"`

---

## Task 11: Responsive pass + final screenshots

**Step 1:** Screenshot every page at 1440px and 390px: `/`, `/research/`, `/writing/`, `/about/`, `/contact/`.

**Step 2:** Fix any overflow, cramped spacing, or broken grids on mobile.

**Step 3:** Present the full screenshot set to John for sign-off. **STOP for review.**

**Step 4:** Commit any fixes. `git commit -am "fix: responsive polish"`

---

## Task 12: Finish the branch

**REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch.

**Step 1:** Final `hugo --quiet --gc` (exit 0).

**Step 2:** Confirm `main` vs `redesign` diff is only intended files.

**Step 3:** Merge to `main` (or open a PR), then remove the worktree.

---

## Open items to confirm with John during execution (batch these)
1. Font pairing (Task 0).
2. Real paper titles + abstracts; slide-deck → paper mapping (Task 6).
3. Photo captions/locations (Task 8).
4. Whether to keep the CV as a nav link to the PDF or add an HTML CV page later (out of scope for now).
