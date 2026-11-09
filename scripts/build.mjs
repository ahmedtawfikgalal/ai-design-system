// Generates the derived files of the design-spec package from the design-system sources.
//
//   node scripts/build.mjs           write generated files
//   node scripts/build.mjs --check   exit 1 if any generated file is out of date
//
// Hand-authored (never touched here): components/*/spec.json, patterns/*.json (except index),
// layouts/layouts.json, *.md, schemas/.
// Generated: tokens/* (copied or derived), components/index.json, patterns/index.json,
// references/sources.json, manifest.json.
// Repository-only tool: not included in the published package.

import { readFile, writeFile, readdir, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.resolve(PKG, '..');
const DS = path.join(REPO, 'design-system');
const CHECK = process.argv.includes('--check');
const SCHEMA_VERSION = '1.0.0';

const read = (p) => readFile(p, 'utf8');
const readJson = async (p) => JSON.parse(await read(p));
const rel = (p) => path.relative(REPO, p).split(path.sep).join('/');
const sha256 = async (p) => createHash('sha256').update(await readFile(p)).digest('hex');
const json = (o) => JSON.stringify(o, null, 2) + '\n';
export const slug = (h) =>
  h.trim().toLowerCase().replace(/[^\p{L}\p{N}\- _]/gu, '').replace(/ /g, '-');

// ---------------------------------------------------------------- source documents

export const DOCS = [
  ['overview', 'design-system/proposal/overview.md', 'Overview, source hierarchy and decision log', 'decision-log'],
  ['scope-boundaries', 'design-system/proposal/scope-boundaries.md', 'Scope boundaries (design system vs feature layer)', 'specification'],
  ['tier-1-primitives', 'design-system/proposal/tier-1-primitives.md', 'Tier 1 primitives', 'specification'],
  ['tier-2-composites', 'design-system/proposal/tier-2-composites.md', 'Tier 2 composites', 'specification'],
  ['state-architecture', 'design-system/proposal/state-architecture.md', 'Booking state architecture', 'specification'],
  ['inventory', 'design-system/components/inventory.md', 'Component inventory (feature layer)', 'specification'],
  ['states', 'design-system/components/states.md', 'Component states', 'specification'],
  ['accessibility', 'design-system/components/accessibility.md', 'Accessibility', 'specification'],
  ['breakpoints', 'design-system/layout/breakpoints.md', 'Breakpoints, grid and containers', 'specification'],
  ['patterns', 'design-system/layout/patterns.md', 'Layout patterns', 'specification'],
  ['rtl-and-arabic', 'design-system/layout/rtl-and-arabic.md', 'Right-to-left and Arabic', 'specification'],
  ['colors', 'design-system/tokens/colors.md', 'Colour tokens', 'token-documentation'],
  ['typography', 'design-system/tokens/typography.md', 'Typography tokens', 'token-documentation'],
  ['spacing', 'design-system/tokens/spacing.md', 'Spacing tokens', 'token-documentation'],
  ['border-radius', 'design-system/tokens/border-radius.md', 'Border radius and widths', 'token-documentation'],
  ['shadows', 'design-system/tokens/shadows.md', 'Shadows (elevation)', 'token-documentation'],
  ['iconography', 'design-system/tokens/iconography.md', 'Iconography', 'token-documentation'],
  ['tokens-readme', 'design-system/tokens/README.md', 'How tokens are built', 'token-documentation'],
  ['tokens-json', 'design-system/tokens/tokens.json', 'Token source (W3C DTCG)', 'token-source'],
  ['tokens-css', 'design-system/tokens/tokens.css', 'Generated CSS custom properties', 'token-source'],
  ['fonts-css', 'design-system/tokens/fonts.css', 'Arabic @font-face', 'token-source'],
  ['research-live', 'design-system/media/emirates-brand-research.md', 'Research: live-site extraction and Official sources ("Live", "Official")', 'research'],
  ['research-file-a', 'design-system/media/emirates_brand_design_system_research.md', 'Research: File A, cites no sources ("A · unverified")', 'research'],
  ['audit', '01-audit-and-open-decisions.md', 'Audit and open decisions (pre-system)', 'audit'],
  ['foundations-draft', '02-foundations.md', 'Foundations draft (pre-system)', 'audit'],
].map(([id, p, title, kind]) => ({ id, path: p, title, kind }));
const DOC_BY_ID = Object.fromEntries(DOCS.map((d) => [d.id, d]));

export const SOURCE_TAGS = {
  Official: { confidence: 'official', meaning: "Emirates' own sources: emirates.com, the Media Centre, Emirates staff." },
  Live: { confidence: 'observed', meaning: 'Values a third party read from the live emirates.com code.' },
  'A · unverified': { confidence: 'inferred', meaning: 'File A, a research document that cites no sources. Unverified; it only fills gaps.' },
  Rec: { confidence: 'proposed', meaning: 'A design-system recommendation where no source exists.' },
  'Rec · approved': { confidence: 'proposed', meaning: 'A recommendation explicitly approved over a Live value (approved: true).' },
};

// ---------------------------------------------------------------- attribution parsing

export function classify(tag) {
  const hits = [
    ['official', /\bOfficial\b/],
    ['observed', /\bLive\b/],
    ['inferred', /A · unverified|File A|\bA\)/],
    ['proposed', /\bRec\b/],
  ]
    .map(([c, re]) => [c, tag.search(re)])
    .filter(([, i]) => i >= 0)
    .sort((a, b) => a[1] - b[1]);
  if (!hits.length) return null;
  const out = { tag, confidence: hits[0][0] };
  if (hits.length > 1) out.mixed = true;
  if (/Rec · approved/.test(tag)) out.approved = true;
  const decisions = [...new Set(tag.match(/\bD\d+\b/g) ?? [])];
  if (decisions.length) out.decisions = decisions;
  return out;
}

const clean = (s) => s.replace(/\*\*/g, '').replace(/\\\|/g, '|').trim();
const splitRow = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map((c) => c.trim());

function* tableRows(md) {
  let heading = '';
  let header = null;
  for (const line of md.split('\n')) {
    const h = /^#{1,6}\s+(.*)$/.exec(line);
    if (h) { heading = h[1]; header = null; continue; }
    if (!line.trim().startsWith('|')) { header = null; continue; }
    const cells = splitRow(line);
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
    if (!header) { header = cells; continue; }
    yield { heading, header, cells };
  }
}

const ROLES = ['display-xl', 'display-lg', 'display-md', 'heading-1', 'heading-2', 'heading-3', 'body-lg', 'body-md', 'body-sm', 'caption', 'label-caps', 'button-label'];

function namesInCell(cell) {
  const ticks = [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  const out = [];
  let base = null;
  for (const t of ticks) {
    if (/^--[a-z0-9-]+$/.test(t)) { out.push(t); base = t; }
    else if (/^-[a-z0-9-]+$/.test(t) && base) out.push(base.replace(/-[a-z0-9]+$/, '') + t);
  }
  if (!out.length && ticks.length === 1 && ROLES.includes(ticks[0])) return { role: ticks[0] };
  return { names: out };
}

function expandParts(text, n) {
  const parts = text.split(' / ').flatMap((p) => {
    const m = /^(.*?)\s*×(\d+)$/.exec(p.trim());
    return m ? Array(Number(m[2])).fill(m[1]) : [p.trim()];
  });
  return parts.length === n ? parts : Array(n).fill(text);
}

// Tables without a Source column inherit the file-level statement written in the document.
const TABLE_DEFAULTS = {
  colors: { 'Semantic — Icon': 'Rec (all icon mappings: Rec)' },
  iconography: { Sizes: 'Rec (D13)' },
  spacing: { Scale: 'Rec (D9)' },
};

// Tokens that no table lists. Each tag is quoted or paraphrased from the cited section.
const MANUAL = {
  '--font-family-base': ['Rec (D7, D15): Latin stack by default, Arabic stack in Arabic', 'typography', 'font-stack'],
  '--grid-columns': ['A · unverified (columns)', 'breakpoints', 'breakpoint-definitions'],
  '--grid-gutter': ['Rec (gutter)', 'breakpoints', 'breakpoint-definitions'],
  '--page-margin': ['Rec (margin; D22: 80px minimum at xl)', 'breakpoints', 'breakpoint-definitions'],
  '--control-height-sm': ['Rec · approved (D23): one scale for buttons and fields; replaces Live 40px fields and 60px button', 'tier-1-primitives', 'button'],
  '--control-height-md': ['Rec · approved (D23): one scale for buttons and fields; replaces Live 40px fields and 60px button', 'tier-1-primitives', 'button'],
  '--control-height-lg': ['Rec · approved (D23): one scale for buttons and fields; replaces Live 40px fields and 60px button', 'tier-1-primitives', 'button'],
  '--focus-ring-width': ['Rec (D20)', 'colors', 'semantic--border'],
  '--focus-ring-offset': ['Rec (D20)', 'colors', 'semantic--border'],
  '--text-transform-caps': ['Live (UPPER case for label-caps and button-label); none in Arabic: Rec (D15)', 'typography', 'type-scale'],
};

async function attributionMap(cssNames) {
  const map = new Map();
  const set = (name, tag, doc, section) => {
    if (!cssNames.has(name) || map.has(name)) return;
    const c = classify(tag);
    if (c) map.set(name, { ...c, refs: [{ doc, section }] });
  };
  for (const doc of ['colors', 'typography', 'spacing', 'border-radius', 'shadows', 'iconography', 'breakpoints']) {
    const md = await read(path.join(REPO, DOC_BY_ID[doc].path));
    for (const { heading, header, cells } of tableRows(md)) {
      const { names, role } = namesInCell(cells[0]);
      const targets = role
        ? ['size', 'line-height', 'weight', 'letter-spacing'].map((p) => `--${role}-${p}`)
        : names;
      if (!targets?.length) continue;
      const si = header.findIndex((h) => /source/i.test(h));
      let tag = si >= 0 ? clean(cells[si] ?? '') : TABLE_DEFAULTS[doc]?.[heading];
      if (!tag && doc === 'spacing') tag = 'Rec (D9)';
      if (!tag) continue;
      if (doc === 'spacing') {
        const snapped = cells[header.findIndex((h) => /snapped/i.test(h))];
        if (snapped && snapped !== '—') tag += `; Live values snapped here: ${snapped}`;
      }
      if (role) {
        // One type-scale row covers four tokens and two screen sizes. `confidence` is the
        // confidence of the base (mobile) value; `desktop` is used for the md/lg/xl values.
        // The tag text stays exactly as written.
        const nums = (cell) => (clean(cell).match(/\d+/g) ?? []).map(Number);
        const mobileCell = clean(cells[1] ?? ''), desktopCell = clean(cells[2] ?? '');
        const [mob, desk] = [nums(mobileCell), nums(desktopCell)];
        const primary = classify(tag);
        if (!primary) continue;
        for (const t of targets) {
          if (!cssNames.has(t) || map.has(t)) continue;
          const prop = t.slice(role.length + 3);
          let specific = null;
          if (prop === 'weight') specific = /weight[^.]*?(Rec · approved|Rec)\b/i.exec(tag)?.[1];
          if (prop === 'line-height') specific = /line height[^.]*?(Rec · approved|Rec)\b/i.exec(tag)?.[1];
          if (prop === 'size' || prop === 'line-height') specific ??= /\bSize[^.]*?:\s*(Rec · approved|Rec)\b/.exec(tag)?.[1];
          let desktop = specific ? classify(specific).confidence : primary.confidence;
          // "Live size" scopes the Live source to the size; other unmentioned properties have no source.
          if (!specific && /Live size/.test(tag) && prop !== 'size') desktop = 'unattributed';
          let base = desktop;
          if (prop === 'size' || prop === 'line-height') {
            const i = prop === 'size' ? 0 : 1;
            if (mobileCell.startsWith('→')) base = `=${mobileCell.match(/[a-z]+-[a-z0-9]+/)[0]}`; // resolved below
            else if (/Mobile: Rec/.test(tag)) base = 'proposed';
            else if (mob[i] !== desk[i]) base = 'unattributed';
          } else if (mobileCell.startsWith('→')) base = `=${mobileCell.match(/[a-z]+-[a-z0-9]+/)[0]}`;
          map.set(t, { ...primary, mixed: primary.mixed || specific != null || base !== desktop || undefined, confidence: base, _desktop: desktop, refs: [{ doc, section: slug(heading) }] });
        }
        continue;
      }
      const parts = expandParts(tag, targets.length);
      targets.forEach((t, i) => set(t, parts[i], doc, slug(heading)));
    }
    // Code-block declarations with a trailing comment, e.g. the font stack.
    for (const m of md.matchAll(/^(--[a-z0-9-]+):[^\n]*?\/\*\s*(.*?)\s*\*\//gm)) {
      if (!MANUAL[m[1]]) set(m[1], m[2], doc, doc === 'typography' ? 'font-stack' : '');
    }
  }
  for (const [name, [tag, doc, section]] of Object.entries(MANUAL)) set(name, tag, doc, section);
  // display-xl falls back to display-lg below lg: its base values share display-lg's base source.
  for (const [name, a] of map) {
    if (a.confidence?.startsWith('=')) {
      const role = `--${a.confidence.slice(1)}`;
      const other = map.get(name.replace(/^--[a-z]+-[a-z0-9]+/, role)) ?? map.get(`${role}-weight`); // same row, non-size property
      a.confidence = other?.confidence ?? 'unattributed';
      a.mixed = true;
    }
  }
  return map;
}

// ---------------------------------------------------------------- tokens

function parseCss(css) {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks = { base: {}, md: {}, lg: {}, xl: {}, ar: {} };
  const decls = (body) => Object.fromEntries([...body.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  const base = /^:root \{([\s\S]*?)^\}/m.exec(noComments);
  blocks.base = decls(base[1]);
  for (const [mode, em] of [['md', '48em'], ['lg', '64em'], ['xl', '90em']]) {
    const m = new RegExp(`@media \\(min-width: ${em}\\) \\{\\s*:root \\{([\\s\\S]*?)\\}\\s*\\}`).exec(noComments);
    if (m) blocks[mode] = decls(m[1]);
  }
  const ar = /:root:lang\(ar\), \[lang\|="ar"\] \{([\s\S]*?)\}/.exec(noComments);
  if (ar) blocks.ar = decls(ar[1]);
  return blocks;
}

function walkTokens(node, p = [], out = []) {
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$') || typeof v !== 'object' || v === null) continue;
    if ('$value' in v) out.push({ path: [...p, k], token: v });
    else walkTokens(v, [...p, k], out);
  }
  return out;
}
const cssNameOf = (p) => '--' + p.filter((s, i) => !(i === 0 && (s === 'palette' || s === 'type'))).join('-');

async function buildTokens(components) {
  const src = await readJson(path.join(DS, 'tokens/tokens.json'));
  const css = await read(path.join(DS, 'tokens/tokens.css'));
  const blocks = parseCss(css);
  const tokens = walkTokens(src);
  const names = new Set(tokens.map((t) => cssNameOf(t.path)));
  const attribution = await attributionMap(names);

  const usedBy = new Map();
  for (const c of components) for (const t of c.tokens ?? []) usedBy.set(t, [...(usedBy.get(t) ?? []), c.id]);

  const out = structuredClone(src);
  const unattributed = [];
  for (const { path: p } of tokens) {
    const name = cssNameOf(p);
    let node = out;
    for (const k of p) node = node[k];
    const cssEntry = { name, value: blocks.base[name] };
    if (cssEntry.value === undefined) throw new Error(`${name} missing from tokens.css`);
    const modes = {};
    for (const m of ['md', 'lg', 'xl', 'ar']) if (blocks[m][name] !== undefined) modes[m] = blocks[m][name];
    if (Object.keys(modes).length) cssEntry.modes = modes;
    let source = attribution.get(name);
    if (!source) unattributed.push(name);
    if (source) {
      // Per-mode confidence, listed only where it differs from the base value's confidence.
      // Breakpoint values share the row's (desktop) source; every Arabic value is Rec (D15).
      const { _desktop, ...rest } = source;
      const modeConf = {};
      for (const m of Object.keys(modes)) {
        const c = m === 'ar' ? 'proposed' : (_desktop ?? rest.confidence);
        if (c !== rest.confidence) modeConf[m] = c;
      }
      source = { ...rest, ...(Object.keys(modeConf).length ? { modes: modeConf } : {}) };
      if (source.mixed === undefined) delete source.mixed;
    }
    const ext = { ...(node.$extensions ?? {}) };
    ext['com.flyemirates.css'] = cssEntry;
    ext['com.flyemirates.source'] = source ?? { tag: 'UNATTRIBUTED', confidence: 'proposed' };
    if (usedBy.has(name)) ext['com.flyemirates.usedBy'] = [...new Set(usedBy.get(name))].sort();
    node.$extensions = ext;
  }
  const cssNames = new Set(Object.values(blocks).flatMap((b) => Object.keys(b)));
  const extra = [...cssNames].filter((n) => !names.has(n));
  if (extra.length) throw new Error(`tokens.css declares variables missing from tokens.json: ${extra.join(', ')}`);

  out.$description =
    'Fly Emirates design tokens (unofficial concept). W3C DTCG format. Same values as tokens.css. ' +
    'Each token carries: com.flyemirates.css (exact CSS name and value per mode), com.flyemirates.modes ' +
    '(authored values for md/lg/xl breakpoints and Arabic), com.flyemirates.source (attribution) and ' +
    'com.flyemirates.usedBy (component ids). Authored dimensions are px; tokens.css emits rem where noted in foundations/.';
  out.$extensions = {
    'com.flyemirates.package': {
      schemaVersion: SCHEMA_VERSION,
      tokenCount: tokens.length,
      generatedFrom: ['design-system/tokens/tokens.json', 'design-system/tokens/tokens.css', 'design-system/tokens/*.md'],
      modes: {
        md: '@media (min-width: 48em)', lg: '@media (min-width: 64em)', xl: '@media (min-width: 90em)',
        ar: ':root:lang(ar), [lang|="ar"] — all Arabic values are Rec (D15)',
      },
    },
  };
  const ordered = { $schema: '../schemas/token.schema.json', $description: out.$description, $extensions: out.$extensions };
  for (const [k, v] of Object.entries(out)) if (!k.startsWith('$')) ordered[k] = v;
  // Compact lookup: CSS name → value, resolved literal, mode values, confidence. One line per token.
  const base = new Map(Object.entries(blocks.base));
  const resolve = (v, seen = 0) => (seen > 10 ? v : v.replace(/var\((--[a-z0-9-]+)\)/g, (m, n) => (base.has(n) ? resolve(base.get(n), seen + 1) : m)));
  const lines = tokens.map(({ path: p }) => {
    let node = out; for (const k of p) node = node[k];
    const c = node.$extensions['com.flyemirates.css'], s = node.$extensions['com.flyemirates.source'];
    const e = { value: c.value };
    if (c.value.includes('var(')) e.resolved = resolve(c.value);
    Object.assign(e, c.modes ?? {});
    e.confidence = s.confidence;
    if (s.modes) e.modeConfidence = s.modes;
    return `  ${JSON.stringify(c.name)}: ${JSON.stringify(e)}`;
  });
  const valuesJson =
    '{\n  "$schema": "../schemas/manifest.schema.json#/$defs/tokenValues",\n  "schemaVersion": "1.0.0",\n' +
    '  "$comment": "CSS name → base value, resolved literal, md/lg/xl/ar values and confidence. Generated from tokens.json; attribution details and references are there.",\n' +
    '  "tokens": {\n' + lines.map((l) => '  ' + l).join(',\n') + '\n  }\n}\n';
  return { tokensJson: ordered, valuesJson, count: tokens.length, unattributed };
}

// ---------------------------------------------------------------- indexes

async function loadSpecs() {
  const compDir = path.join(PKG, 'components');
  const components = [];
  for (const d of (await readdir(compDir, { withFileTypes: true })).filter((e) => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    components.push(await readJson(path.join(compDir, d.name, 'spec.json')));
  }
  const patDir = path.join(PKG, 'patterns');
  const patterns = [];
  for (const f of (await readdir(patDir)).filter((f) => f.endsWith('.json') && f !== 'index.json').sort()) {
    patterns.push(await readJson(path.join(patDir, f)));
  }
  return { components, patterns };
}

const firstSentence = (s) => (/^(.*?[.!?])(\s|$)/.exec(s)?.[1] ?? s);

function componentIndex(components, patterns) {
  const usedBy = new Map();
  for (const c of components) for (const d of c.composes ?? []) usedBy.set(d, [...(usedBy.get(d) ?? []), c.id]);
  const inPatterns = new Map();
  for (const p of patterns) {
    const ids = new Set([...(p.components ?? []), ...(p.regions ?? []).flatMap((r) => r.components ?? [])]);
    for (const id of ids) inPatterns.set(id, [...(inPatterns.get(id) ?? []), p.id]);
  }
  const LAYER_ORDER = { primitive: 0, composite: 1, feature: 2 };
  const sorted = [...components].sort((a, b) => LAYER_ORDER[a.layer] - LAYER_ORDER[b.layer] || a.id.localeCompare(b.id));
  const presetAliases = components.flatMap((c) =>
    (c.presets ?? []).map((p) => ({ name: p.name, target: c.id, preset: p.id, reason: `Not a separate component: ${p.description}` })),
  );
  const nameAliases = components.flatMap((c) =>
    (c.aliases ?? []).map((a) => ({ name: a, target: c.id, reason: 'Alternative name used in the source documents' })),
  );
  return {
    $schema: '../schemas/manifest.schema.json#/$defs/componentIndex',
    schemaVersion: SCHEMA_VERSION,
    components: sorted.map((c) => {
      const e = {
        id: c.id, name: c.name, layer: c.layer, category: c.category, inDesignSystem: c.inDesignSystem,
        status: c.status, confidence: c.provenance.confidence, path: `components/${c.id}/spec.json`,
        summary: firstSentence(c.description),
      };
      if (c.composes?.length) e.composes = c.composes;
      if (usedBy.has(c.id)) e.usedBy = [...new Set(usedBy.get(c.id))].sort();
      if (inPatterns.has(c.id)) e.patterns = [...new Set(inPatterns.get(c.id))].sort();
      e.tokenCount = (c.tokens ?? []).length;
      return e;
    }),
    aliases: [...presetAliases, ...nameAliases],
    notComponents: [
      { name: 'Logo', reason: 'A brand asset (Official file emirates-logo-badge.svg), not a component. Never drawn from the icon set.', source: { doc: 'scope-boundaries', section: 'decision-table' } },
    ],
  };
}

function patternIndex(patterns) {
  return {
    $schema: '../schemas/manifest.schema.json#/$defs/patternIndex',
    schemaVersion: SCHEMA_VERSION,
    patterns: patterns.map((p) => {
      const comps = [...new Set([...(p.components ?? []), ...(p.regions ?? []).flatMap((r) => r.components ?? [])])].sort();
      const e = { id: p.id, name: p.name, kind: p.kind, status: p.status, path: `patterns/${p.id}.json`, summary: firstSentence(p.description), components: comps };
      if (p.patterns?.length) e.patterns = p.patterns;
      return e;
    }),
  };
}

// ---------------------------------------------------------------- references

async function sourcesJson() {
  const overview = await read(path.join(REPO, DOC_BY_ID.overview.path));
  const decisions = [...overview.matchAll(/^\| (D\d+) \| (.*) \|$/gm)].map((m) => ({
    id: m[1], text: m[2].trim(), status: 'agreed', date: '2026-11-09',
  }));
  const documents = [];
  for (const d of DOCS) {
    const e = { ...d, sha256: await sha256(path.join(REPO, d.path)) };
    if (d.id === 'research-file-a') e.note = 'Cites no sources. Every value taken from it is tagged "A · unverified" (confidence: inferred).';
    if (d.kind === 'audit') e.note = 'Pre-system working document. Superseded by design-system/; listed for provenance only.';
    documents.push(e);
  }
  return {
    $schema: '../schemas/manifest.schema.json#/$defs/sources',
    schemaVersion: SCHEMA_VERSION,
    note:
      'Provenance for every spec in this package. Paths are relative to the repository root and are NOT shipped in the npm package. ' +
      'sha256 values record the exact document versions this package was generated from; `npm run check` reports drift.',
    documents,
    sourceTags: SOURCE_TAGS,
    decisions,
  };
}

// ---------------------------------------------------------------- manifest

function manifest(pkg, counts) {
  return {
    $schema: './schemas/manifest.schema.json',
    schemaVersion: SCHEMA_VERSION,
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    disclaimer:
      'Unofficial concept. Emirates brand guidelines are not public; the logo and typefaces are proprietary. Nothing here is endorsed by Emirates. ' +
      'Only values with confidence "official" come from Emirates sources; "observed" values were read from the live site by a third party; ' +
      '"inferred" values are unverified; "proposed" values are design-system recommendations.',
    vocabulary: {
      confidence: {
        official: 'Directly supported by verified Emirates documentation.',
        observed: 'Identified by inspecting an Emirates digital experience (the live website).',
        inferred: 'Unverified third-party claim or interpretation (File A).',
        proposed: 'A design-system recommendation (Rec). approved: true marks recommendations approved over an observed value.',
        unattributed: 'The source documents give no source for this value (e.g. a mobile size in a row tagged only for desktop).',
      },
      tokenConfidence: 'For tokens, confidence is that of the base (:root) value; source.modes lists breakpoint or Arabic values whose confidence differs.',
      sourceTags: Object.fromEntries(Object.entries(SOURCE_TAGS).map(([k, v]) => [k, v.confidence])),
      status: {
        specification: 'complete = props, states and accessibility documented; partial = described but not fully specified.',
        designed: 'A Figma or equivalent design exists. false for every component in this version.',
        implemented: 'Production code exists. false for every component in this version.',
        tested: 'Automated and accessibility tests exist. false for every component in this version.',
      },
      layers: {
        primitive: 'Tier 1. Part of the design system.',
        composite: 'Tier 2. Part of the design system.',
        feature: 'Assembled in the product from design-system parts. Specified here for completeness; not part of the design system (scope-boundaries).',
      },
    },
    resources: [
      { id: 'manifest-schema', path: 'schemas/manifest.schema.json', mediaType: 'application/schema+json', description: 'Schema for this manifest, the indexes, layouts and references.' },
      { id: 'token-schema', path: 'schemas/token.schema.json', mediaType: 'application/schema+json', description: 'Schema for tokens/tokens.json.' },
      { id: 'component-schema', path: 'schemas/component.schema.json', mediaType: 'application/schema+json', description: 'Schema for each component spec.' },
      { id: 'pattern-schema', path: 'schemas/pattern.schema.json', mediaType: 'application/schema+json', description: 'Schema for each pattern spec.' },
      { id: 'common-schema', path: 'schemas/common.defs.json', mediaType: 'application/schema+json', description: 'Shared definitions (source attribution, status, ids).' },
      { id: 'tokens-json', path: 'tokens/tokens.json', mediaType: 'application/json', schema: 'schemas/token.schema.json', description: 'All design tokens: W3C DTCG values plus exact CSS output, breakpoint and Arabic values, attribution and component usage.' },
      { id: 'token-values', path: 'tokens/values.json', mediaType: 'application/json', schema: 'schemas/manifest.schema.json#/$defs/tokenValues', description: 'Compact lookup (one line per token): CSS name → value, resolved literal, breakpoint and Arabic values, confidence. Use this to resolve the tokens a spec lists without loading tokens.json.' },
      { id: 'tokens-css', path: 'tokens/tokens.css', mediaType: 'text/css', description: 'CSS custom properties. Identical to design-system/tokens/tokens.css.' },
      { id: 'fonts-css', path: 'tokens/fonts.css', mediaType: 'text/css', description: 'Arabic @font-face ("EK Arabic"). Load with tokens.css.' },
      { id: 'component-index', path: 'components/index.json', mediaType: 'application/json', schema: 'schemas/manifest.schema.json#/$defs/componentIndex', description: 'Every component with id, layer, status, relationships and path. Read this first, then fetch single specs.' },
      { id: 'component-spec', path: 'components/{id}/spec.json', pathTemplate: 'components/{id}/spec.json', mediaType: 'application/json', schema: 'schemas/component.schema.json', description: 'One component specification.' },
      { id: 'pattern-index', path: 'patterns/index.json', mediaType: 'application/json', schema: 'schemas/manifest.schema.json#/$defs/patternIndex', description: 'Every page pattern, flow and state model.' },
      { id: 'pattern-spec', path: 'patterns/{id}.json', pathTemplate: 'patterns/{id}.json', mediaType: 'application/json', schema: 'schemas/pattern.schema.json', description: 'One pattern specification.' },
      { id: 'layouts', path: 'layouts/layouts.json', mediaType: 'application/json', schema: 'schemas/manifest.schema.json#/$defs/layouts', description: 'Breakpoints, grid, containers, per-breakpoint adaptations, surface layers.' },
      { id: 'references', path: 'references/sources.json', mediaType: 'application/json', schema: 'schemas/manifest.schema.json#/$defs/sources', description: 'Source documents (with hashes), source-tag definitions and the decision log D1–D24.' },
      { id: 'foundation-color', path: 'foundations/color.md', mediaType: 'text/markdown', description: 'Colour rules and hierarchy.' },
      { id: 'foundation-typography', path: 'foundations/typography.md', mediaType: 'text/markdown', description: 'Type rules, scale and Arabic adjustments.' },
      { id: 'foundation-spacing', path: 'foundations/spacing.md', mediaType: 'text/markdown', description: 'Spacing scale and units.' },
      { id: 'foundation-shapes', path: 'foundations/shapes.md', mediaType: 'text/markdown', description: 'Radius, border widths, elevation and selection rules.' },
      { id: 'foundation-icons', path: 'foundations/icons.md', mediaType: 'text/markdown', description: 'Icon set, sizes, aviation map and RTL mirroring.' },
      { id: 'accessibility-guidelines', path: 'accessibility/guidelines.md', mediaType: 'text/markdown', description: 'WCAG 2.2 AA baseline and acceptance criteria. Component-specific rules are in each spec.' },
      { id: 'rtl-guidelines', path: 'rtl/guidelines.md', mediaType: 'text/markdown', description: 'Right-to-left and Arabic rules.' },
      { id: 'changelog', path: 'CHANGELOG.md', mediaType: 'text/markdown', description: 'Package changes.' },
    ],
    counts,
    retrieval: [
      'Start with manifest.json, then components/index.json or patterns/index.json.',
      'Fetch one component with components/{id}/spec.json (package export: ./components/{id}).',
      'Resolve the tokens a spec lists with tokens/values.json (small, keyed by CSS name). Load tokens/tokens.json only for full attribution, DTCG references and usedBy.',
      'Check provenance before presenting a value as Emirates brand fact: only confidence "official" is an Emirates source.',
    ],
    notImplemented: [
      'Figma designs (designed: false everywhere)',
      'React/TypeScript components (implemented: false everywhere)',
      'Storybook stories and automated tests (tested: false everywhere)',
      'Pricing / seat-map / booking API contracts (the specs define client state and responsibilities only)',
      'MCP server, CLI or code generators',
    ],
  };
}

// ---------------------------------------------------------------- run

const outputs = new Map(); // abs path -> string | Buffer (copy)
const { components, patterns } = await loadSpecs();
const { tokensJson, valuesJson, count, unattributed } = await buildTokens(components);
outputs.set(path.join(PKG, 'tokens/tokens.json'), json(tokensJson));
outputs.set(path.join(PKG, 'tokens/values.json'), valuesJson);
outputs.set(path.join(PKG, 'components/index.json'), json(componentIndex(components, patterns)));
outputs.set(path.join(PKG, 'patterns/index.json'), json(patternIndex(patterns)));
outputs.set(path.join(PKG, 'references/sources.json'), json(await sourcesJson()));
const pkg = await readJson(path.join(PKG, 'package.json'));
outputs.set(path.join(PKG, 'manifest.json'), json(manifest(pkg, {
  tokens: count,
  components: components.length,
  componentsInDesignSystem: components.filter((c) => c.inDesignSystem).length,
  featureComponents: components.filter((c) => !c.inDesignSystem).length,
  patterns: patterns.length,
})));

const copies = [
  ['design-system/tokens/tokens.css', 'tokens/tokens.css'],
  ['design-system/tokens/fonts.css', 'tokens/fonts.css'],
  ...[400, 500, 700].map((w) => [`design-system/tokens/fonts/noto-sans-arabic-arabic-${w}-normal.woff2`, `tokens/fonts/noto-sans-arabic-arabic-${w}-normal.woff2`]),
  ['design-system/node_modules/@fontsource/noto-sans-arabic/LICENSE', 'tokens/fonts/OFL.txt'],
];

let stale = [];
for (const [file, content] of outputs) {
  const current = await read(file).catch(() => null);
  if (current !== content) stale.push(rel(file));
  if (!CHECK) { await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, content); }
}
for (const [from, to] of copies) {
  const a = path.join(REPO, from), b = path.join(PKG, to);
  const same = (await sha256(a)) === (await sha256(b).catch(() => ''));
  if (!same) stale.push(rel(b));
  if (!CHECK) { await mkdir(path.dirname(b), { recursive: true }); await copyFile(a, b); }
}

if (unattributed.length) console.warn(`Unattributed tokens (${unattributed.length}): ${unattributed.join(', ')}`);
if (CHECK) {
  if (stale.length) { console.error(`Out of date: ${stale.join(', ')}. Run npm run build.`); process.exit(1); }
  console.log('Generated files are up to date.');
} else {
  console.log(`Built: ${count} tokens, ${components.length} components, ${patterns.length} patterns. Updated: ${stale.length ? stale.join(', ') : 'nothing'}`);
}
