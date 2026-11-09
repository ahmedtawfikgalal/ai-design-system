# Typography

Values: `tokens/tokens.json` (groups `font-family`, `font-weight`, `letter-spacing`, `text-transform`, `type`). Source document: `design-system/tokens/typography.md`.

## Fonts

| Token | Value | Confidence |
|---|---|---|
| `--font-family-latin` | Helvetica Neue, Helvetica, Arial, sans-serif | observed (Live) + proposed fallbacks |
| `--font-family-arabic` | "EK Arabic" (Noto Sans Arabic, Arabic code points only), then the Latin stack | proposed (D15) |
| `--font-family-base` | Latin; Arabic on Arabic pages and `[lang="ar"]` blocks | proposed (D7, D15) |
| `--font-family-display` | = base | proposed (D7) |

The Emirates typefaces (Emirates-Bold, Heroic-Medium) are proprietary and **not used** (D7). Load `tokens/fonts.css` for the Arabic font.

## Scale

Roles are `--{role}-size`, `-line-height`, `-weight` (and `-letter-spacing` for display-xl). Sizes are authored in px and emitted in rem. Mobile below 48em, desktop from 48em; `display-xl` only from 64em (below that it equals `display-lg`).

| Role | Mobile | Desktop | Weight | Notes |
|---|---|---|---|---|
| display-xl | → display-lg | 120 / 112 | 400 | tight tracking; lg+ only |
| display-lg | 36 / 40 | 50 / 56 | 700 | |
| display-md | 24 / 32 | 30 / 36 | 400 | wide tracking |
| heading-1 | 22 / 28 | 24 / 28 | 700 | flight times |
| heading-2 | 20 / 28 | 22 / 28 | 700 | |
| heading-3 | 18 / 28 | 18 / 28 | 700 | bold since D24 (Live 400) |
| body-lg | 18 / 28 | 18 / 28 | 400 | |
| body-md | 16 / 24 | 16 / 24 | 400 | |
| body-sm | 14 / 20 | 14 / 20 | 400 | |
| caption | 12 / 16 | 12 / 16 | 500 | |
| label-caps | 12 / 16 | 12 / 16 | 700 | uppercase, 0.08em (D24; Live 10/12, 0.4em) |
| button-label | 16 / 24 | 16 / 24 | 700 | uppercase |

Per-value confidence is in `tokens/values.json` and `tokens.json`. Within one role, size, line height, weight and the mobile vs desktop values can have different sources; mobile `heading-1` / `heading-2` sizes and the `body-sm` line height have no documented source (`unattributed`).

## Rules

- Times, prices and flight numbers use tabular numerals (`Text numeric="tabular"`).
- IATA codes: bold, uppercase.
- Uppercase is CSS only (`--text-transform-caps`); source strings stay sentence case.
- No 600 weight (Helvetica Neue has none). On Arial, 500 renders as 400.
- No serif or monospace anywhere.

## Arabic (`ar` mode, D15)

Letter spacing 0 · no uppercase · line heights body-lg 32, body-md 28, body-sm 24, caption 20, label-caps 20 · never italic. See `rtl/guidelines.md`.
