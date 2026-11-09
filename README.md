# Fly Emirates Design Spec

A machine-readable specification of the Fly Emirates concept design system: design tokens, component and pattern specs, layout rules, accessibility and right-to-left guidelines, and JSON Schemas. It is structured so that tools and AI agents can fetch exactly the piece they need, such as one component, one token or one pattern, without reading the whole system.

> **Unofficial concept.** Emirates' brand guidelines are not public; the logo and typefaces are proprietary. Nothing here is endorsed by Emirates. Every value states where it came from. Only values with confidence **`official`** come from Emirates sources.

**This package is a specification only.** Nothing is designed in Figma, implemented in code or tested yet: every component has `designed: false`, `implemented: false`, `tested: false`.

## Contents

| Path | What it is |
|---|---|
| `manifest.json` | Entry point: resources, counts, vocabulary (confidence, status, layers), retrieval hints |
| `tokens/tokens.json` | 223 tokens in W3C DTCG format, each with its exact CSS output, breakpoint and Arabic values, source attribution and the components that use it |
| `tokens/values.json` | Compact lookup (20 KB, one line per token): CSS name → value, resolved literal, breakpoint and Arabic values, confidence |
| `tokens/tokens.css` | CSS custom properties (identical to `design-system/tokens/tokens.css`) |
| `tokens/fonts.css`, `tokens/fonts/` | Arabic font (Noto Sans Arabic subset, SIL OFL; licence in `tokens/fonts/OFL.txt`) |
| `components/index.json` | All 34 components: id, layer, status, confidence, relationships, path |
| `components/{id}/spec.json` | One component: variants, props, states, interaction, accessibility, responsive, RTL, tokens, sources, ambiguities |
| `patterns/index.json`, `patterns/{id}.json` | 8 patterns: page shell, home, results, booking flow, seat selection, destination grid, cabin page, booking state model |
| `layouts/layouts.json` | Breakpoints, grid, containers, per-breakpoint changes, surface layers |
| `foundations/*.md` | Colour, typography, spacing, shapes (radius, borders, elevation), icons: rules in brief |
| `accessibility/guidelines.md` | WCAG 2.2 AA baseline and acceptance criteria |
| `rtl/guidelines.md` | Right-to-left and Arabic rules |
| `references/sources.json` | Source documents (with hashes), source-tag definitions, decision log D1–D24 |
| `schemas/` | JSON Schemas (draft 2020-12) for every JSON file above |

### Components

- **Design system** (`inDesignSystem: true`). Primitives: `button`, `badge`, `icon`, `text`, `divider`, `card`, `media`, `text-field`, `overlay`. Composites: `price-display`, `counter`, `segmented-control`, `combobox`, `date-field`, `accordion`, `flight-segment`, `seat`.
- **Feature layer** (`inDesignSystem: false`): assembled in the product from the above and specified for completeness. `flight-search-widget`, `passenger-selector`, `airport-option`, `flight-result-card`, `fare-options`, `date-strip`, `seat-map`, `seat-legend`, `booking-summary`, `sticky-cta-bar`, `step-progress`, `destination-card`, `cabin-feature-card`, `promo-panel`, `hero-banner`, `global-header`, `global-footer`.
- **Presets** are not separate components (`aliases` in `components/index.json`): FlightStatusBadge, AircraftBadge, TierBadge (→ `badge`), LuxuryActionButton, SwapButton (→ `button`). FareOptionsMatrix is another name for `fare-options`.

## Vocabulary

| Field | Values |
|---|---|
| `confidence` | `official` (verified Emirates source) · `observed` (read from the live emirates.com by a third party) · `inferred` (unverified third-party claim, "File A") · `proposed` (design-system recommendation) · `unattributed` (the source documents give no source for this value). For tokens, `confidence` is that of the base `:root` value; `source.modes` lists breakpoint or Arabic values whose confidence differs |
| `source.tag` | The source tag exactly as written in the original document. `mixed: true` when it cites more than one source; `approved: true` for recommendations approved over an observed value; `decisions` lists D-numbers |
| `status.specification` | `complete` (props, states and accessibility documented) or `partial` (described, not fully specified; `evidence` says what's missing) |
| `layer` | `primitive` (Tier 1) · `composite` (Tier 2) · `feature` |

## Install locally

The package is `private` and not published. Use it from the repository:

```bash
# from another project
npm install ../fly-emirates/design-spec          # or: npm install file:../fly-emirates/design-spec
# or produce a tarball
cd design-spec && npm pack                       # → your-scope-fly-emirates-design-spec-0.1.0.tgz
```

`@your-scope` is a placeholder scope. Choose the real scope, set a licence and remove `"private": true` before publishing. Don't assume the name is available on npm.

## Use

```js
// Node 20+ / bundlers with import attributes
import manifest from '@your-scope/fly-emirates-design-spec' with { type: 'json' };
import components from '@your-scope/fly-emirates-design-spec/components' with { type: 'json' };
import button from '@your-scope/fly-emirates-design-spec/components/button' with { type: 'json' };
import values from '@your-scope/fly-emirates-design-spec/tokens/values.json' with { type: 'json' };
values.tokens['--color-action-primary']; // { value: 'var(--red-500)', resolved: '#D71921', confidence: 'observed' }
```

```css
@import "@your-scope/fly-emirates-design-spec/tokens.css";
@import "@your-scope/fly-emirates-design-spec/fonts.css";
```

Look up a token by CSS name in `tokens/values.json`. For full attribution, walk `tokens.json` and match `$extensions["com.flyemirates.css"].name`; follow `{group.token}` references in `$value` for relationships, and `com.flyemirates.usedBy` for the components that consume it.

## For AI agents

Read selectively, in this order:

1. **`manifest.json`**: what exists, the vocabulary, counts, and what is *not* implemented.
2. **`components/index.json`** or **`patterns/index.json`**: pick ids; each entry has layer, status, confidence, `composes`, `usedBy`, `patterns` and a path.
3. **One spec** (`components/button/spec.json`): everything needed to design, implement, test or document that component. Its `tokens` list resolves in `tokens/values.json` (small; load `tokens.json` only for attribution details); `composes` points to other specs; `sources` point to the original documents in `references/sources.json`.
4. Load `foundations/`, `accessibility/guidelines.md`, `rtl/guidelines.md` or `layouts/layouts.json` only when the task needs them.

Rules for agents:
- Never present a value as an Emirates brand fact unless its confidence is `official`.
- Respect `inDesignSystem`: feature-layer components belong to the product, not the design-system package.
- Read `ambiguities` before generating code; they mark conflicts and gaps that were not resolved.
- Prices are never computed on the client (pattern `booking-state`); no pricing or seat-map API contract is defined here.

Everything is plain JSON, Markdown and CSS. Nothing depends on a particular AI vendor or model.

## Not yet implemented

- Figma designs, React/TypeScript components, Storybook stories, tests
- An MCP server, CLI or code generators
- Pricing, seat-map and booking-session API contracts
- A z-index scale; tokens for header height, seat sizes, segmented-control 32px and date-cell size (see `ambiguities`)

## Maintenance (repository only)

The specs are hand-authored from `design-system/`; tokens, indexes, `references/sources.json` and `manifest.json` are generated.

```bash
npm install          # dev-only: ajv for validation
npm run build        # regenerate tokens.json, indexes, sources (hashes) and manifest; copy CSS and fonts
npm run validate     # schemas, token/CSS consistency, ids, references, coverage, attribution, values, drift
npm run check        # both, without writing (CI)
```

`validate` fails when a source document changes after the last build (hash drift). Review the affected specs, then rebuild. `scripts/` is not published.
