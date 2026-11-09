# AI Design System

**A design system written for AI agents as well as people.**

[![npm](https://img.shields.io/npm/v/@ahmed.tawfik.galal/ai-design-system?color=d71921&label=npm)](https://www.npmjs.com/package/@ahmed.tawfik.galal/ai-design-system)
[![license](https://img.shields.io/badge/license-MIT-333333)](LICENSE)
![WCAG 2.2 AA](https://img.shields.io/badge/accessibility-WCAG%202.2%20AA-1f5fa8)
![RTL ready](https://img.shields.io/badge/RTL-Arabic%20ready-af5541)

Most design systems live in Figma files and long documentation pages written for humans. AI coding and design tools can't use them reliably: they guess colours, invent component behaviour and miss accessibility rules.

This project packages a complete design system as **structured, validated, machine-readable specifications**: design tokens, components, UX patterns, accessibility and right-to-left rules. An AI agent (or a developer, or a build tool) can fetch exactly what it needs, such as one button, one colour or one booking flow, and knows **where every value came from**.

The case study is an airline booking experience, built as an **unofficial concept inspired by Fly Emirates**.

> **Unofficial concept.** Not affiliated with or endorsed by Emirates. Emirates' brand guidelines are not public, and its logo and typefaces are proprietary and are not included. Every value states its source, and **none** is presented as an official Emirates specification.

---

## At a glance

| | |
|---|---|
| **223** design tokens | Colours, typography, spacing, shapes, elevation, icons, with mobile, desktop and Arabic values |
| **34** component specs | 17 reusable design-system components plus 17 product components (search, results, seat map, booking summary…) |
| **8** UX patterns | From the home page to seat selection, plus the booking state model |
| **24** recorded design decisions | Each change of direction is logged and referenced |
| **5** source-confidence levels | `official` · `observed` · `inferred` · `proposed` · `unattributed`, on every value |
| **WCAG 2.2 AA** | Keyboard, screen-reader and focus behaviour specified per component |
| **Arabic / RTL** | First-class: right-to-left layout, Arabic typography, mirrored icons |
| **0** runtime dependencies | Plain JSON, CSS and Markdown |

## What makes it different

- **Honest provenance.** Every token and spec records its source and a confidence level. An AI tool can tell a colour read from the live website apart from a recommendation. It never has to present a guess as brand fact.
- **Built for selective retrieval.** A manifest and indexes point to small, self-contained files. An agent loads the Button spec (≈12 KB) and the token lookup (≈20 KB), not the whole system.
- **Accessibility is part of the spec, not an afterthought.** The seat map, date picker and search box each define their roles, keyboard behaviour and screen-reader announcements, following the W3C ARIA patterns.
- **Arabic and right-to-left from day one.** Logical layout rules, an Arabic font set-up, bidirectional text handling and icon mirroring are specified alongside the English version.
- **Real product rules, not just visuals.** The booking model makes the server the only source of prices. It separates fares (per journey) from seats (per flight) and handles a seat being taken mid-booking. These are the details that cause production bugs when they're left implicit.
- **Validated.** JSON Schemas cover every file. A validation suite checks the tokens against the CSS, every cross-reference, coverage of the source documents, and that no value was invented.

## Who it's for

| If you are… | Use it to… |
|---|---|
| **A developer** | Import ready-made CSS tokens, or generate typed components from the specs |
| **An AI / tooling engineer** | Feed an agent, an MCP server or a code generator with structured, sourced design data |
| **A designer** | Import the tokens into Figma (W3C format, e.g. via Tokens Studio) and follow the component and state specs |
| **A product or project manager** | See the scope, status and open questions of every component at a glance (`components/index.json`) |
| **A recruiter or hiring manager** | Review an end-to-end example of design-systems, accessibility and AI-infrastructure work (see [How it was built](#how-it-was-built)) |

---

## Quick start

```bash
npm install @ahmed.tawfik.galal/ai-design-system
```

**Use the design tokens in CSS:**

```css
@import "@ahmed.tawfik.galal/ai-design-system/tokens.css";
@import "@ahmed.tawfik.galal/ai-design-system/fonts.css"; /* Arabic font */

.cta {
  background: var(--color-action-primary);
  color: var(--color-text-on-brand);
  border-radius: var(--radius-control);
  min-height: var(--control-height-md);
}
```

Tokens adapt to screen size automatically. On Arabic pages (`<html lang="ar" dir="rtl">`), they switch to the Arabic font, spacing and line heights.

**Read the specs in JavaScript / TypeScript** (Node 20+ or any bundler with JSON import attributes):

```js
import components from '@ahmed.tawfik.galal/ai-design-system/components' with { type: 'json' };
import button from '@ahmed.tawfik.galal/ai-design-system/components/button' with { type: 'json' };
import values from '@ahmed.tawfik.galal/ai-design-system/tokens/values.json' with { type: 'json' };

button.variants.map((v) => v.name);   // ['primary', 'secondary', 'premium', 'ghost', 'link', 'inverse']
values.tokens['--color-action-primary'];
// { value: 'var(--red-500)', resolved: '#D71921', confidence: 'observed' }
```

---

## For AI agents

The package is designed to be read **selectively**, in this order:

1. **`manifest.json`**: what exists, the vocabulary, counts, and what is *not* built yet.
2. **`components/index.json`** or **`patterns/index.json`**: pick ids. Each entry has a layer, a status, a confidence level, its dependencies (`composes`, `usedBy`) and the patterns it appears in.
3. **One spec**, e.g. `components/seat/spec.json`: variants, props, states, interaction, accessibility, responsive and RTL behaviour, tokens, sources and known ambiguities.
4. **`tokens/values.json`** to resolve that spec's tokens. Load `tokens/tokens.json` only for full attribution.

Rules every agent should follow:

- Only present a value as an Emirates brand fact when its `confidence` is `official`. In this version, no token is.
- Respect `inDesignSystem`: product (feature-layer) components belong to the application, not to a shared component library.
- Read `ambiguities` before generating code; they flag conflicts and gaps in the source material.
- Never compute prices on the client (pattern `booking-state`). No pricing or seat-map API contract is defined here.

Everything is vendor-neutral JSON, CSS and Markdown. It's ready to be served by a future **MCP server** (e.g. `list_components`, `get_component(id)`, `get_token(name)`), with the shipped schemas used to validate whatever an agent generates.

---

## What's inside

| Path | Contents |
|---|---|
| `manifest.json` | Entry point: resources, counts, vocabulary, retrieval guidance |
| `tokens/tokens.css` | CSS custom properties (rem units, breakpoint and Arabic overrides) |
| `tokens/values.json` | Compact lookup: CSS name → value, resolved value, breakpoint and Arabic values, confidence |
| `tokens/tokens.json` | All tokens in the W3C Design Tokens (DTCG) format, with full attribution and component usage |
| `tokens/fonts.css`, `tokens/fonts/` | Self-hosted Arabic font (Noto Sans Arabic, SIL OFL) |
| `components/` | `index.json` + one `spec.json` per component |
| `patterns/` | `index.json` + one file per pattern or flow |
| `layouts/layouts.json` | Breakpoints, grid, containers, per-breakpoint behaviour, surface layers |
| `foundations/` | Colour, typography, spacing, shapes and icon rules |
| `accessibility/guidelines.md` | WCAG 2.2 AA baseline and release acceptance criteria |
| `rtl/guidelines.md` | Right-to-left and Arabic rules |
| `references/sources.json` | Source documents (with fingerprints), source definitions, decision log |
| `schemas/` | JSON Schemas (draft 2020-12) for every JSON file |

### Components

**Design system.**
- **Primitives:** Button · Badge · Icon · Text · Divider · Card · Media · TextField · Overlay
- **Composites:** PriceDisplay · Counter · SegmentedControl · Combobox · DateField · Accordion · FlightSegment · Seat

**Product layer.**
- **Search:** FlightSearchWidget · PassengerSelector · AirportOption
- **Results:** FlightResultCard · FareOptions · DateStrip
- **Seats:** SeatMap · SeatLegend
- **Booking:** BookingSummary · StickyCTABar · StepProgress
- **Content:** DestinationCard · CabinFeatureCard · PromoPanel · HeroBanner
- **Chrome:** GlobalHeader · GlobalFooter

### Patterns

Page shell · Home and flight search · Flight results · Booking flow · Seat selection · Destination grid · Cabin experience page · Booking state model.

### Source confidence

| Level | Meaning |
|---|---|
| `official` | Directly supported by verified Emirates documentation |
| `observed` | Read from the live Emirates website by a third party |
| `inferred` | Unverified third-party research |
| `proposed` | A recommendation made in this design system |
| `unattributed` | The source material gives no source for this value |

Current token split: 125 proposed, 57 observed, 38 inferred, 3 unattributed, 0 official.

---

## Status and roadmap

This is **version 0.1: a specification**. Being explicit about what exists and what doesn't is part of the design.

| | Status |
|---|---|
| Design tokens (CSS + W3C JSON) | ✅ Available |
| Component and pattern specifications | ✅ Available: 18 of 34 components and 7 of 8 patterns fully specified; the rest partially, each marked with what's missing |
| JSON Schemas and validation suite | ✅ Available |
| Figma library | ⏳ Planned. Every component has `designed: false` |
| React + TypeScript components | ⏳ Planned. Every component has `implemented: false` |
| Storybook with accessibility and RTL tests | ⏳ Planned, starting with the seat map, date picker, airport search and flight segment |
| MCP server for AI agents | ⏳ Planned |

## How it was built

1. **Research.** Two independent sources: values read from the live website, and a third-party research document with no citations. Each value was tagged by source, and a hierarchy decided which source wins.
2. **Audit and foundations.** Colour, type, spacing, shape, elevation and icon foundations, with contrast ratios recorded for the colour pairings components use.
3. **Expert reviews.** Two review rounds from a tech-lead and UX perspective. Critical gaps were fixed: Arabic and right-to-left support, accessible seat selection, server-owned pricing, the per-flight seat model, and contrast failures.
4. **Decision log.** Every change of direction (24 so far) is recorded and referenced from the values it affects.
5. **Token pipeline.** One W3C-format token file generates the CSS with Style Dictionary. The output was verified value by value in a real browser, in English and Arabic, at four screen widths.
6. **AI-ready package.** The documentation became structured specs with JSON Schemas, indexes for selective retrieval, per-value provenance, and a validation suite. The suite was itself tested against injected errors.

## Contributing

Issues and suggestions are welcome on [GitHub](https://github.com/ahmedtawfikgalal/ai-design-system/issues). Gaps and conflicts that are already known are listed in each spec's `ambiguities` field, which is a good place to start.

To validate the package locally:

```bash
npm install
npm run validate   # schemas, token/CSS consistency, references, attribution
```

`npm run build` regenerates the token files, indexes and manifest from the source documentation. It needs the full project workspace.

## License

[MIT](LICENSE) © Ahmed Tawfik Galal.
The bundled Noto Sans Arabic font is licensed under the [SIL Open Font License 1.1](tokens/fonts/OFL.txt).
"Emirates" and "Fly Emirates" are trademarks of their owner. This is an independent, unofficial concept, and the licence grants no trademark rights.

---

**Ahmed Tawfik Galal** · [GitHub](https://github.com/ahmedtawfikgalal)
