# Shapes: Radius, Borders and Elevation

Values: `tokens/tokens.json` groups `radius`, `border-width`, `elevation`. Source documents: `design-system/tokens/border-radius.md`, `design-system/tokens/shadows.md`.

## Radius

| Semantic token | → | px | Used by | Confidence |
|---|---|---|---|---|
| `--radius-control` | `--radius-sm` | 4 | Button, TextField, Combobox, DateField, SegmentedControl | proposed · approved (D10; Live 3px) |
| `--radius-card` | `--radius-md` | 8 | Card, DestinationCard, popovers, menus | observed (Live and File A agree) |
| `--radius-panel` | `--radius-none` | 0 | Cream promo panel, full-bleed media, header, footer | observed |
| `--radius-badge` | `--radius-pill` | 9999 | Badges | inferred |
| `--radius-overlay` | `--radius-lg` | 16 | Modals, sheets (top corners) | proposed |
| — | `--radius-xs` | 2 | Seats | proposed |

Full-screen mobile overlays and drawers use 0.

## Border widths

`--border-width-1` (1px) for all default borders · `--border-width-2` (2px) for focus, selection and seat-type outlines · `--border-width-3` (3px) for the active nav indicator.

## Elevation (D11: flat by default)

| Token | Use |
|---|---|
| `--elevation-0` (none) | Resting cards, panels, badges, nav, footer |
| `--elevation-1` | Sticky header after scroll; sticky booking summary |
| `--elevation-1-up` | Sticky bottom CTA bar |
| `--elevation-2` | Hovered interactive cards; dropdown menus |
| `--elevation-3` | Popovers (date picker, passenger picker) |
| `--elevation-4` | Modals, drawers, sheets |

Surface layers 0–5 are in `layouts/layouts.json` (`surfaceLayers`).

## Rules

- Selection is shown with a 2px border plus a colour change (and a check icon on cards). Never a shadow, never a radius change.
- Motion (File A's hover lifts) is out of scope.
