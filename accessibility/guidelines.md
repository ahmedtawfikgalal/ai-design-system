# Accessibility Guidelines

Source document: `design-system/components/accessibility.md`. All rules are **proposed** (D19); neither research source covers accessibility.
**Target: WCAG 2.2 level AA**, in English and Arabic, on desktop and mobile web. Interactive components follow the [WAI-ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/patterns/).

Component-specific roles, keyboard behaviour and announcements are in each component spec under `accessibility` (`components/{id}/spec.json`). This file holds the baseline that applies to all of them.

## Baseline (every component)

| Rule | Requirement | WCAG |
|---|---|---|
| Native first | Use `<button>`, `<a href>`, `<input>` and dialog semantics before ARIA. Never put a click handler on a `<div>`. | 4.1.2 |
| Accessible name | Every interactive element has one. Icon-only controls get it from a required `label` prop. | 4.1.2, 2.5.3 |
| Visible focus | `--focus-ring-*` tokens: 2px black, 2px offset (white on black or photography). Text fields show focus as a 2px black border. Never removed; never hidden by a sticky header or CTA bar (`scroll-padding`). | 2.4.7, 2.4.11 |
| Colour | Never the only signal. Status badges have icons; seat types have glyphs; errors have an icon and text; selected cards have a check icon. | 1.4.1 |
| Contrast | Text 4.5:1 (3:1 at 24px, or 18.66px bold). Outlines, focus rings and icons 3:1. | 1.4.3, 1.4.11 |
| Target size | At least 24×24 CSS px (AA). Aim for 44×44 except where density requires smaller (seat map). | 2.5.8 |
| Hover is never required | Anything shown on hover is also available on focus and on tap. | 1.4.13 |
| Text resizing | Works at 200% text size and at 320px width with no horizontal scrolling (the seat map may pan). Tokens use rem and em for this. | 1.4.4, 1.4.10 |
| Language | `<html lang dir>` per page. Inline foreign text gets its own `lang`. | 3.1.1, 3.1.2 |
| Motion | Out of scope; any animation added must respect `prefers-reduced-motion`. | 2.3.3 |
| Time limits | Warn at least 20 seconds before a fare quote or seat hold expires and offer to extend. | 2.2.1 |

## Where each pattern is specified

| Component | APG pattern | Spec |
|---|---|---|
| Button | Button | `components/button` |
| TextField | — (native input + label) | `components/text-field` |
| Overlay | Dialog (Modal) / non-modal popover | `components/overlay` |
| Counter | Group + live value | `components/counter` |
| SegmentedControl | Radio Group | `components/segmented-control` |
| Combobox | Combobox with listbox popup | `components/combobox` |
| DateField | Date picker dialog | `components/date-field` |
| Accordion | Accordion | `components/accordion` |
| FlightSegment | — (visually hidden summary) | `components/flight-segment` |
| Seat, SeatMap | Grid (one tab stop, arrow keys) + list-view alternative | `components/seat`, `components/seat-map` |
| BookingSummary, StickyCTABar | Live region for totals; region landmark | `components/booking-summary`, `components/sticky-cta-bar` |

## Acceptance criteria (per component, before release)

1. Automated: axe-core passes for every story, in both `ltr` and `rtl`.
2. Keyboard only: fully usable without a mouse, with visible focus at all times.
3. Screen readers: VoiceOver + Safari (macOS and iOS) and NVDA + Firefox or Chrome (Windows), in English and Arabic.
4. Zoom: 200% text size and 400% page zoom (320px) with no lost content.
5. The seat map and date picker also get a manual test with a screen-reader user.

None of these have been run yet: every component has `tested: false`.
