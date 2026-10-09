import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseAst } from 'rolldown/parseAst';
import { EXPECTED_CHAPTER_IDS, loadInputs, collectEvidence } from './build-data.mjs';

export const WORD_BUDGETS = [130, 390, 360, 490, 390, 390, 325, 455, 455, 520, 520, 325, 390, 100];
const GRADES = ['A', 'B', 'C', 'D', 'E'];
const GROUPS = ['Editing & code intelligence', 'Search & reading', 'Execution & automation', 'Context & memory', 'Sessions & planning', 'Multi-agent', 'Extensibility', 'Providers & models', 'Safety & settings', 'Interface'];
const COLORS = new Set(['fg', 'bg', 'chrome', 'widget', 'accent', 'deepBlue', 'gold', 'bright', 'dim', 'comment', 'warning', 'success', 'error', 'border', 'mutedBorder', 'toolErrorBg', 'python', 'thinkingOff', 'thinkingMinimal', 'thinkingLow']);
const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const words = (text) => text.trim().match(/\S+/gu)?.length ?? 0;

function createChecks(errors, warnings, strict) {
  const ids = new Map();
  const fail = (path, message) => errors.push(`${path}: ${message}`);
  const missing = (path, message) => (strict ? errors : warnings).push(`${path}: ${message}`);
  function shape(value, path, required, optional = []) {
    if (!object(value)) { fail(path, 'expected an object'); return false; }
    for (const key of required) if (!Object.hasOwn(value, key)) fail(`${path}.${key}`, 'required field is missing');
    const allowed = new Set([...required, ...optional]);
    for (const key of Object.keys(value)) if (!allowed.has(key)) fail(`${path}.${key}`, 'unknown field');
    return true;
  }
  function text(value, path, allowEmpty = false) {
    if (typeof value !== 'string' || (!allowEmpty && !value.trim())) { fail(path, 'expected a nonempty string'); return false; }
    return true;
  }
  function number(value, path, min = 0, positive = false) {
    if (typeof value !== 'number' || !Number.isFinite(value) || (positive ? value <= min : value < min)) {
      fail(path, `expected a finite number ${positive ? 'greater than' : 'at least'} ${min}`);
      return false;
    }
    return true;
  }
  function array(value, path, nonempty = false) {
    if (!Array.isArray(value)) { fail(path, 'expected an array'); return []; }
    if (nonempty && !value.length) fail(path, 'must not be empty');
    return value;
  }
  function oneOf(value, path, choices) {
    if (!choices.includes(value)) fail(path, `expected one of ${choices.map(String).join(', ')}`);
  }
  function id(value, path, category) {
    if (!text(value, path)) return;
    if (/\s/u.test(value)) fail(path, 'IDs must not contain whitespace');
    if (!ids.has(category)) ids.set(category, new Map());
    const categoryIds = ids.get(category);
    if (categoryIds.has(value)) fail(path, `duplicate ${category} ID ${JSON.stringify(value)}; first seen at ${categoryIds.get(value)}`);
    else categoryIds.set(value, path);
  }
  function stringArray(value, path, nonempty = false) {
    array(value, path, nonempty).forEach((item, index) => text(item, `${path}[${index}]`));
  }
  return { fail, missing, shape, text, number, array, oneOf, id, stringArray };
}

function validateChapter(chapter, path, checks, budgets) {
  const c = checks;
  if (!c.shape(chapter, path, ['id', 'slug', 'title', 'act', 'targetSeconds', 'takeaway', 'scenes'])) return;
  c.id(chapter.id, `${path}.id`, 'chapter');
  c.oneOf(chapter.id, `${path}.id`, EXPECTED_CHAPTER_IDS);
  for (const field of ['slug', 'title', 'act', 'takeaway']) c.text(chapter[field], `${path}.${field}`);
  if (typeof chapter.slug === 'string' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(chapter.slug)) c.fail(`${path}.slug`, 'expected a lowercase hyphenated slug');
  if (typeof chapter.id === 'string' && typeof chapter.slug === 'string' && path !== `narration/${chapter.id}-${chapter.slug}.json`) c.fail(path, 'filename must match chapter id and slug');
  c.number(chapter.targetSeconds, `${path}.targetSeconds`, 0, true);
  const chapterIndex = EXPECTED_CHAPTER_IDS.indexOf(chapter.id);
  let wordCount = 0;
  c.array(chapter.scenes, `${path}.scenes`, true).forEach((scene, index) => {
    const location = `${path}.scenes[${index}]`;
    if (!c.shape(scene, location, ['id', 'title', 'visual', 'sentences', 'onScreen'], ['holdAfter'])) return;
    c.id(scene.id, `${location}.id`, 'scene');
    const expectedId = `${chapterIndex}.${index + 1}`;
    if (chapterIndex >= 0 && scene.id !== expectedId) c.fail(`${location}.id`, `expected ${expectedId} in scene order`);
    for (const field of ['title', 'visual']) c.text(scene[field], `${location}.${field}`);
    if (scene.holdAfter !== undefined) c.number(scene.holdAfter, `${location}.holdAfter`);
    const sentences = c.array(scene.sentences, `${location}.sentences`, true);
    const sentenceIds = new Set();
    sentences.forEach((sentence, sentenceIndex) => {
      const p = `${location}.sentences[${sentenceIndex}]`;
      if (!c.shape(sentence, p, ['id', 'text', 'claims'], ['spoken', 'sources', 'pauseAfter'])) return;
      c.id(sentence.id, `${p}.id`, 'sentence');
      sentenceIds.add(sentence.id);
      const expected = `${scene.id}.${sentenceIndex + 1}`;
      if (sentence.id !== expected) c.fail(`${p}.id`, `expected ${expected} in sentence order`);
      c.text(sentence.text, `${p}.text`);
      if (sentence.spoken !== undefined) c.text(sentence.spoken, `${p}.spoken`);
      const speech = sentence.spoken ?? sentence.text;
      if (typeof speech === 'string') wordCount += words(speech);
      if (sentence.pauseAfter !== undefined) c.number(sentence.pauseAfter, `${p}.pauseAfter`);
      c.stringArray(sentence.claims, `${p}.claims`);
      if (sentence.sources !== undefined) c.stringArray(sentence.sources, `${p}.sources`);
    });
    c.array(scene.onScreen, `${location}.onScreen`).forEach((item, itemIndex) => {
      const p = `${location}.onScreen[${itemIndex}]`;
      if (!c.shape(item, p, ['id', 'kind', 'text', 'claims'], ['grade', 'sources', 'at'])) return;
      c.id(item.id, `${p}.id`, 'onScreen');
      if (typeof item.id === 'string' && (!item.id.startsWith(`${scene.id}.`) || !/^[a-z]+[0-9]*$/.test(item.id.slice(String(scene.id).length + 1)))) c.fail(`${p}.id`, `expected ${scene.id}.<letters><optional digits>`);
      c.oneOf(item.kind, `${p}.kind`, ['stat', 'quote', 'label', 'caption', 'badge', 'code', 'tui']);
      c.text(item.text, `${p}.text`);
      if (item.grade !== undefined) c.oneOf(item.grade, `${p}.grade`, GRADES);
      c.stringArray(item.claims, `${p}.claims`);
      if (item.sources !== undefined) c.stringArray(item.sources, `${p}.sources`);
      if (item.at !== undefined && !sentenceIds.has(item.at)) c.fail(`${p}.at`, `unknown sentence ID in scene ${scene.id}: ${JSON.stringify(item.at)}`);
    });
  });
  if (chapterIndex >= 0) {
    const target = WORD_BUDGETS[chapterIndex];
    budgets.push({ chapter: chapter.id, words: wordCount, target, min: Math.ceil(target * 0.9), max: Math.floor(target * 1.1), withinBudget: wordCount >= target * 0.9 && wordCount <= target * 1.1 });
  }
}

function validateTerminal(script, path, c) {
  if (!c.shape(script, path, ['cols', 'rows', 'duration', 'events'], ['label'])) return;
  for (const dimension of ['cols', 'rows']) {
    if (c.number(script[dimension], `${path}.${dimension}`, 0, true) && !Number.isInteger(script[dimension])) c.fail(`${path}.${dimension}`, 'expected an integer');
  }
  if (typeof script.cols === 'number' && script.cols < 2) c.fail(`${path}.cols`, 'terminal rendering requires at least 2 columns');
  if (c.number(script.duration, `${path}.duration`, 0, true) && script.duration > 12) c.fail(`${path}.duration`, 'atlas loops must be at most 12 seconds');
  if (script.label !== undefined) c.text(script.label, `${path}.label`);
  function span(value, p, styleOnly = false) {
    if (!c.shape(value, p, styleOnly ? [] : ['text'], ['fg', 'bg', 'bold', 'dim', 'italic', 'underline', 'inverse', 'strike'])) return;
    if (!styleOnly) c.text(value.text, `${p}.text`, true);
    for (const color of ['fg', 'bg']) {
      if (value[color] !== undefined && !(COLORS.has(value[color]) || (typeof value[color] === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value[color])))) c.fail(`${p}.${color}`, 'expected a TermColor name or hexadecimal color');
    }
    for (const flag of ['bold', 'dim', 'italic', 'underline', 'inverse', 'strike']) if (value[flag] !== undefined && typeof value[flag] !== 'boolean') c.fail(`${p}.${flag}`, 'expected a boolean');
  }
  function line(value, p) { c.array(value, p).forEach((item, index) => span(item, `${p}[${index}]`)); }
  let previous = -Infinity;
  c.array(script.events, `${path}.events`, true).forEach((event, index) => {
    const p = `${path}.events[${index}]`;
    if (!object(event)) { c.fail(p, 'expected an event object'); return; }
    if (!['type', 'print', 'stream', 'replace', 'status', 'clear'].includes(event.op)) { c.fail(`${p}.op`, 'expected type, print, stream, replace, status, or clear'); return; }
    const fields = {
      type: { required: ['text'], optional: ['cps', 'style'] },
      print: { required: ['lines'], optional: [] },
      stream: { required: ['lines'], optional: ['lps'] },
      replace: { required: ['lines'], optional: [] },
      status: { required: ['line'], optional: [] },
      clear: { required: [], optional: [] },
    }[event.op];
    c.shape(event, p, ['at', 'op', ...fields.required], fields.optional);
    if (c.number(event.at, `${p}.at`)) {
      if (event.at < previous) c.fail(`${p}.at`, 'events must be ordered by time');
      if (event.at > script.duration) c.fail(`${p}.at`, 'event starts after demo duration');
      previous = event.at;
    }
    if (event.op === 'type') {
      c.text(event.text, `${p}.text`, true);
      if (event.cps !== undefined) c.number(event.cps, `${p}.cps`, 0, true);
      if (event.style !== undefined) span(event.style, `${p}.style`, true);
    }
    if (['print', 'stream', 'replace'].includes(event.op)) c.array(event.lines, `${p}.lines`).forEach((value, lineIndex) => line(value, `${p}.lines[${lineIndex}]`));
    if (event.op === 'stream' && event.lps !== undefined) c.number(event.lps, `${p}.lps`, 0, true);
    if (event.op === 'status') line(event.line, `${p}.line`);
  });
}

function validateAtlas(atlas, chapters, c) {
  if (!atlas) return;
  const knownScenes = new Set(chapters.flatMap(({ data }) => Array.isArray(data?.scenes) ? data.scenes.filter(object).map((scene) => scene.id) : []));
  c.array(atlas.data, atlas.path, true).forEach((feature, index) => {
    const p = `${atlas.path}[${index}]`;
    if (!c.shape(feature, p, ['id', 'name', 'group', 'purpose', 'howToInvoke', 'default', 'defaultDetail', 'docs', 'claims', 'sources'], ['prerequisites', 'narratedIn', 'demo'])) return;
    c.id(feature.id, `${p}.id`, 'atlas feature');
    for (const field of ['name', 'purpose', 'howToInvoke', 'defaultDetail']) c.text(feature[field], `${p}.${field}`);
    c.oneOf(feature.group, `${p}.group`, GROUPS);
    c.oneOf(feature.default, `${p}.default`, ['on', 'off', 'conditional']);
    if (feature.prerequisites !== undefined) c.text(feature.prerequisites, `${p}.prerequisites`);
    c.stringArray(feature.docs, `${p}.docs`, true);
    if (Array.isArray(feature.docs)) feature.docs.forEach((doc, docIndex) => {
      if (typeof doc === 'string' && !/^omp:\/\/[^\s]+$/.test(doc)) c.fail(`${p}.docs[${docIndex}]`, 'expected an omp:// documentation path');
    });
    c.stringArray(feature.claims, `${p}.claims`);
    c.stringArray(feature.sources, `${p}.sources`);
    if (feature.narratedIn !== undefined) {
      if (!c.text(feature.narratedIn, `${p}.narratedIn`)) return;
      if (!/^(?:[0-9]|1[0-3])\.[1-9]\d*$/.test(feature.narratedIn)) c.fail(`${p}.narratedIn`, 'expected a scene ID from chapters 0–13');
      else if (!knownScenes.has(feature.narratedIn)) {
        const chapterId = `ch${feature.narratedIn.split('.')[0].padStart(2, '0')}`;
        if (chapters.some(({ data }) => data?.id === chapterId)) c.fail(`${p}.narratedIn`, `unknown scene ID ${feature.narratedIn}`);
        else c.missing(`${p}.narratedIn`, `chapter ${chapterId} is not authored yet`);
      }
    }
    if (feature.demo !== undefined) validateTerminal(feature.demo, `${p}.demo`, c);
  });
}

async function existingFile(root, path, c, message) {
  try {
    const info = await stat(join(root, path));
    if (!info.isFile() || info.size === 0) c.fail(path, 'expected a nonempty file');
    return info.isFile() && info.size > 0;
  } catch (error) {
    if (error.code === 'ENOENT') c.missing(path, message);
    else c.fail(path, error.message);
    return false;
  }
}

async function validateCues(inputs, c) {
  const directory = 'src/generated/cues';
  let entries;
  try { entries = await readdir(join(inputs.root, directory)); }
  catch (error) {
    if (error.code !== 'ENOENT') c.fail(directory, error.message);
    entries = [];
  }
  const files = new Set(entries);
  const chapters = new Map(inputs.chapters.filter(({ data }) => object(data)).map(({ data }) => [data.id, data]));
  let lexiconHash;
  if (entries.some((entry) => entry.endsWith('.json'))) {
    try { lexiconHash = createHash('sha256').update(await readFile(join(inputs.root, 'narration/lexicon.json'))).digest('hex'); }
    catch (error) {
      if (error.code === 'ENOENT') c.missing('narration/lexicon.json', 'missing lexicon; cue hash cannot be checked');
      else c.fail('narration/lexicon.json', error.message);
    }
  }
  for (const entry of entries) {
    if (!entry.endsWith('.json')) continue;
    const path = `${directory}/${entry}`;
    if (!/^ch(?:0\d|1[0-3])\.json$/.test(entry)) c.fail(path, 'expected cue filename ch00.json–ch13.json');
    let cues;
    try { cues = JSON.parse(await readFile(join(inputs.root, path), 'utf8')); }
    catch (error) { c.fail(path, error.message); continue; }
    if (!c.shape(cues, path, ['chapter', 'audio', 'captions', 'duration', 'sampleRate', 'voice', 'model', 'lexiconHash', 'scenes', 'sentences'])) continue;
    c.id(cues.chapter, `${path}.chapter`, 'cue chapter');
    c.oneOf(cues.chapter, `${path}.chapter`, EXPECTED_CHAPTER_IDS);
    if (`${cues.chapter}.json` !== entry) c.fail(`${path}.chapter`, 'must match cue filename');
    c.number(cues.duration, `${path}.duration`, 0, true);
    if (cues.sampleRate !== 24000) c.fail(`${path}.sampleRate`, 'expected 24000');
    if (cues.voice !== 'af_heart') c.fail(`${path}.voice`, 'expected af_heart');
    if (cues.model !== MODEL) c.fail(`${path}.model`, `expected ${MODEL}`);
    if (typeof cues.lexiconHash !== 'string' || !/^[a-f0-9]{64}$/i.test(cues.lexiconHash)) c.fail(`${path}.lexiconHash`, 'expected a SHA-256 hexadecimal digest');
    else if (lexiconHash && cues.lexiconHash.toLowerCase() !== lexiconHash) c.fail(`${path}.lexiconHash`, 'does not match current narration/lexicon.json bytes; resynthesize');
    for (const [field, prefix, extension] of [['audio', 'audio', 'mp3'], ['captions', 'captions', 'vtt']]) {
      const expected = `${prefix}/${cues.chapter}.${extension}`;
      if (cues[field] !== expected) c.fail(`${path}.${field}`, `expected ${JSON.stringify(expected)}`);
      else await existingFile(inputs.root, `public/${expected}`, c, `missing generated ${field}`);
    }
    const chapter = chapters.get(cues.chapter);
    if (!chapter) c.missing(path, `chapter ${cues.chapter} is not authored yet; cue IDs cannot be compared`);
    const expectedScenes = Array.isArray(chapter?.scenes) ? chapter.scenes.filter(object) : [];
    const expectedSentences = expectedScenes.flatMap((scene) => Array.isArray(scene.sentences) ? scene.sentences.filter(object).map((sentence) => ({ ...sentence, scene: scene.id })) : []);
    const sceneSpans = new Map();
    for (const [field, expected, category] of [['scenes', expectedScenes, 'cue scene'], ['sentences', expectedSentences, 'cue sentence']]) {
      const spans = c.array(cues[field], `${path}.${field}`, true);
      if (chapter && spans.length !== expected.length) c.fail(`${path}.${field}`, `expected ${expected.length} spans, received ${spans.length}`);
      let previousEnd = 0;
      spans.forEach((span, index) => {
        const p = `${path}.${field}[${index}]`;
        if (!c.shape(span, p, field === 'sentences' ? ['id', 'scene', 'start', 'end'] : ['id', 'start', 'end'])) return;
        c.id(span.id, `${p}.id`, category);
        if (chapter && span.id !== expected[index]?.id) c.fail(`${p}.id`, `expected ${JSON.stringify(expected[index]?.id)} in narration order`);
        const startValid = c.number(span.start, `${p}.start`);
        const endValid = c.number(span.end, `${p}.end`);
        if (startValid && endValid) {
          if (span.end <= span.start) c.fail(p, 'span end must be greater than start');
          if (span.start < previousEnd) c.fail(p, 'spans must be ordered and nonoverlapping');
          if (span.end > cues.duration) c.fail(`${p}.end`, 'exceeds chapter duration');
          previousEnd = span.end;
        }
        if (field === 'scenes') sceneSpans.set(span.id, span);
        else {
          c.text(span.scene, `${p}.scene`);
          if (chapter && span.scene !== expected[index]?.scene) c.fail(`${p}.scene`, `expected ${JSON.stringify(expected[index]?.scene)}`);
          const parent = sceneSpans.get(span.scene);
          if (!parent) c.fail(`${p}.scene`, 'does not identify a scene span');
          else if (span.start < parent.start || span.end > parent.end) c.fail(p, 'sentence span is outside its scene bounds');
        }
      });
      if (field === 'scenes' && spans.length) {
        if (spans[0]?.start !== 0) c.fail(`${path}.scenes[0].start`, 'first scene must start at zero');
        const lastEnd = spans.at(-1)?.end;
        if (typeof lastEnd === 'number' && Math.abs(lastEnd - cues.duration) > 1 / 24000) c.fail(`${path}.duration`, 'must match the final scene end within one sample');
      }
    }
  }
  for (const id of EXPECTED_CHAPTER_IDS) {
    if (!files.has(`${id}.json`)) {
      c.missing(`${directory}/${id}.json`, 'missing generated cues');
      await existingFile(inputs.root, `public/audio/${id}.mp3`, c, 'missing generated audio');
    }
  }
}

// Only syntax is inspected. Chapter code is never imported or executed in Node.
const FACTORY_VALUE = Symbol('unevaluated factory value');
class MissingExportError extends Error {}

async function inspectChapterExport(filename, cache) {
  if (cache.has(filename)) return cache.get(filename);
  const source = await readFile(filename, 'utf8');
  const ast = parseAst(source, { lang: 'ts' }, filename);
  const bindings = new Map();
  const imports = new Map();
  const exports = new Map();
  const starExports = [];
  let defaultNode;
  for (const statement of ast.body) {
    const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
    if (declaration?.type === 'VariableDeclaration') {
      for (const item of declaration.declarations) if (item.id.type === 'Identifier') {
        bindings.set(item.id.name, item.init);
        if (statement.type === 'ExportNamedDeclaration') exports.set(item.id.name, item.init);
      }
    }
    if (statement.type === 'ImportDeclaration' && statement.source.value.startsWith('.')) {
      for (const specifier of statement.specifiers) imports.set(specifier.local.name, { source: statement.source.value, name: specifier.type === 'ImportDefaultSpecifier' ? 'default' : specifier.type === 'ImportNamespaceSpecifier' ? '*' : specifier.imported?.name ?? specifier.imported?.value });
    }
    if (statement.type === 'ExportDefaultDeclaration') defaultNode = statement.declaration;
    if (statement.type === 'ExportNamedDeclaration') {
      for (const specifier of statement.specifiers ?? []) {
        const name = specifier.exported.name ?? specifier.exported.value;
        if (statement.source) imports.set(`export:${name}`, { source: statement.source.value, name: specifier.local.name ?? specifier.local.value });
        else exports.set(name, specifier.local);
      }
    }
    if (statement.type === 'ExportAllDeclaration') {
      if (statement.exported) imports.set(`export:${statement.exported.name ?? statement.exported.value}`, { source: statement.source.value, name: '*' });
      else starExports.push(statement.source.value);
    }
  }
  function unwrap(node) {
    while (node && ['TSAsExpression', 'TSSatisfiesExpression', 'TSTypeAssertion', 'TSNonNullExpression', 'ParenthesizedExpression'].includes(node.type)) node = node.expression;
    return node;
  }
  async function imported(binding, trail) {
    if (!binding.source.startsWith('.')) throw new Error(`cannot statically inspect nonlocal import ${binding.source}`);
    const target = resolve(dirname(filename), binding.source);
    const candidates = [target, ...(extname(target) === '.js' ? [target.slice(0, -3) + '.ts'] : []), `${target}.ts`, join(target, 'index.ts')];
    let found;
    for (const candidate of candidates) {
      try { if ((await stat(candidate)).isFile()) { found = candidate; break; } }
      catch (error) { if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error; }
    }
    if (!found) throw new Error(`cannot resolve ${binding.source} from ${filename}`);
    const module = await inspectChapterExport(found, cache);
    return module.exported(binding.name, trail);
  }
  async function evaluate(node, trail = new Set()) {
    node = unwrap(node);
    if (!node) throw new Error('missing statically inspectable export value');
    if (node.type === 'Literal') return node.value;
    if (node.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].value.cooked;
    if (node.type === 'Identifier') {
      const key = `${filename}:${node.name}`;
      if (trail.has(key)) throw new Error(`cyclic static binding ${node.name}`);
      const next = new Set([...trail, key]);
      if (bindings.has(node.name)) return evaluate(bindings.get(node.name), next);
      if (imports.has(node.name)) return imported(imports.get(node.name), next);
      throw new Error(`cannot statically resolve ${node.name}`);
    }
    if (node.type === 'ObjectExpression') {
      const result = new Map();
      const explicitKeys = new Set();
      for (const property of node.properties) {
        if (property.type === 'SpreadElement') {
          const spread = await evaluate(property.argument, trail);
          if (!(spread instanceof Map)) throw new Error('object spread must resolve to an object');
          for (const [key, value] of spread) result.set(key, value);
        } else {
          const key = property.computed ? await evaluate(property.key, trail) : property.key.name ?? property.key.value;
          if (typeof key !== 'string' && typeof key !== 'number') throw new Error('object key must be statically known');
          if (explicitKeys.has(String(key))) throw new Error(`duplicate exported object key ${JSON.stringify(String(key))}`);
          explicitKeys.add(String(key));
          result.set(String(key), { node: property.value, evaluate: () => evaluate(property.value, trail) });
        }
      }
      return result;
    }
    if (node.type === 'ArrayExpression') return Promise.all(node.elements.map((element) => evaluate(element, trail)));
    if (node.type === 'MemberExpression') {
      const receiver = await evaluate(node.object, trail);
      if (receiver === FACTORY_VALUE) return FACTORY_VALUE;
      const key = node.computed ? await evaluate(node.property, trail) : node.property.name;
      if (receiver instanceof Map && receiver.has(String(key))) return receiver.get(String(key)).evaluate();
    }
    if (node.type === 'CallExpression' || node.type === 'NewExpression') return FACTORY_VALUE;
    throw new Error(`cannot statically inspect ${node.type}; use a literal exported chapter id and scene map`);
  }
  const module = {
    async exported(name = 'default', trail = new Set()) {
      const key = `${filename}#export:${name}`;
      if (trail.has(key)) {
        if (name === '*') return new Map();
        throw new MissingExportError(`cyclic or unresolved export ${name} in ${filename}`);
      }
      const next = new Set([...trail, key]);
      if (name === '*') {
        const namespace = new Map();
        for (const source of starExports) {
          const inherited = await imported({ source, name: '*' }, next);
          for (const [exportName, value] of inherited) if (exportName !== 'default') namespace.set(exportName, value);
        }
        const names = new Set(exports.keys());
        if (defaultNode) names.add('default');
        for (const importName of imports.keys()) if (importName.startsWith('export:')) names.add(importName.slice(7));
        for (const exportName of names) namespace.set(exportName, { evaluate: () => module.exported(exportName, next) });
        return namespace;
      }
      if (name === 'default' && defaultNode) return evaluate(defaultNode, next);
      if (exports.has(name)) return evaluate(exports.get(name), next);
      if (imports.has(`export:${name}`)) return imported(imports.get(`export:${name}`), next);
      if (name !== 'default') {
        for (const source of starExports) {
          try { return await imported({ source, name }, next); }
          catch (error) { if (!(error instanceof MissingExportError)) throw error; }
        }
      }
      throw new MissingExportError(`missing ${name} export in ${filename}`);
    },
  };
  cache.set(filename, module);
  return module;
}

async function validateSceneModules(inputs, c) {
  const cache = new Map();
  const chapters = new Map(inputs.chapters.filter(({ data }) => object(data)).map(({ data }) => [data.id, data]));
  const exportedIds = new Set();
  for (const id of EXPECTED_CHAPTER_IDS) {
    const path = `src/chapters/${id}/index.ts`;
    try {
      const info = await stat(join(inputs.root, path));
      if (!info.isFile()) { c.fail(path, 'expected a chapter module file'); continue; }
    } catch (error) {
      if (error.code === 'ENOENT') c.missing(path, 'missing scene module');
      else c.fail(path, error.message);
      continue;
    }
    try {
      const module = await inspectChapterExport(join(inputs.root, path), cache);
      const chapter = await module.exported();
      if (!(chapter instanceof Map)) throw new Error('default export must resolve to a ChapterModule object');
      if (!chapter.has('id') || await chapter.get('id').evaluate() !== id) c.fail(path, `exported chapter id must be ${id}`);
      if (!chapter.has('scenes')) throw new Error('default export has no scenes map');
      const scenes = await chapter.get('scenes').evaluate();
      if (!(scenes instanceof Map)) throw new Error('exported scenes must resolve to a scene map');
      const expected = new Set(Array.isArray(chapters.get(id)?.scenes) ? chapters.get(id).scenes.filter(object).map((scene) => scene.id) : []);
      for (const [sceneId, value] of scenes) {
        if (exportedIds.has(sceneId)) c.fail(path, `duplicate exported scene ID ${sceneId}`);
        exportedIds.add(sceneId);
        if (chapters.has(id) && !expected.has(sceneId)) c.fail(path, `exported scene ${sceneId} does not exist in narration`);
        // Factories are permitted as scene values; literal objects additionally expose their id for consistency checks.
        const scene = await value.evaluate();
        if (scene !== FACTORY_VALUE) {
          if (!(scene instanceof Map) || !scene.has('id')) throw new Error(`scene ${sceneId} must expose an id`);
          if (await scene.get('id').evaluate() !== sceneId) c.fail(path, `scene map key ${sceneId} disagrees with SceneModule.id`);
          if (!scene.has('mount') || !scene.has('render')) c.fail(path, `scene ${sceneId} must expose mount and render`);
        }
      }
      for (const sceneId of expected) if (!scenes.has(sceneId)) c.missing(path, `missing exported scene module ${sceneId}`);
    } catch (error) { c.fail(path, `scene module inspection failed: ${error.message}`); }
  }
}

export async function validate(options = {}) {
  const inputs = await loadInputs(options);
  const collected = collectEvidence(inputs);
  const errors = [...inputs.errors, ...collected.errors];
  const warnings = [...inputs.warnings];
  const budgets = [];
  const c = createChecks(errors, warnings, options.strict ?? false);
  for (const chapter of inputs.chapters) validateChapter(chapter.data, chapter.path, c, budgets);
  validateAtlas(inputs.atlas, inputs.chapters, c);
  await validateCues(inputs, c);
  await validateSceneModules(inputs, c);
  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)], budgets, chapters: inputs.chapters.length, features: Array.isArray(inputs.atlas?.data) ? inputs.atlas.data.length : 0 };
}

async function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter((arg) => arg !== '--strict');
  if (unknown.length) {
    for (const arg of unknown) console.error(`Error: unknown argument ${JSON.stringify(arg)}`);
    console.error('Usage: node scripts/validate.mjs [--strict]');
    process.exitCode = 1;
    return;
  }
  const result = await validate({ strict: args.includes('--strict') });
  for (const budget of result.budgets) console.log(`${budget.chapter}: ${budget.words} words / ${budget.target} target (${budget.min}–${budget.max}; ${budget.withinBudget ? 'within budget' : 'outside budget, report only'})`);
  for (const warning of result.warnings) console.warn(`Warning: ${warning}`);
  for (const error of result.errors) console.error(`Error: ${error}`);
  console.log(`Validated ${result.chapters} chapters and ${result.features} atlas features: ${result.errors.length} error(s), ${result.warnings.length} warning(s).`);
  if (result.errors.length) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  });
}
