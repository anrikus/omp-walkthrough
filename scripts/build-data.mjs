import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const EXPECTED_CHAPTER_IDS = Array.from({ length: 14 }, (_, index) => `ch${String(index).padStart(2, '0')}`);
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isKey = (value) => typeof value === 'string' && value.length > 0 && !/\s/.test(value);

export async function loadInputs({ root = DEFAULT_ROOT, strict = false } = {}) {
  root = resolve(root);
  const errors = [];
  const warnings = [];
  const missing = (message) => (strict ? errors : warnings).push(message);

  async function readJson(path, optional = false) {
    try {
      return { path, data: JSON.parse(await readFile(join(root, path), 'utf8')) };
    } catch (error) {
      if (optional && error.code === 'ENOENT') missing(`${path}: missing authoring output`);
      else errors.push(`${path}: ${error.message}`);
      return null;
    }
  }

  async function loadResearch(path, keyField) {
    const records = new Map();
    const input = await readJson(path);
    if (!input) return records;
    if (!Array.isArray(input.data)) {
      errors.push(`${path}: expected a root array`);
      return records;
    }
    input.data.forEach((record, index) => {
      const location = `${path}[${index}]`;
      if (!isObject(record)) {
        errors.push(`${location}: expected an object`);
      } else if (!isKey(record[keyField])) {
        errors.push(`${location}.${keyField}: expected a nonempty ID without whitespace`);
      } else if (records.has(record[keyField])) {
        errors.push(`${location}.${keyField}: duplicate ID ${JSON.stringify(record[keyField])}`);
      } else {
        records.set(record[keyField], record);
      }
    });
    return records;
  }

  const claims = await loadResearch('research/claims.json', 'id');
  const sources = await loadResearch('research/bibliography.json', 'key');
  let entries = [];
  try {
    entries = await readdir(join(root, 'narration'), { withFileTypes: true });
  } catch (error) {
    if (error.code !== 'ENOENT') errors.push(`narration: ${error.message}`);
  }
  const chapters = [];
  const found = new Set();
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === 'lexicon.json' || entry.name === 'manifest.json') continue;
    if (!entry.name.endsWith('.json') && !entry.name.startsWith('ch')) continue;
    const path = `narration/${entry.name}`;
    const match = /^(ch\d{2})-[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.exec(entry.name);
    if (!match) {
      errors.push(`${path}: invalid narration filename; expected chNN followed by a lowercase hyphenated slug and .json`);
    } else {
      if (found.has(match[1])) errors.push(`${path}: duplicate chapter ID ${match[1]}`);
      found.add(match[1]);
    }
    const input = await readJson(path);
    if (input) {
      chapters.push(input);
      if (!isObject(input.data)) errors.push(`${path}: expected a chapter object`);
      else if (match && input.data.id !== match[1]) errors.push(`${path}.id: expected ${match[1]} to match filename`);
    }
  }
  for (const id of EXPECTED_CHAPTER_IDS) {
    if (!found.has(id)) missing(`narration/${id}-*.json: missing expected chapter`);
  }
  const atlas = await readJson('atlas/features.json', true);
  return { root, chapters, atlas, claims, sources, errors, warnings };
}

export function collectEvidence(inputs) {
  const errors = [];
  const selectedClaims = new Map();
  const selectedSources = new Map();

  function refs(value, path, required, visit) {
    if (value === undefined && !required) return;
    if (!Array.isArray(value)) {
      errors.push(`${path}: expected an array of IDs`);
      return;
    }
    value.forEach((id, index) => {
      const location = `${path}[${index}]`;
      if (!isKey(id)) errors.push(`${location}: expected a nonempty ID without whitespace`);
      else visit(id, location);
    });
  }

  function source(id, path) {
    const record = inputs.sources.get(id);
    if (!record) {
      errors.push(`${path}: unknown source ID ${JSON.stringify(id)}`);
      return;
    }
    if (selectedSources.has(id)) return;
    const { key, title, authors, venue, year, grade, gradeNote, urls, accessed } = record;
    selectedSources.set(id, {
      key, title, authors, venue, year, grade, urls,
      ...(gradeNote === undefined ? {} : { gradeNote }),
      ...(accessed === undefined ? {} : { accessed }),
    });
  }

  function claim(id, path) {
    const record = inputs.claims.get(id);
    if (!record) {
      errors.push(`${path}: unknown claim ID ${JSON.stringify(id)}`);
      return;
    }
    selectedClaims.set(id, record);
    refs(record.citations, `${path} -> research/claims.json[${JSON.stringify(id)}].citations`, true, source);
  }

  function item(value, path, requireSources = false) {
    if (!isObject(value)) {
      errors.push(`${path}: expected an object`);
      return;
    }
    refs(value.claims, `${path}.claims`, true, claim);
    refs(value.sources, `${path}.sources`, requireSources, source);
  }

  function array(value, path, visit) {
    if (!Array.isArray(value)) {
      errors.push(`${path}: expected an array`);
      return;
    }
    value.forEach((entry, index) => visit(entry, `${path}[${index}]`));
  }

  for (const chapter of inputs.chapters) {
    if (!isObject(chapter.data)) {
      errors.push(`${chapter.path}: expected a chapter object`);
      continue;
    }
    array(chapter.data.scenes, `${chapter.path}.scenes`, (scene, path) => {
      if (!isObject(scene)) {
        errors.push(`${path}: expected a scene object`);
        return;
      }
      array(scene.sentences, `${path}.sentences`, (value, location) => item(value, location));
      array(scene.onScreen, `${path}.onScreen`, (value, location) => item(value, location));
    });
  }
  if (inputs.atlas) {
    array(inputs.atlas.data, inputs.atlas.path, (value, path) => item(value, path, true));
  }
  const sortedRecord = (records) => Object.fromEntries([...records].sort(([a], [b]) => a.localeCompare(b)));
  return { evidence: { claims: sortedRecord(selectedClaims), sources: sortedRecord(selectedSources) }, errors };
}

function citationAuthor(authors) {
  const author = typeof authors === 'string' ? authors.trim() : '';
  // Mixed credits and organization names are not safely reducible to a surname.
  if (/[\/;()]/.test(author) || /\b(?:AI|PBC|Inc|LLC|Labs?|Research|Foundation|Corporation|Cloud|Protocol|Community|Team|Staff|maintainers?|contributors?|project|operator|dossier|Overflow|Industries|Database|National|Institute|University|Agency)\b/i.test(author) || /\b\p{Lu}{2,}\b/u.test(author)) return author;
  const hasEtAl = /\s+et al\.?$/i.test(author);
  const names = author.replace(/\s+et al\.?$/i, '').split(/,\s*(?:and\s+)?|\s+and\s+/);
  const personalName = /^(?:\p{Lu}[\p{L}\p{M}'’.-]*\s+){1,3}\p{Lu}[\p{L}\p{M}'’-]*$/u;
  if (!names.every(name => personalName.test(name))) return author;
  const surname = names[0].split(/\s+/).at(-1);
  return `${surname}${hasEtAl || names.length > 1 ? ' et al.' : ''}`;
}

function collectCitationLabels(evidence) {
  const sources = Object.fromEntries(Object.entries(evidence.sources).map(([id, source]) => {
    const ompUrl = source.urls.find(url => url.startsWith('omp://'));
    const author = citationAuthor(source.authors);
    const identity = ompUrl
      ? `omp docs: ${ompUrl.slice('omp://'.length)}`
      : [author || source.title, source.year].filter(value => value !== null && value !== undefined && value !== '').join(' ');
    const grade = /^[A-E]$/.test(source.grade) ? `${source.grade} · ` : '';
    return [id, { label: `${grade}${identity}`, description: `Source: ${source.title}` }];
  }));
  const rank = grade => /^[A-E]$/.test(grade) ? grade.charCodeAt(0) - 65 : 5;
  const claims = Object.fromEntries(Object.entries(evidence.claims).map(([id, claim]) => {
    let bestSource;
    for (const key of claim.citations) {
      const source = evidence.sources[key];
      if (source && (!bestSource || rank(source.grade) < rank(bestSource.grade))) bestSource = source;
    }
    const text = (typeof claim.text === 'string'
      ? claim.text
      : Object.entries(claim.text).map(([key, value]) => `${key}: ${claim.resolved?.[key] ?? value}`).join('; '))
      .replace(/\[INFERENCE(?::([^\]]*))?\]/g, (_, detail) => `Researcher inference${detail === undefined ? '' : `:${detail}`}`)
      .replace(/\s+/g, ' ').trim();
    const summary = text.length > 240 ? `${text.slice(0, 240).trimEnd()}…` : text;
    return [id, bestSource
      ? { label: sources[bestSource.key].label, description: `Claim summary: ${summary} Source: ${bestSource.title}` }
      : { label: 'Evidence unavailable', description: `Claim summary: ${summary} No cited bibliography source.` }];
  }));
  return { claims, sources };
}

export async function buildData(options = {}) {
  const inputs = await loadInputs(options);
  const collected = collectEvidence(inputs);
  const errors = [...inputs.errors, ...collected.errors];
  if (errors.length === 0) {
    const destination = join(inputs.root, 'src/generated');
    try {
      const labels = collectCitationLabels(collected.evidence);
      await mkdir(destination, { recursive: true });
      await writeFile(join(destination, 'evidence.json'), `${JSON.stringify(collected.evidence, null, 2)}\n`, 'utf8');
      await writeFile(join(destination, 'citation-labels.json'), `${JSON.stringify(labels)}\n`, 'utf8');
    } catch (error) {
      errors.push(`src/generated evidence and citation labels: ${error.message}`);
    }
  }
  return { ...inputs, evidence: collected.evidence, errors };
}

async function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter((arg) => arg !== '--strict');
  if (unknown.length) {
    for (const arg of unknown) console.error(`Error: unknown argument ${JSON.stringify(arg)}`);
    console.error('Usage: node scripts/build-data.mjs [--strict]');
    process.exitCode = 1;
    return;
  }
  const result = await buildData({ strict: args.includes('--strict') });
  for (const warning of result.warnings) console.warn(`Warning: ${warning}`);
  for (const error of result.errors) console.error(`Error: ${error}`);
  if (result.errors.length) {
    console.error(`Evidence generation failed with ${result.errors.length} error(s).`);
    process.exitCode = 1;
  } else {
    console.log(`Wrote src/generated/evidence.json and citation-labels.json (${Object.keys(result.evidence.claims).length} claims, ${Object.keys(result.evidence.sources).length} sources; ${result.warnings.length} warning(s)).`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  });
}
