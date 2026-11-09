# Color

Values: `tokens/tokens.json` (groups `palette`, `black-alpha`, `color`, `focus-ring`) and `tokens/tokens.css`.
Each token carries its source tag and confidence (`com.flyemirates.source`). Source document: `design-system/tokens/colors.md`.

> Only `--red-500` (`#D71921`, observed on the live site) and the observed neutrals, terracotta and cream come from Emirates' website. Gold and bronze are **inferred** (File A, unverified). Tints, shades, status and info colours are **proposed**.

## Layers

1. **Primitives** (`--red-500`, `--neutral-800`, `--gold-400` …): raw values. Components never use them, except for a few documented gaps (see each component's `ambiguities`).
2. **Semantic** (`--color-text-*`, `--color-bg-*`, `--color-border-*`, `--color-action-*`, `--color-icon-*`, `--color-seat-*`, `--focus-ring-*`): what components consume.

## Rules

| Rule | Detail | Decision |
|---|---|---|
| Red is the only interactive hue | Actions and selection (selected fare, selected seat, selected date) use `--color-action-primary`. | D2 |
| Status never uses brand red | Success / warning / error / info use the green / amber / crimson / blue families. File A's red "Boarding" badge is remapped to info blue. | D6 |
| Focus is black, never red | `--focus-ring-color` (white `--focus-ring-color-inverse` on black or photos). Error is crimson plus an icon and message. | D20 |
| Links are terracotta and underlined | `--color-text-link` is only 2.53:1 against body text, so the underline is required (WCAG 1.4.1). | D5, D20 |
| Gold is never text | `--gold-400`, `--gold-500`, `--gold-600` are fills, borders and glyphs only. Text on gold uses `--color-text-on-premium` (black). | D3 |
| Amber is never text | `--amber-500` (3.19:1) is for borders and icons; warning text uses `--amber-800`. | D6 |
| Selected premium card | Bronze `--color-border-premium-strong` (3.90:1) + check icon; the gold resting border (2.46:1) is too weak for a state. | D20 |
| Seat types | Each type has an outline colour **and** a glyph; every outline ≥ 3:1. Previewed seats get a red outline. | D18 |
| Surfaces | Page `#FFFFFF` → subtle `#F6F6F6` → card `#FFFFFF` + `--color-border-subtle`. Black for global chrome. | D11 |
| No dark mode | Theming, dark mode and File A's First Class dark mode are out of scope. | — |

## Contrast reference (on white)

Recorded in the source tables: `--red-500` 5.18 · `--neutral-500` 3.45 (control border) · `--neutral-400` 2.35 (decorative / disabled only) · `--gold-400` 2.46 · `--gold-500` 3.04 · `--gold-600` 3.90 · `--terracotta-500` 5.00.
Text needs 4.5:1; component outlines, focus rings and icons need 3:1.
