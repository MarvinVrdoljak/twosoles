---
name: nextjs-app-setup
description: >
  Scaffold and maintain a clean Next.js (App Router) project with the team's
  conventions: a strict 3-layer CSS architecture (design tokens + base reset +
  CSS Modules) processed by PostCSS (postcss-pxtorem, custom-media,
  preset-env), a flat feature-grouped components folder where each component
  owns a co-located .module.css, and next-intl v4 internationalization with a
  [locale] segment. Use this when starting a NEW Next.js project, adding a
  component, writing CSS, or wiring up i18n. NO Tailwind, NO CMS/Payload.
---

# Next.js App-Router Project Setup

This skill encodes the team's house style for a **plain Next.js App-Router**
project (React 19, Next 15+) deployed on **Vercel**, with **no CMS** and **no
Tailwind**. Pages are mostly statically generated (SSG), but the full Next.js
runtime is available — middleware runs normally.

**The core of this skill is the frontend: a CSS architecture you can style
freely and predictably (§1).** The components folder (§2) and i18n (§3) support
that.

Ready-to-copy template files live in `templates/` next to this file. When
scaffolding a fresh project, copy them into the project root and adjust the
tokens/messages. When working in an existing project, follow the rules below.

---

## Golden rules (TL;DR)

Act on these first; the sections below are the detail.

- **TypeScript is mandatory and strict.** No `any`. Model the domain with
  precise, well-named types/interfaces — types are part of "semantically clean".
- **CSS values come from tokens only** (`var(--…)`); write `px`, never
  hand-write `rem`; **no Tailwind**.
- **One semantic class per element**, short and local. No descendant selectors,
  no BEM, no global selectors inside modules.
- **Components live at** `components/<domain>/<Prefix><Name>.tsx` with a matching
  `<Prefix><Name>.module.css` (`blocks/BlockForm.tsx`, `common/CommonButton.tsx`).
- **Keep components focused** (~150 lines = look for a split) but **don't
  over-fragment**; when the right granularity is unclear, **ask the user**.
- **Use semantic HTML + basic a11y**: correct element, heading order, `alt`,
  associated labels.
- **i18n via next-intl**: import `Link`/navigation from `@/i18n/navigation`
  (never `next/*`); keep `de`/`en` keys in sync; keys are type-checked.
- **Default to Server Components**; add `'use client'` only at interactive leaves.
- **Linters are the source of truth**: `stylelint` enforces the CSS rules and
  `tsc` enforces the types — run them, don't fight them.

---

## 0. Bootstrapping a new project

1. `npx create-next-app@latest` → choose **App Router**, **TypeScript**,
   **No Tailwind**, **`@/*` import alias**, **`src/` no** (this house style
   keeps `app/`, `components/`, `styles/`, `i18n/` at the package root).
2. Install dependencies:
   ```
   npm i next-intl
   npm i -D postcss postcss-import postcss-custom-media postcss-preset-env \
            postcss-pxtorem @csstools/postcss-global-data \
            stylelint stylelint-config-standard prettier
   ```
3. Copy the template tree from `templates/` into the project:
   - `styles/` (the whole 3-layer tree) ← the part that matters most
   - `postcss.config.cjs`
   - `i18n/` (`routing.ts`, `request.ts`, `navigation.ts`, `messages/`)
   - `global.d.ts` (type-safe i18n messages + locale)
   - `middleware.ts`
   - `app/[locale]/layout.tsx` + `app/[locale]/page.tsx`
   - example components (`components/common/CommonButton.*`, `CommonImage.tsx`)
     to anchor the pattern
   - `next.config.mjs` (wires the next-intl plugin)
   - `.stylelintrc.cjs` + `.prettierrc`
4. Confirm `tsconfig.json` has `"strict": true` and `"paths": { "@/*": ["./*"] }`.
5. Add scripts to `package.json`:
   `"lint:css": "stylelint \"**/*.css\""`, `"typecheck": "tsc --noEmit"`.

---

## 1. CSS Architecture — 3 layers

> **PostCSS contract:** all CSS is processed through PostCSS. Write **`px`**
> everywhere — `postcss-pxtorem` converts to `rem` at build time. **Never write
> `rem` by hand**; it won't be converted and breaks the scaling contract.
> (`html`/`body` are blacklisted so root font-size stays in px.)

The cascade is controlled with a single declared layer order at the top of
`globals.css`:

```css
@layer base, components, utilities;

@import './base/index.css';
@import './components/index.css';
```

### Layer 1 — Design tokens (`styles/base/tokens.css`)
Single source of truth for every visual value: colors, spacing, radii,
typography. Defined as CSS custom properties on `:root`.

- NEVER hardcode a color, spacing, or radius in component CSS
  (no `#3b82f6`, no raw `16px` for spacing, no `8px` for radius).
- ALWAYS reference via `var(--token-name)`.
- Missing a value? Add the token to `tokens.css` first, then use it.
- Fluid typography uses `clamp(min, preferred, max)` — never JS for font
  scaling. Responsive token jumps go in `@media (--bp-*)` blocks on `:root`.

### Layer 2 — Base / reset (`styles/base/base.css`)
Minimal reset + base element typography (body, headings, links, button reset),
all inside `@layer base`. NEVER override base element styles from a component
module — fix them here.

### Layer 3 — Components (CSS Modules)
Every component has a co-located `.module.css`. Class names are short, local,
and semantic — **no BEM**, **no global selectors**, **no nested descendant
selectors** (`.root li`, `.root > a`):

- Give every element its own class: `.root`, `.item`, `.link`, `.icon`, `.label`.
- JSX assigns each class explicitly:
  `<a className={styles.link}><Icon className={styles.icon} /></a>`.
- Inline `style={{}}` is allowed **only** for truly runtime-dynamic values
  (e.g. a computed width). Never for static design values.

### Where does a layout class go?

| Type | Example | Where |
| --- | --- | --- |
| Structural app/page wrapper | `.layout`, `.grid` | `styles/base/utilities.css` → `@layer utilities` |
| Page/feature-specific layout | `.heroSection`, `.sidebarLayout` | the page's `page.module.css` |
| Component-internal layout | `.root`, `.wrapper`, `.header` | the component's `.module.css` |

Rule: appears in >1 place → `@layer utilities`. Used exactly once → that
page/component module. Global utilities and module classes combine freely in
JSX: `className={\`${styles.layout} grid\`}`.

Keep global utilities **minimal** — only genuinely structural, app-wide
patterns (the centered `.grid` container, the `.layout` shell). Resist adding
generic helpers like `.stack` / `.row`: they describe *how* not *what*, which
fights the "semantic class per element" rule and drifts toward mini-Tailwind. A
two-line `display: flex; gap: …` is clearer written directly in the component's
`.root`. Let utilities grow organically: promote a pattern only once it's
actually repeated.

### Breakpoints — `styles/base/media.css`
CSS Level 5 `@custom-media`, made available to all files via
`@csstools/postcss-global-data`.

- NEVER hardcode a breakpoint (`@media (max-width: 768px)`).
- ALWAYS use tokens: `@media (--bp-medium-up) { … }`.
- Mobile-first: default = mobile, `*-up` tokens enhance upward.
- ALWAYS nest media queries **inside** the selector, not as separate blocks.

```css
.nav {
  display: none;
  @media (--bp-medium-up) {
    display: flex;
  }
}
```

### How CSS reaches a component
- `globals.css` is imported **once**, in the root `app/[locale]/layout.tsx`:
  `import '@/styles/globals.css'`.
- Component styles are imported per file: `import styles from './CommonButton.module.css'`.
- Global atom styles that aren't tied to one React component
  (e.g. a `.button` used in rich text / markup) live in
  `styles/components/*.css` and are aggregated by `styles/components/index.css`.

### No Tailwind
No Tailwind classes in any JSX/TSX, no `tailwind.config.js`. Layout and spacing
are handled entirely via CSS Modules + tokens.

### Styling a new component — the everyday workflow
This is the loop you'll run most often. Keep it tight:

1. Create the folder `components/MyThing/` with `MyThing.tsx` + `MyThing.module.css`.
2. In the `.tsx`, give **every** styled element its own semantic class from
   `styles` (`.root`, `.title`, `.list`, `.item`, `.icon`) — no descendant
   selectors, no styling bare tags.
3. In the `.module.css`, write plain `px` and reference `var(--…)` tokens for
   colors/spacing/radii. Need a value that has no token? Add it to `tokens.css`
   first.
4. Responsive tweaks go **nested** inside the selector with `@media (--bp-*-up)`.
5. If the same layout shows up again elsewhere → promote it to
   `@layer utilities` in `utilities.css`.

Want a one-off custom look for a single instance? Compose classes in JSX —
`className={\`${styles.root} grid\`}` — rather than reaching for inline styles.

### Pre-submit CSS checklist
- [ ] All color/spacing/radius values use `var(--…)` tokens
- [ ] Every component has a `.module.css`; classes are short, local, no BEM
- [ ] No nested descendant selectors inside modules
- [ ] No hardcoded values outside `tokens.css`
- [ ] No hand-written `rem` (write `px`)
- [ ] No inline styles for static values
- [ ] No Tailwind
- [ ] Reusable layout in `@layer utilities`, not duplicated
- [ ] Responsive type uses `clamp()`; breakpoints use `@custom-media`

---

## 2. Components folder — naming & file layout

Group by **domain folder**. Inside a domain, files are **flat** and the
filename is **prefixed with the domain**, with a co-located `.module.css` of the
exact same name:

```
components/
  blocks/                  # page sections — prefix Block
    BlockForm.tsx
    BlockForm.module.css
    BlockAccordion.tsx
    BlockAccordion.module.css
    richTextBlocks/        # sub-group only when a domain grows large
      BlockImage.tsx
      BlockImage.module.css
  common/                  # shared low-level atoms — prefix Common
    CommonButton.tsx
    CommonButton.module.css
    CommonImage.tsx
  layout/                  # structural shells — prefix Layout (LayoutWrapper…)
  globals/                 # site-wide singletons — prefix Global (GlobalHeader, GlobalFooter)
  form/                    # form + field components — prefix Form
  context/                 # React context providers
```

Naming rules (match these exactly — this is the house convention):
- **PascalCase, prefixed with the domain**: `Block*`, `Common*`, `Layout*`,
  `Global*`, `Form*`. The prefix tells you the folder at a glance.
- The `.module.css` filename **mirrors the component**: `BlockForm.tsx` →
  `BlockForm.module.css`.
- Keep each domain folder flat; add a sub-folder (e.g. `richTextBlocks/`) only
  once a domain is big enough to warrant grouping.
- Pick the domain by role: reusable atom → `common`, page section → `blocks`,
  structural shell → `layout`, site-wide singleton → `globals`.
- Default to **Server Components**. Add `'use client'` only when the component
  needs state, effects, browser APIs, or event handlers.

### Keep components small & maintainable — NOT automatic, be proactive
Left alone, a model produces one oversized file. Don't. Actively decompose so
the result is semantically clean and easy to maintain:

- **One component = one responsibility.** If you describe it with "… and …",
  it should be two components.
- **Soft ceiling ~150 lines per `.tsx`.** Past that, find a self-contained
  chunk to extract — don't keep scrolling.
- **Extract repeated or self-contained JSX** into its own prefixed component in
  the same domain (e.g. `BlockForm` renders `BlockFormField`s).
- **Keep the render thin.** Move data shaping into `utility/` helpers or custom
  `hooks/`; JSX should read like markup, not logic.
- **Co-locate truly local sub-parts**; promote a piece to `common/` only once
  it's reused across domains.
- **Composition over prop explosion.** A pile of boolean/variant props is a
  smell — it's usually two clearer components.

**Don't over-fragment, though.** Small is a means, not the goal — splitting must
*earn its keep*. Don't spawn dozens of one-line files just to hit a line count.
Extract only when a chunk is genuinely **reused**, **independently testable**,
or **conceptually its own thing**. A cohesive 180-line component that reads top
to bottom beats five 30-line files you have to jump between. The ~150-line mark
is a prompt to *look*, not a hard cut.

**When the right granularity is genuinely unclear → ask the user** rather than
guessing. A quick "keep this as one component, or split out X and Y?" is better
than silently over- or under-splitting.

### Semantic HTML & accessibility
"Semantically clean" means the *markup*, not just class names:

- Use the **right element**: `<button>` for actions, `<a>`/`<Link>` for
  navigation, `<nav>`/`<header>`/`<main>`/`<footer>` for landmarks, `<ul>/<li>`
  for lists. Never a clickable `<div>`.
- **One `<h1>` per page**; don't skip heading levels — order by structure, size
  with tokens (don't pick `<h3>` "because it looks right", style an `<h2>`).
- Every image has a meaningful **`alt`** (empty `alt=""` only when decorative).
- Form fields have an associated **`<label>`** (`htmlFor`/`id`).
- Interactive custom elements get the right `aria-*`/role and are keyboard-usable.

### Images
- Use **`next/image`** for all raster images (lazy-loading, sizing, no layout
  shift), via the **`CommonImage`** wrapper so handling stays consistent.
- Always pass `alt`, plus `width`/`height` (or `fill` + a sized container).

### Component "definition of done"
- [ ] File is `components/<domain>/<Prefix><Name>.tsx` with matching `.module.css`
- [ ] Fully typed — explicit `Props` interface, no `any`
- [ ] Single responsibility; not over-large and not needlessly fragmented
- [ ] Server Component unless it genuinely needs the client
- [ ] Semantic HTML + `alt`/labels where applicable
- [ ] Every styled element has its own module class (no descendant selectors)
- [ ] `tsc --noEmit` and `stylelint` pass

---

## 3. Internationalization — next-intl v4

Locale lives in the URL via a `[locale]` route segment. `localePrefix` is
`'as-needed'` (the default locale has no prefix). Files:

```
i18n/
  routing.ts       # locales, defaultLocale, localePrefix (single source of truth)
  request.ts       # getRequestConfig → loads messages/<locale>.json per request
  navigation.ts    # locale-aware Link, redirect, usePathname, useRouter
  messages/
    de.json
    en.json
middleware.ts      # createMiddleware(routing) — locale negotiation + redirects
```

Wiring:
- `next.config.mjs` wraps the config with `createNextIntlPlugin('./i18n/request.ts')`.
- `middleware.ts` runs `createMiddleware(routing)` for locale negotiation and the
  `/` → default-locale redirect (runs on Vercel's edge/runtime).
- `app/[locale]/layout.tsx` validates the locale, calls `setRequestLocale(locale)`
  (enables static rendering) and wraps children in `<NextIntlClientProvider>`.
- `generateStaticParams` returns every locale so locale routes are pre-rendered.

Using translations:
- **Server Components:** `const t = await getTranslations('home')` → `t('title')`.
- **Client Components:** `const t = useTranslations('home')` (must be under the provider).
- **Active locale:** `useLocale()` (client) / `await getLocale()` (server).
- **Linking:** import `Link` / `useRouter` / `usePathname` from `@/i18n/navigation`,
  never from `next/*`, or the locale prefix breaks.
- Keep `de.json` / `en.json` structurally identical; keys are namespaced.

Adding a locale: add it to `routing.ts` `locales` + add `messages/<locale>.json`.
That is the only place locales are declared.

---

## 4. TypeScript — mandatory & semantic

TypeScript is **required** everywhere (no `.js`/`.jsx` source, no untyped
escapes). Types are part of clean, maintainable code — treat them with the same
care as the runtime code.

- `tsconfig.json` runs with **`"strict": true`**. Keep it on.
- **No `any`.** If a type is truly unknown, use `unknown` and narrow. No
  `@ts-ignore` without a one-line justification comment.
- **Every component has an explicit `Props` interface/type**, named
  `<Component>Props`. Avoid inline anonymous prop objects for non-trivial props.
- **Model the domain with precise types**: prefer string-literal unions over
  bare `string` (`type Variant = 'primary' | 'ghost'`), `readonly` where data
  isn't mutated, and discriminated unions over loose optional fields.
- **Derive, don't duplicate**: use `typeof`, `keyof`, `Pick`/`Omit`, and infer
  from a single source (e.g. message keys come from `en.json` via `global.d.ts`).
- **Type at the boundary**: API/JSON responses, params, and search params get a
  type at the edge so the rest of the code is sound.
- Run **`tsc --noEmit`** as part of "done" — a green typecheck is non-negotiable.

---

## 5. Optional enhancements (suggest to the user)

Bring these up when relevant; don't add unprompted:
- **ESLint** (`eslint-config-next` + `@typescript-eslint`) to complement
  Prettier/Stylelint with code-logic rules. (Prettier + Stylelint are already
  shipped as templates.)
- **A `cz`/commit convention** (the source repo uses Conventional Commits +
  Husky pre-commit hooks running `lint:css` + `typecheck`).
- **`next/font`** for self-hosted Google fonts exposed as CSS variables
  (`--font-sans` → `--font-body`/`--font-heading`) — already in the layout template.
- **`generateMetadata`** per page for localized SEO + a localized `sitemap`.
- **A `clsx`/`cn` helper** for conditional class composition with CSS Modules.
