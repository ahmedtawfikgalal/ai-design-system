# Icons

Source document: `design-system/tokens/iconography.md`. Everything here is **proposed** (D13). Phosphor is a project choice, not an Emirates asset.

- Library: Phosphor Icons, `@phosphor-icons/core` (names checked at v2.1.1), MIT.
- Weight: Regular everywhere; Fill only for selected or active states. No Thin, Light, Bold or Duotone.
- Colour: `currentColor`, set with `--color-icon-*`.
- Sizes: `--icon-size-xs` 16 · `-sm` 20 · `-md` 24 · `-lg` 32 (emitted in rem).

## Aviation map

| Meaning | Icon | Meaning | Icon |
|---|---|---|---|
| Flight | `airplane` | Departure | `airplane-takeoff` |
| Arrival | `airplane-landing` | In flight / status | `airplane-in-flight` |
| Flight path | `airplane-tilt` | Swap origin / destination | `arrows-left-right` |
| Seat selection | `seat` | Seatbelt / safety | `seatbelt` |
| Baggage | `suitcase-rolling`, `suitcase` | Boarding pass | `ticket` |
| Travel document | `identification-card` | Dates | `calendar` |
| Passengers | `users` | Dining | `fork-knife` |
| Entertainment | `television` | Wi-Fi | `wifi-high` |
| Lie-flat bed | `bed` | Region selector | `globe` |
| Confirmed / on time | `check-circle` | Seat: Preferred | `star` |
| Seat: Extra Legroom | `arrows-vertical` | Seat: Twin | `users` |

Custom icons needed (not in Phosphor): aircraft-type silhouettes (A380, 777), passport. They use the same 256-unit grid, 16-unit stroke, round caps and joins. The Emirates logo is never an icon.

## Right-to-left mirroring (`Icon mirror="auto"`)

| Mirror in RTL | Never mirror |
|---|---|
| `arrow-left`, `arrow-right`, `caret-left`, `caret-right` | `arrows-left-right` (symmetric) |
| `airplane-takeoff`, `airplane-landing`, `airplane-in-flight`, `airplane-tilt` | `airplane` (points up) |
| `sign-in`, `sign-out`, `arrow-u-up-left`, `list` | `check`, `check-circle`, `x`, `x-circle`, `clock`, `calendar` |
| | `magnifying-glass`, `question`, `globe`, `seat`, `suitcase`, `star`, `users`, `arrows-vertical`, `caret-up`, `caret-down`, logos |

Custom icons register a `mirror` flag; the default is not mirrored.
