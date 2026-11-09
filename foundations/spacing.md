# Spacing

Values: `tokens/tokens.json` group `space`. Source document: `design-system/tokens/spacing.md`.

4px base (D9, proposed). The live site's irregular steps (3, 6, 10, 12, 15, 20, 24, 25, 29px) are snapped to this scale; arbitrary values are not allowed. Tokens are authored in px and emitted in rem (D22).

| Token | px | Typical use |
|---|---|---|
| `--space-0-5` | 2 | Hairline offsets; floating label → value |
| `--space-1` | 4 | Icon-to-label gap, badge vertical padding |
| `--space-2` | 8 | Badge horizontal padding, tight row gaps, button icon gap |
| `--space-3` | 12 | Input horizontal padding, list row padding |
| `--space-4` | 16 | Mobile page margin and gutter, compact card padding |
| `--space-5` | 20 | Card padding (Live 20px), cream panel padding |
| `--space-6` | 24 | Grid gutter (md, lg), modal padding |
| `--space-8` | 32 | Section gap, xl gutter, md page margin |
| `--space-10` | 40 | lg page margin |
| `--space-12` | 48 | Section gap (mobile) |
| `--space-16` | 64 | Section gap (desktop) |
| `--space-20` | 80 | Hero vertical padding; xl page margin |
| `--space-24` | 96 | Large marketing sections |
| `--space-32` | 128 | Hero top padding behind a transparent header |

Layout tokens built on this scale: `--grid-gutter`, `--page-margin` (see `layouts/layouts.json`). Control heights (`--control-height-sm/md/lg`, 40 / 48 / 56) are a separate scale (D23).
