# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this is

A Vue 3 + TypeScript + Tailwind v4 SPA that converts IPv4 network lists between CIDR (`172.16.0.0/12`) and a human-readable octet format (`172.[16-31].X.X`), and builds WireGuard `AllowedIPs` from a deny list (complement of the IPv4 space). IPv4 only, strictly: IPv6 entries are reported as errors. UI copy is in English.

## Commands

pnpm only (version pinned in `packageManager`), Node 24 (`.nvmrc`).

```sh
pnpm dev                 # Vite dev server on :5173
pnpm build               # vue-tsc type-check + vite build (in parallel)
pnpm type-check          # vue-tsc --build (app, node and vitest tsconfigs)
pnpm lint                # oxlint, then eslint (no autofix); `pnpm lint:fix` to fix
pnpm format              # prettier --write . ; `pnpm format:check` in CI
pnpm test:unit           # vitest run (all unit tests)
pnpm test:unit:watch
pnpm test:coverage       # enforces 100% coverage for src/domain/**
pnpm test:e2e            # playwright, chromium only
```

Single test: `pnpm exec vitest run src/domain/ip/__tests__/readable.spec.ts -t "rejects"`; e2e: `pnpm exec playwright test -g "deny list"`.

E2E locally reuses a running dev server on :5173 (otherwise starts one); with `CI=1` it runs against `pnpm preview` on :4173, so run `pnpm build-only` first. Chromium must be installed once: `pnpm exec playwright install chromium`.

A pre-commit hook (husky, `.husky/pre-commit` → lint-staged) runs oxlint, eslint and prettier on staged files. Commits from GUI clients rely on the developer's `~/.config/husky/init.sh` to put node/pnpm on `PATH`; don't hard-code machine-specific paths into the hook.

pnpm enforces a minimum release age for packages; vitest is deliberately pinned to 4.x because 5.x was too new. Don't add `minimumReleaseAgeExclude` entries to get around it.

## Architecture

**`src/domain/ip/`** is a framework-free core (no Vue imports). Its public API is `index.ts`: `convertList(input, 'cidr' | 'readable')`, `denyToAllowed(input)`, `joinList`. All conversions go through one canonical model:

1. `tokenize.ts` splits free-form input into entries with 1-based line numbers. Separators are newlines, commas and whitespace, except whitespace inside `[...]`. It strips `# comments` and any `Key =` prefix (a pasted WireGuard line).
2. `parse-list.ts` detects each entry's format (`detectFormat`: contains `:` → IPv6 error; digits/dots with optional `/…` → CIDR; anything else → readable). It parses the entry into inclusive `Interval`s (uint32 `start`/`end`) and collects `Issue`s (`error` | `warning`, with line and entry). Valid entries still convert when others fail. Bare addresses count as CIDR `/32`.
3. `interval.ts` normalizes (sort + merge overlapping/adjacent intervals) and computes the complement.
4. Rendering per interval: `cidr.ts#intervalToCidrs` gives the minimal CIDR cover; `readable.ts#intervalToReadable` does a recursive octet-level head/middle/tail split into minimal readable patterns.

Domain rules that tests depend on:

- Readable octets are `N`, `[A-B]` or `X`. Once `X` appears, only `X` may follow. Ranges in several octets form a cartesian product, capped at `MAX_PATTERN_INTERVALS`.
- Leading zeros are rejected.
- CIDR host bits produce a warning and are normalized to the network address.

Parsers return `ParseOutcome<T>` (`result.ts`) instead of throwing.

Tests live in `__tests__/` folders next to the code (the tsconfigs exclude and include them by that path). `roundtrip.spec.ts` checks random interval sets against an independent reference CIDR implementation with a seeded PRNG.

**`src/features/converter/`** is the UI on top of the domain:

- `modes.ts` defines the three modes as data (`ConverterMode`: labels, example, output format, optional `wireguardKey`, `convert` function). Adding or changing a mode is mostly a change here.
- `router/index.ts` generates one route per mode, all using the same `ConverterView` with the mode passed as a prop. `App.vue` keys `<RouterView>` by route name, so the view (and `useConverter`) is re-created per mode and treats `mode` as constant.
- `useConverter.ts` holds the input (VueUse `useStorage`, persisted per mode: `cidr-readable:input:<mode>`), the list style (`lines` | `wireguard`, shared across modes, only applies to CIDR output) and the derived result and output text. When `mode.wireguardKey` is set, the WireGuard style renders as `AllowedIPs = a, b, c`.

**`src/components/`** holds generic UI (`ui/`: `BaseButton`, the generic `SegmentedControl`, `CopyButton` built on VueUse `useClipboard`) and the layout pieces.

## Conventions and gotchas

- Hash history (`createWebHashHistory`) is required because GitHub Pages has no SPA fallback. Vite `base` comes from the `BASE_PATH` env var (the deploy workflow sets `/<repo>/`). Reference static assets through imports (`@/assets/...`), not absolute `/...` paths in templates, so the base path applies.
- ESLint runs `strictTypeChecked` + `stylisticTypeChecked`, and Vue files must use `<script setup lang="ts">`. `non-nullable-type-assertion-style` is off on purpose: it conflicts with `no-non-null-assertion`, so use explicit `as` casts.
- E2E tests locate inputs with `getByRole('textbox', { name })`. `getByLabel` is ambiguous here because each panel `<section>` is labelled by the same heading.
- In unit tests, `useStorage` writes flush on a watcher, so `await nextTick()` before another instance reads them. Mock `useClipboard` at the module boundary: jsdom has no Permissions API, so VueUse falls back to `execCommand`.
- CI (`.github/workflows/ci.yml`) runs lint, format check, type-check, coverage, build and e2e. `deploy.yml` publishes to GitHub Pages only after CI succeeds on `main`.
