# Changelog

## 0.1.0 (2026-11-09)

Initial specification package, generated from `design-system/` with decisions D1–D24 agreed.

- 223 design tokens (W3C DTCG) with CSS output, breakpoint (md / lg / xl) and Arabic values, per-token source attribution and component usage. `tokens.css` is identical to `design-system/tokens/tokens.css`.
- `tokens/values.json`: compact CSS-name lookup with resolved values, mode values and confidence.
- Token confidence is per value: `confidence` covers the base value, `source.modes` the breakpoint and Arabic values that differ; values with no documented source are `unattributed` (3 tokens).
- 34 component specs: 9 primitives, 8 composites, 17 feature-layer components. 5 presets / aliases.
- 8 pattern specs, including the booking state model (server-owned pricing, journey vs segment).
- Layouts, foundations, accessibility and RTL guidelines.
- JSON Schemas (draft 2020-12): token, component, pattern, manifest (with index, layouts and references definitions) and shared definitions.
- Status: every component is specified (complete or partial); none is designed, implemented or tested.
