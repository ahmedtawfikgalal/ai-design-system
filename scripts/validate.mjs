// Validates the design-spec package.
//   node scripts/validate.mjs
// Checks: JSON syntax, JSON Schemas, token ↔ CSS consistency, unique ids, internal references,
// coverage of documented components and patterns, attribution, unsupported values, source drift.
// Checks that need the repository (source documents) are skipped with a notice when run elsewhere.

import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.resolve(PKG, '..');
const errors = [];
const notes = [];
const fail = (m) => errors.push(m);
const read = (p) => readFile(p, 'utf8');
const exists = (p) => stat(p).then(() => true, () => false);
const splitFirstCell = (line) => line.split(/(?<!\\)\|/)[1] ?? '';
const slug = (h) => h.trim().toLowerCase().replace(/[^\p{L}\p{N}\- _]/gu, '').replace(/ /g, '-');

async function listJson(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.name === 'node_modules' || e.name === 'scripts') continue;
    if (e.isDirectory()) out.push(...(await listJson(p)));
    else if (e.name.endsWith('.json') && e.name !== 'package-lock.json') out.push(p);
  }
  return out;
}

// 1. JSON syntax --------------------------------------------------------------------------
const docs = new Map();
for (const f of await listJson(PKG)) {
  try { docs.set(path.relative(PKG, f), JSON.parse(await read(f))); }
  catch (e) { fail(`JSON syntax: ${path.relative(PKG, f)}: ${e.message}`); }
}
const get = (p) => docs.get(p);

// 2. Schemas ------------------------------------------------------------------------------
const ajv = new Ajv2020({ allErrors: true, strict: false });
for (const s of ['common.defs.json', 'token.schema.json', 'component.schema.json', 'pattern.schema.json', 'manifest.schema.json']) {
  const schema = get(`schemas/${s}`);
  ajv.addSchema(schema);
}
const check = (schemaRef, file) => {
  const validate = ajv.getSchema('https://fly-emirates-design-spec.invalid/schemas/' + schemaRef);
  if (!validate(get(file))) fail(`Schema ${schemaRef} ✗ ${file}: ${ajv.errorsText(validate.errors, { separator: '; ' })}`);
};
let schemaChecked = 0;
const componentFiles = [...docs.keys()].filter((k) => /^components\/[^/]+\/spec\.json$/.test(k));
const patternFiles = [...docs.keys()].filter((k) => /^patterns\/(?!index)[^/]+\.json$/.test(k));
for (const f of componentFiles) { check('component.schema.json', f); schemaChecked++; }
for (const f of patternFiles) { check('pattern.schema.json', f); schemaChecked++; }
check('token.schema.json', 'tokens/tokens.json'); schemaChecked++;
check('manifest.schema.json', 'manifest.json'); schemaChecked++;
for (const [f, def] of [['tokens/values.json', 'tokenValues'], ['components/index.json', 'componentIndex'], ['patterns/index.json', 'patternIndex'], ['layouts/layouts.json', 'layouts'], ['references/sources.json', 'sources']]) {
  check(`manifest.schema.json#/$defs/${def}`, f); schemaChecked++;
}
const unschematized = [...docs.keys()].filter((k) => !k.startsWith('schemas/') && k !== 'package.json' &&
  ![...componentFiles, ...patternFiles, 'tokens/tokens.json', 'manifest.json', 'components/index.json', 'patterns/index.json', 'layouts/layouts.json', 'references/sources.json', 'tokens/values.json'].includes(k));
if (unschematized.length) fail(`JSON files without a schema: ${unschematized.join(', ')}`);

// 3. Tokens ↔ CSS -------------------------------------------------------------------------
const tokens = [];
(function walk(n, p = []) {
  for (const [k, v] of Object.entries(n)) {
    if (k.startsWith('$') || typeof v !== 'object') continue;
    if ('$value' in v) tokens.push({ path: [...p, k], t: v }); else walk(v, [...p, k]);
  }
})(get('tokens/tokens.json'));
const tokenByCss = new Map(tokens.map((x) => [x.t.$extensions['com.flyemirates.css'].name, x]));
if (tokenByCss.size !== tokens.length) fail('Duplicate CSS names in tokens.json');

const css = (await read(path.join(PKG, 'tokens/tokens.css'))).replace(/\/\*[\s\S]*?\*\//g, '');
const blockDecls = (body) => [...body.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]);
const blocks = { base: blockDecls(/^:root \{([\s\S]*?)^\}/m.exec(css)[1]) };
for (const [m, em] of [['md', '48em'], ['lg', '64em'], ['xl', '90em']]) {
  const b = new RegExp(`@media \\(min-width: ${em}\\) \\{\\s*:root \\{([\\s\\S]*?)\\}\\s*\\}`).exec(css);
  blocks[m] = b ? blockDecls(b[1]) : [];
}
blocks.ar = blockDecls(/:root:lang\(ar\), \[lang\|="ar"\] \{([\s\S]*?)\}/.exec(css)[1]);
let cssDecls = 0;
for (const [mode, decls] of Object.entries(blocks)) {
  for (const [name, value] of decls) {
    cssDecls++;
    const tok = tokenByCss.get(name);
    if (!tok) { fail(`tokens.css ${mode}: ${name} has no token in tokens.json`); continue; }
    const c = tok.t.$extensions['com.flyemirates.css'];
    const expected = mode === 'base' ? c.value : c.modes?.[mode];
    if (expected !== value) fail(`tokens.css ${mode}: ${name} = "${value}" but tokens.json says "${expected}"`);
  }
}
for (const { t } of tokens) {
  const c = t.$extensions['com.flyemirates.css'];
  if (!blocks.base.some(([n]) => n === c.name)) fail(`${c.name} missing from tokens.css :root`);
  for (const m of Object.keys(c.modes ?? {})) if (!blocks[m].some(([n]) => n === c.name)) fail(`${c.name} mode ${m} missing from tokens.css`);
}
// values.json agrees with tokens.json
const values = get('tokens/values.json').tokens;
if (Object.keys(values).length !== tokens.length) fail('tokens/values.json token count differs from tokens.json');
for (const { t } of tokens) {
  const c = t.$extensions['com.flyemirates.css'], v = values[c.name];
  if (!v || v.value !== c.value || v.confidence !== t.$extensions['com.flyemirates.source'].confidence) fail(`tokens/values.json disagrees with tokens.json for ${c.name}`);
}
// DTCG references resolve
const tokenKeys = new Set(tokens.map((x) => x.path.join('.')));
for (const { path: p, t } of tokens) {
  for (const r of JSON.stringify([t.$value, t.$extensions['com.flyemirates.modes'] ?? {}]).match(/\{[a-z0-9.-]+\}/g) ?? []) {
    if (!tokenKeys.has(r.slice(1, -1))) fail(`Token ${p.join('.')} references unknown ${r}`);
  }
}
if (await exists(path.join(REPO, 'design-system/tokens/tokens.css'))) {
  const a = await read(path.join(REPO, 'design-system/tokens/tokens.css'));
  if (a !== (await read(path.join(PKG, 'tokens/tokens.css')))) fail('tokens/tokens.css differs from design-system/tokens/tokens.css (run npm run build)');
} else notes.push('Repository not found: skipped tokens.css comparison with design-system/.');

// 4. Identifiers ----------------------------------------------------------------------------
const components = componentFiles.map((f) => [f, get(f)]);
const compIds = new Set();
const compNames = new Set();
for (const [f, c] of components) {
  if (compIds.has(c.id)) fail(`Duplicate component id ${c.id}`);
  if (compNames.has(c.name)) fail(`Duplicate component name ${c.name}`);
  compIds.add(c.id); compNames.add(c.name);
  if (f !== `components/${c.id}/spec.json`) fail(`${f}: folder does not match id ${c.id}`);
}
const patterns = patternFiles.map((f) => [f, get(f)]);
const patIds = new Set();
for (const [f, p] of patterns) {
  if (patIds.has(p.id) || compIds.has(p.id)) fail(`Duplicate id ${p.id}`);
  patIds.add(p.id);
  if (f !== `patterns/${p.id}.json`) fail(`${f}: file name does not match id ${p.id}`);
}

// 5. Internal references ------------------------------------------------------------------
const sources = get('references/sources.json');
const docIds = new Map(sources.documents.map((d) => [d.id, d]));
const anchorCache = new Map();
let repoDocsAvailable = await exists(path.join(REPO, 'design-system'));
async function anchors(docId) {
  if (!anchorCache.has(docId)) {
    const d = docIds.get(docId);
    const text = d.path.endsWith('.md') ? await read(path.join(REPO, d.path)) : '';
    anchorCache.set(docId, new Set([...text.matchAll(/^#{1,6}\s+(.*)$/gm)].map((m) => slug(m[1]))));
  }
  return anchorCache.get(docId);
}
let refCount = 0;
async function checkRef(where, r) {
  refCount++;
  if (!docIds.has(r.doc)) return fail(`${where}: unknown source document "${r.doc}"`);
  if (r.section && repoDocsAvailable && !(await anchors(r.doc)).has(r.section)) fail(`${where}: no section #${r.section} in ${docIds.get(r.doc).path}`);
}
async function walkRefs(where, node) {
  if (Array.isArray(node)) { for (const x of node) await walkRefs(where, x); return; }
  if (node && typeof node === 'object') {
    if (typeof node.doc === 'string' && Object.keys(node).every((k) => k === 'doc' || k === 'section')) return checkRef(where, node);
    for (const v of Object.values(node)) await walkRefs(where, v);
  }
}
const checkTokens = (where, list) => { for (const t of list ?? []) if (!tokenByCss.has(t)) fail(`${where}: unknown token ${t}`); };
for (const [f, c] of components) {
  for (const d of c.composes ?? []) if (!compIds.has(d)) fail(`${f}: composes unknown component ${d}`);
  if ((c.composes ?? []).includes(c.id)) fail(`${f}: composes itself`);
  checkTokens(f, c.tokens);
  for (const v of c.variants ?? []) { checkTokens(`${f} variant ${v.name}`, v.tokens); for (const t of v.tokens ?? []) if (!c.tokens?.includes(t)) fail(`${f}: variant token ${t} not listed in tokens`); }
  for (const s of c.states ?? []) { checkTokens(`${f} state ${s.name}`, s.tokens); for (const t of s.tokens ?? []) if (!c.tokens?.includes(t)) fail(`${f}: state token ${t} not listed in tokens`); }
  await walkRefs(f, c);
}
for (const [f, p] of patterns) {
  for (const id of [...(p.components ?? []), ...(p.regions ?? []).flatMap((r) => r.components ?? [])]) if (!compIds.has(id)) fail(`${f}: unknown component ${id}`);
  for (const id of p.patterns ?? []) if (!patIds.has(id)) fail(`${f}: unknown pattern ${id}`);
  checkTokens(f, p.tokens);
  for (const r of p.regions ?? []) checkTokens(`${f} region ${r.name}`, r.tokens);
  await walkRefs(f, p);
}
const layouts = get('layouts/layouts.json');
for (const s of layouts.surfaceLayers) checkTokens('layouts surfaceLayers', s.tokens);
checkTokens('layouts controlHeights', layouts.controlHeights.tokens);
checkTokens('layouts containers', layouts.containers.map((c) => c.token));
checkTokens('layouts grid', Object.values(layouts.grid.tokens));
await walkRefs('layouts/layouts.json', layouts);
for (const { path: p, t } of tokens) await walkRefs(`token ${p.join('.')}`, t.$extensions['com.flyemirates.source'].refs ?? []);
const cIndex = get('components/index.json');
for (const e of cIndex.components) { if (!compIds.has(e.id)) fail(`components/index.json: unknown ${e.id}`); if (!docs.has(e.path)) fail(`index path missing: ${e.path}`); }
if (cIndex.components.length !== compIds.size) fail('components/index.json is missing components (run npm run build)');
for (const a of cIndex.aliases) {
  if (!compIds.has(a.target)) fail(`alias ${a.name}: unknown target ${a.target}`);
  if (a.preset && !(get(`components/${a.target}/spec.json`).presets ?? []).some((p) => p.id === a.preset)) fail(`alias ${a.name}: unknown preset ${a.preset}`);
}
for (const e of get('patterns/index.json').patterns) if (!patIds.has(e.id) || !docs.has(e.path)) fail(`patterns/index.json: bad entry ${e.id}`);
for (const r of get('manifest.json').resources) if (!r.pathTemplate && !(await exists(path.join(PKG, r.path.split('#')[0])))) fail(`manifest resource missing: ${r.path}`);
for (const [k, d] of docs) if (d?.$schema && !d.$schema.startsWith('http')) {
  const target = path.join(PKG, path.dirname(k), d.$schema.split('#')[0]);
  if (!(await exists(target))) fail(`${k}: $schema path ${d.$schema} does not exist`);
}
const tokenUsedBy = tokens.flatMap(({ t }) => t.$extensions['com.flyemirates.usedBy'] ?? []);
for (const id of tokenUsedBy) if (!compIds.has(id)) fail(`tokens usedBy unknown component ${id}`);

// 6. Coverage of documented components and patterns -----------------------------------------
const known = new Set([...compNames, ...cIndex.aliases.map((a) => a.name), ...cIndex.notComponents.map((n) => n.name)]);
if (repoDocsAvailable) {
  const documented = new Set();
  const inv = await read(path.join(REPO, 'design-system/components/inventory.md'));
  for (const m of inv.matchAll(/^### (\w+)/gm)) documented.add(m[1]);
  const ref = inv.split('## Category 7')[1] ?? '';
  for (const line of ref.split('\n').filter((l) => l.startsWith('| `'))) {
    for (const m of splitFirstCell(line).matchAll(/`([A-Z]\w+)`/g)) documented.add(m[1]);
  }
  for (const f of ['proposal/tier-1-primitives.md', 'proposal/tier-2-composites.md']) {
    const t = await read(path.join(REPO, 'design-system', f));
    for (const m of t.matchAll(/^## (\w+)$/gm)) if (m[1] !== 'Summary') documented.add(m[1]);
  }
  const scope = await read(path.join(REPO, 'design-system/proposal/scope-boundaries.md'));
  for (const m of scope.matchAll(/^\| `(\w+)`(?: \/ `(\w+)`)? \|/gm)) { documented.add(m[1]); if (m[2]) documented.add(m[2]); }
  const missing = [...documented].filter((n) => !known.has(n));
  if (missing.length) fail(`Documented components not represented: ${missing.join(', ')}`);
  notes.push(`Coverage: ${documented.size} component names found in the source docs; all represented.`);

  const pat = await read(path.join(REPO, 'design-system/layout/patterns.md'));
  const expected = {
    'Page Shell': 'page-shell', 'Pattern 1 — Home / Search Hero': 'home-search-hero', 'Pattern 2 — Flight Results': 'flight-results',
    'Pattern 3 — Booking Flow (passengers → seats → extras → payment)': 'booking-flow', 'Pattern 4 — Seat Selection': 'seat-selection',
    'Pattern 5 — Destination Grid': 'destination-grid', 'Pattern 6 — Cabin Experience Page': 'cabin-experience', 'Surface Layering Model': 'layouts:surfaceLayers',
  };
  for (const m of pat.matchAll(/^## (.*)$/gm)) {
    const target = expected[m[1]];
    if (!target) fail(`Documented pattern "${m[1]}" has no mapping`);
    else if (target.startsWith('layouts:')) { if (!layouts.surfaceLayers?.length) fail('Surface layering missing from layouts.json'); }
    else if (!patIds.has(target)) fail(`Documented pattern "${m[1]}" not represented (${target})`);
  }
  if (!patIds.has('booking-state')) fail('Booking state model (state-architecture.md) not represented');
}

// 7. Attribution --------------------------------------------------------------------------
const byConf = {};
for (const { path: p, t } of tokens) {
  const s = t.$extensions['com.flyemirates.source'];
  byConf[s.confidence] = (byConf[s.confidence] ?? 0) + 1;
  if (s.tag === 'UNATTRIBUTED') fail(`Token ${p.join('.')} has no source attribution`);
}
async function checkOfficial(where, node) {
  if (Array.isArray(node)) { for (const x of node) await checkOfficial(where, x); return; }
  if (node && typeof node === 'object') {
    if (node.confidence === 'official' && typeof node.tag === 'string' && !/Official/.test(node.tag)) fail(`${where}: confidence "official" but the tag does not cite an Official source: "${node.tag}"`);
    if (node.confidence && typeof node.tag === 'string' && !/Official|Live|A · unverified|File A|Rec/.test(node.tag)) fail(`${where}: tag "${node.tag}" names no recognised source`);
    for (const v of Object.values(node)) await checkOfficial(where, v);
  }
}
for (const [k, d] of docs) if (!k.startsWith('schemas/')) await checkOfficial(k, d);

// 8. Unsupported values: every hex colour and px value in specs must appear in the sources ----
if (repoDocsAvailable) {
  let corpus = '';
  for (const d of sources.documents) corpus += await read(path.join(REPO, d.path)).catch(() => '');
  const lower = corpus.toLowerCase();
  const scan = [...componentFiles, ...patternFiles, 'layouts/layouts.json'];
  for (const f of scan) {
    const text = JSON.stringify(get(f));
    for (const hex of new Set(text.match(/#[0-9A-Fa-f]{6}\b/g) ?? [])) if (!lower.includes(hex.toLowerCase())) fail(`${f}: colour ${hex} not found in any source document`);
    for (const px of new Set(text.match(/\b\d+(?:\.\d+)?px\b/g) ?? [])) if (!corpus.includes(px)) fail(`${f}: value ${px} not found in any source document`);
    for (const ratio of new Set(text.match(/\b\d+\.\d+:1\b/g) ?? [])) if (!corpus.includes(ratio)) fail(`${f}: contrast ${ratio} not found in any source document`);
  }
}

// 9. Source drift: documents still match the hashes recorded at build time ------------------
if (repoDocsAvailable) {
  const drift = [];
  for (const d of sources.documents) {
    const h = createHash('sha256').update(await readFile(path.join(REPO, d.path))).digest('hex');
    if (h !== d.sha256) drift.push(d.path);
  }
  if (drift.length) fail(`Source documents changed since the package was built: ${drift.join(', ')}. Review the specs, then run npm run build.`);
} else notes.push('Repository not found: skipped section-anchor, coverage, value and drift checks.');

// Report ----------------------------------------------------------------------------------
console.log(`JSON files parsed: ${docs.size}`);
console.log(`Schema validations: ${schemaChecked}`);
console.log(`Tokens: ${tokens.length} (${Object.entries(byConf).map(([k, v]) => `${k} ${v}`).join(', ')}); CSS declarations checked: ${cssDecls}`);
console.log(`Components: ${compIds.size} (${components.filter(([, c]) => c.inDesignSystem).length} design system, ${components.filter(([, c]) => !c.inDesignSystem).length} feature); patterns: ${patIds.size}`);
console.log(`Source references checked: ${refCount}`);
for (const n of notes) console.log(`Note: ${n}`);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('\nAll checks passed.');
