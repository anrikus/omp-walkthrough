import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, open, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const REVISION = '1939ad2a8e416c0acfeecc08a694d14ef25f2231';
const RATE = 24000;
const VOICE = 'af_heart';
const DEFAULT_SETTINGS = { speed: 1, pauseAfter: 0.30, holdAfter: 0.80 };
const hash = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const termChar = /[\p{L}\p{N}\p{M}_]/u;

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateChapter(chapter) {
  requireValue(chapter && /^ch\d{2}$/.test(chapter.id), 'Chapter id must be chNN');
  for (const field of ['slug', 'title', 'act', 'takeaway']) {
    requireValue(typeof chapter[field] === 'string' && chapter[field].trim(), `${chapter.id}: missing ${field}`);
  }
  requireValue(Number.isFinite(chapter.targetSeconds) && chapter.targetSeconds > 0, `${chapter.id}: invalid targetSeconds`);
  requireValue(Array.isArray(chapter.scenes) && chapter.scenes.length, `${chapter.id}: scenes must not be empty`);
  const ids = new Set();
  const chapterNumber = String(Number(chapter.id.slice(2)));
  const stringArray = value => Array.isArray(value) && value.every(item => typeof item === 'string' && item.trim());
  const silence = (value, id) => requireValue(value === undefined || (Number.isFinite(value) && value >= 0 && value <= 60), `${id}: silence must be between 0 and 60 seconds`);
  for (const scene of chapter.scenes) {
    requireValue(typeof scene.id === 'string' && new RegExp(`^${chapterNumber}\\.\\d+$`).test(scene.id) && !ids.has(scene.id), `${chapter.id}: invalid or duplicate scene id ${scene.id}`);
    ids.add(scene.id);
    for (const field of ['title', 'visual']) requireValue(typeof scene[field] === 'string' && scene[field].trim(), `${scene.id}: missing ${field}`);
    requireValue(Array.isArray(scene.onScreen), `${scene.id}: onScreen must be an array`);
    requireValue(Array.isArray(scene.sentences) && scene.sentences.length, `${scene.id}: sentences must not be empty`);
    silence(scene.holdAfter, scene.id);
    for (const sentence of scene.sentences) {
      requireValue(typeof sentence.id === 'string' && new RegExp(`^${escapeRegex(scene.id)}\\.\\d+$`).test(sentence.id) && !ids.has(sentence.id), `${scene.id}: invalid or duplicate sentence id ${sentence.id}`);
      ids.add(sentence.id);
      requireValue(typeof sentence.text === 'string' && sentence.text.trim() && !/[\r\n\u0000]/u.test(sentence.text), `${sentence.id}: text must be a nonempty single line`);
      requireValue(sentence.spoken === undefined || (typeof sentence.spoken === 'string' && sentence.spoken.trim() && !/[\r\n\u0000]/u.test(sentence.spoken)), `${sentence.id}: spoken must be a nonempty single line`);
      requireValue(stringArray(sentence.claims), `${sentence.id}: claims must be a string array`);
      requireValue(sentence.sources === undefined || stringArray(sentence.sources), `${sentence.id}: sources must be a string array`);
      silence(sentence.pauseAfter, sentence.id);
    }
  }
  return chapter;
}

function validateLexicon(lexicon) {
  requireValue(lexicon?.version === 1 && Array.isArray(lexicon.entries), 'Lexicon requires version 1 and entries');
  const terms = new Set();
  for (const entry of lexicon.entries) {
    requireValue(typeof entry.term === 'string' && entry.term.trim() && !terms.has(entry.term), 'Lexicon terms must be nonempty and unique');
    terms.add(entry.term);
    requireValue(entry.caseSensitive === undefined || typeof entry.caseSensitive === 'boolean', `${entry.term}: invalid caseSensitive`);
    const replacement = typeof entry.replacement === 'string' && entry.replacement.trim();
    const phonemes = typeof entry.phonemes === 'string' && entry.phonemes.trim() && typeof entry.matchPhonemes === 'string' && entry.matchPhonemes.trim();
    requireValue(Boolean(replacement) !== Boolean(phonemes), `${entry.term}: choose replacement OR phonemes plus matchPhonemes`);
  }
  return lexicon;
}

export function applyLexicon(text, lexicon) {
  validateLexicon(lexicon);
  const entries = [...lexicon.entries].sort((a, b) => b.term.length - a.term.length);
  const overrides = [];
  let result = '';
  for (let offset = 0; offset < text.length;) {
    const previous = [...text.slice(0, offset)].at(-1);
    const entry = entries.find(candidate => {
      const slice = text.slice(offset, offset + candidate.term.length);
      const matches = candidate.caseSensitive === true ? slice === candidate.term : slice.toLowerCase() === candidate.term.toLowerCase();
      const next = String.fromCodePoint(text.codePointAt(offset + candidate.term.length) ?? 32);
      return matches && !(previous && termChar.test(previous)) && !termChar.test(next);
    });
    if (!entry) {
      const character = String.fromCodePoint(text.codePointAt(offset));
      result += character;
      offset += character.length;
      continue;
    }
    result += entry.replacement ?? text.slice(offset, offset + entry.term.length);
    if (entry.phonemes) {
      const existing = overrides.find(item => item.term === entry.term);
      if (existing) existing.count++;
      else overrides.push({ ...entry, count: 1 });
    }
    offset += entry.term.length;
  }
  return { text: result, overrides };
}

export async function provenance(lexiconBytes, settings = {}) {
  const { speed, pauseAfter, holdAfter } = { ...DEFAULT_SETTINGS, ...settings };
  const packages = {};
  for (const name of ['kokoro-js', '@huggingface/transformers', 'phonemizer', 'onnxruntime-node']) {
    packages[name] = JSON.parse(await readFile(path.join(here, 'node_modules', name, 'package.json'), 'utf8')).version;
  }
  return {
    pipeline: 1,
    model: MODEL,
    revision: REVISION,
    dtype: 'q8',
    device: 'cpu',
    voice: VOICE,
    speed,
    defaults: { pauseAfter, holdAfter },
    sampleRate: RATE,
    session: { intraOpNumThreads: 4, interOpNumThreads: 1 },
    packages,
    runtime: { node: process.version, platform: process.platform, arch: process.arch, cpu: os.cpus()[0].model },
    lockfileHash: hash(await readFile(path.join(here, 'package-lock.json'))),
    pipelineHash: hash(await readFile(fileURLToPath(import.meta.url))),
    lexiconHash: hash(lexiconBytes),
    encoding: { codec: 'libmp3lame', bitrate: '96k', channels: 1, sampleRate: RATE, ffmpeg: execFileSync('ffmpeg', ['-version'], { encoding: 'utf8' }).split('\n')[0] },
    timing: 'Exact float32 PCM sample counts; sentence spans contain generated speech, scene spans additionally contain sentence pauses and scene holds. WebVTT rounds to milliseconds. MP3 gapless decoding removes encoder padding; container duration can include that padding.'
  };
}

async function optionalRead(file) {
  try { return await readFile(file); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function atomicWrite(file, bytes) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  try { await writeFile(temporary, bytes); await rename(temporary, file); }
  finally { await rm(temporary, { force: true }); }
}

function vttTime(seconds) {
  const milliseconds = Math.round(seconds * 1000);
  return `${String(Math.floor(milliseconds / 3600000)).padStart(2, '0')}:${String(Math.floor(milliseconds / 60000) % 60).padStart(2, '0')}:${String(Math.floor(milliseconds / 1000) % 60).padStart(2, '0')}.${String(milliseconds % 1000).padStart(3, '0')}`;
}
const captionText = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

async function run(options) {
  const settings = { ...DEFAULT_SETTINGS };
  for (const [flag, key] of [['speed', 'speed'], ['pause-after', 'pauseAfter'], ['hold-after', 'holdAfter']]) {
    if (options[flag] === undefined) continue;
    const value = Number(options[flag]);
    const valid = options[flag].trim() !== '' && Number.isFinite(value)
      && (key === 'speed' ? value > 0 : value >= 0 && value <= 60);
    requireValue(valid, `--${flag} must be ${key === 'speed' ? 'a finite number greater than 0' : 'a finite number between 0 and 60 seconds'}`);
    settings[key] = value;
  }
  const invocation = process.env.INIT_CWD ?? process.cwd();
  const resolveOption = value => path.resolve(invocation, value);
  const output = resolveOption(options.output ?? root);
  const cache = resolveOption(options.cache ?? path.join(here, '.cache'));
  const input = options.input ? resolveOption(options.input) : null;
  requireValue(!input || options.check || options.output || path.dirname(input) === path.join(root, 'narration'), '--output is required for inputs outside narration/ to protect production chapters');
  const lexiconBytes = await readFile(resolveOption(options.lexicon ?? path.join(root, 'narration/lexicon.json')));
  const lexicon = validateLexicon(JSON.parse(lexiconBytes));
  requireValue(!options.chapter || /^ch\d{2}$/.test(options.chapter), '--chapter must be chNN');
  const files = input ? [input] : (await readdir(path.join(root, 'narration')))
    .filter(name => /^ch\d{2}-.+\.json$/.test(name) && (!options.chapter || name.startsWith(options.chapter + '-')))
    .sort().map(name => path.join(root, 'narration', name));
  requireValue(files.length, `No narration files found${options.chapter ? ` for ${options.chapter}` : ''}`);
  const chapters = [];
  for (const file of files) {
    const bytes = await readFile(file);
    const chapter = validateChapter(JSON.parse(bytes));
    requireValue(!chapters.some(item => item.chapter.id === chapter.id), `Duplicate chapter ${chapter.id}`);
    requireValue(!options.chapter || chapter.id === options.chapter, `${file}: chapter does not match --chapter`);
    chapters.push({ chapter, narrationHash: hash(bytes) });
  }
  const { KokoroTTS } = await import('kokoro-js');
  const { AutoTokenizer, StyleTextToSpeech2Model, env } = await import('@huggingface/transformers');
  env.cacheDir = cache;
  env.allowRemoteModels = !options.offline;
  const fetch = globalThis.fetch;
  if (options.offline) globalThis.fetch = async resource => { throw new Error(`Offline mode forbids network fetch: ${resource}`); };
  let model;
  try {
    let tokenizer;
    try { tokenizer = await AutoTokenizer.from_pretrained(MODEL, { revision: REVISION, local_files_only: Boolean(options.offline) }); }
    catch (error) { throw new Error(`${options.offline ? 'Offline cache is cold or incomplete' : 'Tokenizer load failed'} at ${cache}: ${error.message}`, { cause: error }); }

    // Kokoro does not export its contextual phonemizer. This frontend reuses generate's
    // normalization but stops at token IDs: no dummy model, synthesis or truncation.
    class TokenizingKokoro extends KokoroTTS {
      async generate_from_ids(ids) { return ids; }
    }
    async function prepare(sentence) {
      const applied = applyLexicon(sentence.spoken ?? sentence.text, lexicon);
      let phonemes;
      const frontend = new TokenizingKokoro(undefined, normalized => {
        phonemes = normalized;
        for (const override of applied.overrides) {
          for (const character of override.phonemes) requireValue(tokenizer.model.tokens_to_ids.has(character), `${sentence.id}: unsupported override phoneme ${JSON.stringify(character)}`);
          const matches = phonemes.split(override.matchPhonemes).length - 1;
          requireValue(matches === override.count, `${sentence.id}: phoneme override for ${override.term} expected ${override.count} exact matches, found ${matches} in normalized phonemes ${JSON.stringify(phonemes)}`);
          phonemes = phonemes.replaceAll(override.matchPhonemes, override.phonemes);
        }
        const result = tokenizer(phonemes, { truncation: false });
        requireValue(result.input_ids.dims.at(-1) <= 512, `${sentence.id}: ${result.input_ids.dims.at(-1)} tokens exceeds Kokoro's 512-token limit; split the sentence`);
        return result;
      });
      const ids = await frontend.generate(applied.text, { voice: VOICE, speed: settings.speed });
      return { text: applied.text, phonemes, tokens: ids.dims.at(-1), ids };
    }
    // Preflight every selected sentence before writing any chapter audio.
    for (const item of chapters) {
      item.prepared = new Map();
      for (const scene of item.chapter.scenes) for (const sentence of scene.sentences) {
        const prepared = await prepare(sentence);
        item.prepared.set(sentence.id, prepared);
        if (options.check) console.log(JSON.stringify({ sentence: sentence.id, text: prepared.text, tokens: prepared.tokens, phonemes: prepared.phonemes }));
      }
    }
    if (options.check) return;
    const source = await provenance(lexiconBytes, settings);
    const manifestPath = path.join(output, 'narration/manifest.json');
    const previous = await optionalRead(manifestPath);
    const manifest = previous ? JSON.parse(previous) : { schemaVersion: 1, provenance: source, chapters: [] };
    requireValue(manifest.schemaVersion === 1 && Array.isArray(manifest.chapters), `Invalid manifest ${manifestPath}`);
    manifest.provenance = source;
    const loadTts = async () => {
      if (!model) {
        try { model = await StyleTextToSpeech2Model.from_pretrained(MODEL, { revision: REVISION, dtype: 'q8', device: 'cpu', local_files_only: Boolean(options.offline), session_options: source.session }); }
        catch (error) { throw new Error(`${options.offline ? 'Offline model cache is cold or incomplete' : 'Model load failed'} at ${cache}: ${error.message}`, { cause: error }); }
      }
      return new KokoroTTS(model, tokenizer);
    };
    for (const { chapter, narrationHash, prepared } of chapters) {
      const temporary = await mkdtemp(path.join(os.tmpdir(), 'omp-tts-'));
      try {
        const pcmPath = path.join(temporary, 'chapter.f32le');
        const pcmFile = await open(pcmPath, 'w');
        const cues = { chapter: chapter.id, audio: `audio/${chapter.id}.mp3`, captions: `captions/${chapter.id}.vtt`, duration: 0, sampleRate: RATE, voice: VOICE, model: MODEL, lexiconHash: source.lexiconHash, scenes: [], sentences: [] };
        const measurements = [];
        let samples = 0;
        const silence = async seconds => {
          const count = Math.round(seconds * RATE);
          if (count) await pcmFile.writeFile(Buffer.alloc(count * 4));
          samples += count;
        };
        try {
          for (const scene of chapter.scenes) {
            const start = samples / RATE;
            for (const sentence of scene.sentences) {
              const input = prepared.get(sentence.id);
              const key = hash(JSON.stringify({ provenance: source, text: input.text, phonemes: input.phonemes }));
              const cachePcm = path.join(cache, 'sentences', key + '.f32le');
              const cacheMeta = path.join(cache, 'sentences', key + '.json');
              const metadataBytes = options.force ? null : await optionalRead(cacheMeta);
              let pcm;
              let elapsed = 0;
              if (metadataBytes) {
                const metadata = JSON.parse(metadataBytes);
                pcm = await readFile(cachePcm);
                requireValue(metadata.key === key && metadata.samples > 0 && pcm.length === metadata.samples * 4 && hash(pcm) === metadata.sha256, `${sentence.id}: corrupt sentence cache ${key}; use --force to regenerate`);
              } else {
                const tts = await loadTts();
                const started = performance.now();
                const generated = await tts.generate_from_ids(input.ids, { voice: VOICE, speed: settings.speed });
                elapsed = (performance.now() - started) / 1000;
                requireValue(generated.sampling_rate === RATE && generated.audio.length > 0 && generated.audio.every(Number.isFinite), `${sentence.id}: invalid generated PCM`);
                requireValue(os.endianness() === 'LE', 'PCM caching requires a little-endian runtime');
                pcm = Buffer.from(generated.audio.buffer, generated.audio.byteOffset, generated.audio.byteLength);
                await atomicWrite(cachePcm, pcm);
                await atomicWrite(cacheMeta, json({ key, samples: pcm.length / 4, sha256: hash(pcm) }));
              }
              const speechSamples = pcm.length / 4;
              const duration = speechSamples / RATE;
              console.log(JSON.stringify({ sentence: sentence.id, cache: metadataBytes ? 'hit' : 'miss', samples: speechSamples, seconds: duration, synthesisSeconds: metadataBytes ? 0 : elapsed, timesRealtime: metadataBytes ? null : duration / elapsed }));
              cues.sentences.push({ id: sentence.id, scene: scene.id, start: samples / RATE, end: (samples + speechSamples) / RATE });
              measurements.push({ id: sentence.id, samples: speechSamples, pauseSamples: Math.round((sentence.pauseAfter ?? settings.pauseAfter) * RATE), cacheKey: key, pcmSha256: hash(pcm) });
              await pcmFile.writeFile(pcm);
              samples += speechSamples;
              await silence(sentence.pauseAfter ?? settings.pauseAfter);
            }
            await silence(scene.holdAfter ?? settings.holdAfter);
            cues.scenes.push({ id: scene.id, start, end: samples / RATE });
          }
        } finally { await pcmFile.close(); }
        cues.duration = samples / RATE;
        const mp3Path = path.join(temporary, 'chapter.mp3');
        execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-f', 'f32le', '-ar', String(RATE), '-ac', '1', '-i', pcmPath, '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact', '-codec:a', 'libmp3lame', '-b:a', '96k', '-ar', String(RATE), '-ac', '1', mp3Path]);
        const display = new Map(chapter.scenes.flatMap(scene => scene.sentences.map(sentence => [sentence.id, sentence.text])));
        const vtt = 'WEBVTT\n\n' + cues.sentences.map(cue => `${cue.id}\n${vttTime(cue.start)} --> ${vttTime(cue.end)}\n${captionText(display.get(cue.id))}\n`).join('\n');
        const audio = await readFile(mp3Path);
        const cueBytes = json(cues);
        await atomicWrite(path.join(output, 'public', cues.audio), audio);
        await atomicWrite(path.join(output, 'public', cues.captions), vtt);
        await atomicWrite(path.join(output, 'src/generated/cues', chapter.id + '.json'), cueBytes);
        const record = { id: chapter.id, samples, duration: cues.duration, narrationHash, provenance: source, sha256: { audio: hash(audio), captions: hash(vtt), cues: hash(cueBytes) }, sentences: measurements };
        manifest.chapters = [...manifest.chapters.filter(item => item.id !== chapter.id), record].sort((a, b) => a.id.localeCompare(b.id));
        await atomicWrite(manifestPath, json(manifest));
      } finally { await rm(temporary, { recursive: true, force: true }); }
    }
  } finally {
    if (model) await model.dispose();
    globalThis.fetch = fetch;
  }
}

const help = `Offline Kokoro narration (24 kHz mono, af_heart, q8 CPU).
Usage: npm --prefix tools/tts run synth -- [options]
  --chapter chNN   Select one narration/chNN-*.json; default selects all.
  --offline        Forbid all fetches; requires installed packages and warm model cache.
  --check          Validate and print lexicon-applied text, phonemes and token counts;
                   loads only tokenizer, never synthesizes or writes output artifacts.
  --force          Regenerate sentences rather than reuse content-addressed PCM.
  --input FILE     Use a specific chapter JSON; inputs outside narration/ require --output.
  --output DIR     Output repository-layout artifacts under DIR (default: repository).
  --cache DIR      Override tools/tts/.cache (pinned model and sentence cache).
  --lexicon FILE   Override narration/lexicon.json for pronunciation experiments.
  --speed NUMBER   Speech speed, finite and greater than 0 (default: 1).
  --pause-after S  Default sentence pause, finite 0–60 seconds (default: 0.30).
  --hold-after S   Default scene hold, finite 0–60 seconds (default: 0.80).
  --help           Show this usage and reproducibility contract.
Explicit relative paths resolve from the original invocation directory (also via npm).
Install: npm --prefix tools/tts ci --registry=https://packagefeedproxy.microsoft.io/npm/
Requires ffmpeg with libmp3lame. First non-offline run warms the pinned model cache.
No paid APIs. Generated chapters are never automatically approved for publication.
Sentence spans cover model-produced audio, not forced-aligned word boundaries.
Explicit sentence pauseAfter and scene holdAfter override the respective CLI defaults.
Pauses and holds round to exact samples; speech speed is applied during synthesis.
MP3 uses gapless metadata; compare decoded samples, not padded container duration.
Manifest contains runtime/model/lexicon/input/output hashes, never wall-clock times.
Effective speed and pause/hold defaults are recorded in top-level and chapter provenance.
All three pacing settings participate in sentence cache keys; use --output for experiments.
Byte identity is scoped to pinned inputs and the same recorded machine/runtime.
Run the retained regression fixture: npm --prefix tools/tts test
`;

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { values } = parseArgs({ options: { chapter: { type: 'string' }, offline: { type: 'boolean' }, check: { type: 'boolean' }, force: { type: 'boolean' }, input: { type: 'string' }, output: { type: 'string' }, cache: { type: 'string' }, lexicon: { type: 'string' }, speed: { type: 'string' }, 'pause-after': { type: 'string' }, 'hold-after': { type: 'string' }, help: { type: 'boolean' } }, strict: true });
    if (values.help) console.log(help);
    else await run(values);
  } catch (error) {
    console.error(`TTS error: ${error.message}`);
    process.exitCode = 1;
  }
}
