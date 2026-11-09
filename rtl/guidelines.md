# Right-to-Left & Arabic Guidelines

Source document: `design-system/layout/rtl-and-arabic.md`. All rules are **proposed** (D15). Emirates is based in Dubai and Arabic is a primary language; every component and pattern must work in RTL. Component-specific RTL behaviour is in each spec under `rtl`.

## Setup

- `<html lang="ar" dir="rtl">`. `dir` flips the layout; `lang` switches the Arabic token values and the screen-reader voice.
- Arabic blocks inside other pages (`lang="ar"` on any element) also get the Arabic token values (`ar` mode → `:root:lang(ar), [lang|="ar"]`).
- Load `tokens/fonts.css` with `tokens/tokens.css`.

## Layout: logical CSS only

| Don't | Do |
|---|---|
| `margin-left`, `padding-right` | `margin-inline-start`, `padding-inline-end` |
| `left: 0`, `right: 0` | `inset-inline-start: 0`, `inset-inline-end: 0` |
| `text-align: left` | `text-align: start` |
| `border-left` | `border-inline-start` |
| `float: left` | `float: inline-start` (or flex / grid) |
| `border-top-left-radius` | `border-start-start-radius` |
| Prop values `left` / `right` | `start` / `end` |

What flips: header (logo right, utilities left), booking sidebar (left), `side="end"` drawers (from the left), text inputs (right-aligned), FlightSegment (departure on the right).
Stays LTR: media players, phone and card-number inputs, charts with a time axis. Transforms (`translateX`) are not logical and need a `[dir="rtl"]` override.

## Typography (`ar` mode tokens)

Arabic font "EK Arabic" (Noto Sans Arabic, SIL OFL, self-hosted Arabic subset, `unicode-range` limited to Arabic so Latin text falls through to the Latin stack) · letter spacing 0 · no uppercase · more line height for running text · `label-caps` 12/20 · never italic · check sizes in both languages.

## Numbers, dates, prices

- Latin digits (`numberingSystem: 'latn'`) in all languages. Proposed, configurable per market.
- Gregorian calendar; week start from `Intl.Locale(...).getWeekInfo()` (Monday for `ar-AE`). Never hardcode it.
- Prices: `Intl.NumberFormat` with `currencyDisplay: 'code'`. Dates: `Intl.DateTimeFormat`. Never concatenate.

## Mixed-direction text

Wrap in `<bdi>` (or `dir="ltr"`): IATA codes and routes, flight numbers, times and durations, booking references, emails, URLs, phone numbers, formatted prices. Never type route arrows ("DXB → LHR") in translatable strings; use a mirrored icon.

## Icons

Direction-of-travel icons mirror; objects, time and checkmarks don't. List: `foundations/icons.md`.

## Forms

- Email, phone, booking reference, passport and card number inputs are always `dir="ltr"`.
- Passenger names must be Latin characters (passports, airline systems): say so in helper text and validate with a clear error.
- Helper and error text sit at the start edge.

## Keyboard

In grids and radio groups (SegmentedControl, DateField, SeatMap), Left and Right follow the **visual** direction.

## Testing

Every story renders in `ltr` and `rtl` (visual-regression snapshots for both); an RTL pseudo-locale with lengthened strings runs in CI; native Arabic speakers review copy and layout.
