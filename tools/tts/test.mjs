import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';
import webvtt from 'node-webvtt';
import { applyLexicon, validateChapter } from './synthesize.mjs';

const execFileAsync = promisify(execFile);
const directory = path.dirname(fileURLToPath(import.meta.url));
const cli = path.join(directory, 'synthesize.mjs');
const fixturePath = path.join(directory, 'fixtures/ch00-regression.json');
const warmCache = path.join(directory, '.cache');
const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
const sampleRate = 24000;
const outputs = {
  audio: 'public/audio/ch00.mp3',
  captions: 'public/captions/ch00.vtt',
  cues: 'src/generated/cues/ch00.json',
  manifest: 'narration/manifest.json',
};

async function runCli(input, output, extra = [], cache = warmCache) {
  return execFileAsync(process.execPath, [
    cli, '--input', input, '--output', output, '--cache', cache, '--offline', ...extra,
  ], { cwd: directory, timeout: 600000, maxBuffer: 16 * 1024 * 1024 });
}

function checkRows(result) {
  return result.stdout.trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function captionDisplayText(text) {
  // node-webvtt parses timestamps but preserves escaped cue payloads; decode only one layer.
  const entities = { amp: '&', lt: '<', gt: '>' };
  return text.replace(/&(amp|lt|gt);/g, (_, name) => entities[name]);
}

async function filesUnder(root) {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const files = await Promise.all(entries.map(async (entry) => {
    const name = path.join(root, entry.name);
    return entry.isDirectory() ? filesUnder(name) : [name];
  }));
  return files.flat();
}

async function snapshot(root) {
  return Object.fromEntries(await Promise.all(Object.entries(outputs).map(async ([key, relative]) => [
    key, await readFile(path.join(root, relative)),
  ])));
}

function sameSample(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) * sampleRate <= 1.000001,
    `${label}: expected ${expected}s, received ${actual}s`);
}

async function assertDecodedSamples(root, cues) {
  const { stdout } = await execFileAsync('ffmpeg', [
    '-v', 'error', '-i', path.join(root, outputs.audio),
    '-map', '0:a:0', '-ac', '1', '-ar', String(sampleRate),
    '-f', 'f32le', '-c:a', 'pcm_f32le', 'pipe:1',
  ], { encoding: 'buffer', timeout: 60000, maxBuffer: 128 * 1024 * 1024 });
  assert.equal(stdout.length % 4, 0, 'decoded float32 PCM has complete samples');
  const samples = stdout.length / 4;
  assert.ok(samples > 0, 'inference produced audio');
  assert.ok(Math.abs(samples - cues.duration * sampleRate) <= 1.000001,
    `gapless decoded sample count ${samples} must match cue duration ${cues.duration}`);
  return samples;
}

function assertManifest(artifacts, cues, samples) {
  const manifest = JSON.parse(artifacts.manifest);
  const chapter = manifest.chapters.find((entry) => entry.id === 'ch00');
  assert.ok(chapter, 'manifest contains generated chapter');
  assert.equal(chapter.samples, Math.round(cues.duration * sampleRate));
  assert.ok(Math.abs(chapter.samples - samples) <= 1);
  sameSample(chapter.duration, cues.duration, 'manifest duration');
  for (const key of ['audio', 'captions', 'cues']) {
    assert.equal(chapter.sha256[key], createHash('sha256').update(artifacts[key]).digest('hex'),
      `manifest ${key} hash describes the written bytes`);
  }
  return chapter;
}

function oneSentenceChapter(text = 'Hello.') {
  const chapter = structuredClone(fixture);
  chapter.scenes = [chapter.scenes[0]];
  chapter.scenes[0].sentences = [{ id: '0.1.1', text, claims: [] }];
  return chapter;
}

async function writeJson(filename, value) {
  await writeFile(filename, `${JSON.stringify(value, null, 2)}\n`);
  return filename;
}

async function expectCliFailure(input, output, patterns, extra = [], cache = warmCache) {
  await assert.rejects(runCli(input, output, extra, cache), (error) => {
    assert.equal(typeof error.code, 'number', 'CLI exits with a failing status, not a spawn failure');
    assert.notEqual(error.code, 0);
    const diagnostic = `${error.stdout ?? ''}\n${error.stderr ?? ''}`;
    for (const pattern of patterns) assert.match(diagnostic, pattern);
    return true;
  });
}

test('lexicon uses whole terms, longest match first, and per-entry case sensitivity', () => {
  const lexicon = { version: 1, entries: [
    { term: 'omp', replacement: 'O-M-P' },
    { term: 'omp²', replacement: 'O-M-P squared' },
    { term: 'AGENTS.md', replacement: 'agents dot M D', caseSensitive: true },
    { term: 'arXiv', replacement: 'archive' },
  ] };
  assert.deepEqual(applyLexicon('omp² omp OMP stomp ompaloompa', lexicon), {
    text: 'O-M-P squared O-M-P O-M-P stomp ompaloompa', overrides: [],
  });
  assert.equal(applyLexicon('AGENTS.md agents.md ARXIV arXiv DAP Hermes Kokoro', lexicon).text,
    'agents dot M D agents.md archive archive DAP Hermes Kokoro');
  assert.equal(applyLexicon('(omp), omp! preomp ompish', lexicon).text,
    '(O-M-P), O-M-P! preomp ompish');
  assert.equal(applyLexicon("omp's omp’s", lexicon).text, "O-M-P's O-M-P’s");
});

test('chapter validation rejects invalid sentence input with its identity', () => {
  validateChapter(fixture);
  const chapter = oneSentenceChapter('');
  assert.throws(() => validateChapter(chapter), /0\.1\.1/);
});

test('real offline CLI synthesis and regression contracts', { timeout: 1800000 }, async (t) => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'omp-tts-regression-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const output = path.join(temporary, 'first');
  let first;
  let cues;

  const pacingOptions = ['--speed', '1.10', '--pause-after', '0.22', '--hold-after', '0.60'];
  let paced;
  await t.test('--check applies the lexicon without writing output', async () => {
    const checkOutput = path.join(temporary, 'check');
    const rows = checkRows(await runCli(fixturePath, checkOutput, ['--check']));
    assert.deepEqual(rows.map((row) => row.sentence), ['0.1.1', '0.1.2', '0.2.1']);
    assert.deepEqual(rows.map((row) => row.text), [
      'O-M-P.', 'O-M-P squared reads agents dot M D.', 'tau squared bench and archive.',
    ]);
    for (const row of rows) {
      assert.ok(Number.isInteger(row.tokens) && row.tokens > 0 && row.tokens <= 512);
      assert.equal(typeof row.phonemes, 'string');
      assert.ok(row.phonemes.length > 0);
    }
    assert.deepEqual(await filesUnder(checkOutput), [], '--check creates no output files');
  });

  await t.test('synthesizes the fixture with cached model assets and exact timing', async () => {
    const result = await runCli(fixturePath, output);
    t.diagnostic(result.stdout.trim());
    first = await snapshot(output);
    cues = JSON.parse(first.cues);
    assert.equal(cues.chapter, 'ch00');
    assert.equal(cues.audio, 'audio/ch00.mp3');
    assert.equal(cues.captions, 'captions/ch00.vtt');
    assert.equal(cues.sampleRate, sampleRate);
    assert.equal(cues.voice, 'af_heart');
    assert.equal(typeof cues.model, 'string');
    assert.ok(cues.model.length > 0);
    assert.match(cues.lexiconHash, /^[a-f0-9]{64}$/);
    assert.deepEqual(cues.scenes.map((scene) => scene.id), ['0.1', '0.2']);
    assert.deepEqual(cues.sentences.map((sentence) => sentence.id), ['0.1.1', '0.1.2', '0.2.1']);
    sameSample(cues.scenes[0].start, 0, 'first scene begins at zero');
    let index = 0;
    for (const [sceneIndex, sourceScene] of fixture.scenes.entries()) {
      const scene = cues.scenes[sceneIndex];
      sameSample(cues.sentences[index].start, scene.start, `${scene.id} first sentence starts with scene`);
      for (const [sentenceIndex, sourceSentence] of sourceScene.sentences.entries()) {
        const sentence = cues.sentences[index];
        assert.equal(sentence.scene, scene.id);
        assert.ok(sentence.start >= scene.start && sentence.end <= scene.end);
        assert.ok(sentence.end > sentence.start);
        for (const edge of ['start', 'end']) {
          const samples = sentence[edge] * sampleRate;
          assert.ok(Math.abs(samples - Math.round(samples)) < 0.000001,
            `${sentence.id} ${edge} lies on the sample grid`);
        }
        const pause = sourceSentence.pauseAfter ?? 0.30;
        if (sentenceIndex + 1 < sourceScene.sentences.length) {
          sameSample(cues.sentences[index + 1].start - sentence.end, pause, `${sentence.id} pause`);
        } else {
          sameSample(scene.end - sentence.end, pause + (sourceScene.holdAfter ?? 0.80),
            `${scene.id} trailing pause and hold`);
        }
        index += 1;
      }
      if (sceneIndex > 0) sameSample(scene.start, cues.scenes[sceneIndex - 1].end, 'contiguous scenes');
    }
    sameSample(cues.duration, cues.scenes.at(-1).end, 'chapter includes final hold');
    const parsed = webvtt.parse(first.captions.toString('utf8'), { strict: true });
    assert.equal(parsed.valid, true);
    const sourceSentences = fixture.scenes.flatMap((scene) => scene.sentences);
    assert.equal(parsed.cues.length, sourceSentences.length);
    for (const [cueIndex, cue] of parsed.cues.entries()) {
      assert.equal(captionDisplayText(cue.text), sourceSentences[cueIndex].text,
        'captions retain original display text');
      assert.ok(Math.abs(cue.start - cues.sentences[cueIndex].start) <= 0.001 + 1 / sampleRate);
      assert.ok(Math.abs(cue.end - cues.sentences[cueIndex].end) <= 0.001 + 1 / sampleRate);
    }
    const samples = await assertDecodedSamples(output, cues);
    assertManifest(first, cues, samples);
    const manifest = JSON.parse(first.manifest);
    assert.equal(manifest.provenance.speed, 1);
    assert.deepEqual(manifest.provenance.defaults, { pauseAfter: 0.30, holdAfter: 0.80 });
    assert.deepEqual(manifest.chapters[0].provenance, manifest.provenance);
  });

  await t.test('offline cached rerun preserves every output byte', async () => {
    assert.ok(first, 'initial synthesis must have succeeded');
    const cachedOutput = path.join(temporary, 'cached');
    await runCli(fixturePath, cachedOutput);
    const cached = await snapshot(cachedOutput);
    for (const key of Object.keys(outputs)) assert.deepEqual(cached[key], first[key], `${key} cached identity`);
  });

  await t.test('--force offline re-inference preserves every output byte', async () => {
    assert.ok(first, 'initial synthesis must have succeeded');
    const forcedOutput = path.join(temporary, 'forced');
    const result = await runCli(fixturePath, forcedOutput, ['--force']);
    t.diagnostic(result.stdout.trim());
    const forced = await snapshot(forcedOutput);
    for (const key of Object.keys(outputs)) assert.deepEqual(forced[key], first[key], `${key} force identity`);
  });

  await t.test('pacing options change speech duration and default silence without replacing explicit timings', async () => {
    assert.ok(first, 'initial synthesis must have succeeded');
    const pacedOutput = path.join(temporary, 'paced');
    await runCli(fixturePath, pacedOutput, pacingOptions);
    paced = await snapshot(pacedOutput);
    const pacedCues = JSON.parse(paced.cues);
    const manifest = JSON.parse(paced.manifest);
    assert.equal(manifest.provenance.speed, 1.10);
    assert.deepEqual(manifest.provenance.defaults, { pauseAfter: 0.22, holdAfter: 0.60 });
    const samples = await assertDecodedSamples(pacedOutput, pacedCues);
    const chapter = assertManifest(paced, pacedCues, samples);
    assert.deepEqual(chapter.provenance, manifest.provenance);
    const baseline = JSON.parse(first.manifest).chapters.find((entry) => entry.id === 'ch00');
    const baselineSpeechSamples = baseline.sentences.reduce((total, sentence) => total + sentence.samples, 0);
    const speechSamples = chapter.sentences.reduce((total, sentence) => total + sentence.samples, 0);
    assert.ok(speechSamples < baselineSpeechSamples,
      'speed 1.10 shortens model-produced speech PCM independently of silence');
    assert.notDeepEqual(paced.audio, first.audio, 'pacing changes the generated audio');
    assert.deepEqual(chapter.sentences.map((sentence) => sentence.id), cues.sentences.map((sentence) => sentence.id));
    assert.deepEqual(chapter.sentences.map((sentence) => sentence.pauseSamples), [5280, 3000, 5280],
      'default pauses use 0.22 seconds and the explicit 0.125-second pause is retained');
    for (const [index, sentence] of chapter.sentences.entries()) {
      const cue = pacedCues.sentences[index];
      assert.equal(Math.round((cue.end - cue.start) * sampleRate), sentence.samples,
        `${sentence.id} cue span matches speech PCM samples`);
      assert.notEqual(sentence.cacheKey, baseline.sentences[index].cacheKey,
        `${sentence.id} pacing settings invalidate the default sentence cache key`);
    }
    sameSample(pacedCues.sentences[1].start - pacedCues.sentences[0].end, 0.22,
      'default sentence pause follows --pause-after');
    sameSample(pacedCues.scenes[0].end - pacedCues.sentences[1].end, 0.125 + 0.25,
      'explicit sentence pause and scene hold remain unchanged');
    sameSample(pacedCues.scenes[1].end - pacedCues.sentences[2].end, 0.22 + 0.60,
      'default trailing pause and hold follow the pacing options');
    sameSample(pacedCues.scenes[0].start, 0, 'paced chapter starts at zero');
    sameSample(pacedCues.scenes[1].start, pacedCues.scenes[0].end, 'paced scenes remain contiguous');
    sameSample(pacedCues.sentences[2].start, pacedCues.scenes[1].start, 'paced second scene starts with speech');
    sameSample(pacedCues.duration, pacedCues.scenes[1].end, 'paced duration includes final hold');
    const silenceSamples = 5280 + 3000 + 5280 + 6000 + 14400;
    assert.equal(chapter.samples, speechSamples + silenceSamples,
      'manifest includes the exact explicit and default silence samples');
    assert.equal(samples, speechSamples + silenceSamples,
      'gapless MP3 decodes to the exact speech and silence sample count');
    assert.equal(Math.round(pacedCues.duration * sampleRate), samples);
  });

  await t.test('warm cache preserves every artifact with non-default pacing', async () => {
    assert.ok(paced, 'paced synthesis must have succeeded');
    const cachedOutput = path.join(temporary, 'paced-cached');
    const rows = checkRows(await runCli(fixturePath, cachedOutput, pacingOptions));
    assert.deepEqual(rows.map((row) => row.sentence), ['0.1.1', '0.1.2', '0.2.1']);
    for (const row of rows) assert.equal(row.cache, 'hit', `${row.sentence} reuses paced PCM`);
    const cached = await snapshot(cachedOutput);
    for (const key of Object.keys(outputs)) assert.deepEqual(cached[key], paced[key], `${key} paced cache identity`);
  });

  await t.test('invalid pacing options fail before writing output', async (t) => {
    const invalidValues = {
      '--speed': ['0', '-1', 'NaN', 'Infinity', '', ' '],
      '--pause-after': ['-0.01', '60.01', 'NaN', 'Infinity', '', ' '],
      '--hold-after': ['-0.01', '60.01', 'NaN', 'Infinity', '', ' '],
    };
    for (const [option, values] of Object.entries(invalidValues)) {
      for (const [index, value] of values.entries()) {
        await t.test(`${option} rejects ${JSON.stringify(value)}`, async () => {
          const invalidOutput = path.join(temporary, `invalid-${option.slice(2)}-${index}`);
          await expectCliFailure(fixturePath, invalidOutput, [new RegExp(option.slice(2))],
            [`${option}=${value}`]);
          assert.deepEqual(await filesUnder(invalidOutput), [], 'invalid pacing creates no output artifacts');
        });
      }
    }
  });

  await t.test('invalid sentence and overlong token input fail with sentence IDs', async () => {
    const invalid = await writeJson(path.join(temporary, 'invalid.json'), oneSentenceChapter(''));
    await expectCliFailure(invalid, path.join(temporary, 'invalid-output'), [/0\.1\.1/, /text|sentence|empty/i]);
    const overlong = await writeJson(path.join(temporary, 'overlong.json'), oneSentenceChapter('hello '.repeat(600)));
    await expectCliFailure(overlong, path.join(temporary, 'overlong-output'), [/0\.1\.1/, /512/, /token/i], ['--check']);
  });

  await t.test('fixture synthesis requires an explicit output root and leaves production unchanged', async () => {
    const productionRoot = path.resolve(directory, '../..');
    const productionSnapshot = async () => Promise.all(Object.values(outputs).map(async (relative) => {
      try {
        return await readFile(path.join(productionRoot, relative));
      } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error;
      }
    }));
    const before = await productionSnapshot();
    await assert.rejects(execFileAsync(process.execPath, [
      cli, '--input', fixturePath, '--cache', warmCache, '--offline',
    ], { cwd: temporary, timeout: 60000, maxBuffer: 1024 * 1024 }), (error) => {
      assert.equal(typeof error.code, 'number');
      assert.notEqual(error.code, 0);
      assert.match(`${error.stdout ?? ''}\n${error.stderr ?? ''}`, /--output/);
      return true;
    });
    assert.deepEqual(await productionSnapshot(), before, 'fixture guard does not alter production artifacts');
  });

  await t.test('an empty offline cache fails clearly instead of fetching', async () => {
    const coldCache = path.join(temporary, 'cold-cache');
    await mkdir(coldCache);
    await expectCliFailure(fixturePath, path.join(temporary, 'cold-output'), [/offline/i, /cache|local|download|missing/i], [], coldCache);
  });

  await t.test('a phoneme override changes real tokenizer input and generates audio', async () => {
    const alternate = await writeJson(path.join(temporary, 'alternate.json'), oneSentenceChapter());
    const emptyLexicon = await writeJson(path.join(temporary, 'empty-lexicon.json'), { version: 1, entries: [] });
    const baseline = checkRows(await runCli(alternate, path.join(temporary, 'baseline-check'), [
      '--check', '--lexicon', emptyLexicon,
    ]))[0];
    const baselineOutput = path.join(temporary, 'baseline-output');
    await runCli(alternate, baselineOutput, ['--lexicon', emptyLexicon, '--force']);
    const baselineArtifacts = await snapshot(baselineOutput);
    // Derive valid symbols from this exact tokenizer rather than pinning an eSpeak accent/version.
    const replacement = `${baseline.phonemes} ${baseline.phonemes}`;
    const overrideLexicon = await writeJson(path.join(temporary, 'override-lexicon.json'), {
      version: 1, entries: [{ term: 'Hello', matchPhonemes: baseline.phonemes, phonemes: replacement }],
    });
    const checkedOutput = path.join(temporary, 'override-check');
    const changed = checkRows(await runCli(alternate, checkedOutput, ['--check', '--lexicon', overrideLexicon]))[0];
    assert.equal(changed.text, 'Hello.', 'phoneme override leaves display/spoken text unchanged');
    assert.equal(changed.phonemes, replacement);
    assert.ok(changed.tokens > baseline.tokens, 'replacement passes through the real tokenizer');
    assert.deepEqual(await filesUnder(checkedOutput), []);
    const alternateOutput = path.join(temporary, 'override-output');
    await runCli(alternate, alternateOutput, ['--lexicon', overrideLexicon, '--force']);
    const artifacts = await snapshot(alternateOutput);
    assert.notDeepEqual(artifacts.audio, baselineArtifacts.audio,
      'phoneme override changes generated audio relative to the no-override run');
    const alternateCues = JSON.parse(artifacts.cues);
    assert.equal(alternateCues.sentences.length, 1);
    assert.notEqual(alternateCues.lexiconHash, cues?.lexiconHash);
    const samples = await assertDecodedSamples(alternateOutput, alternateCues);
    assertManifest(artifacts, alternateCues, samples);
    assert.equal(webvtt.parse(artifacts.captions.toString('utf8'), { strict: true }).cues[0].text, 'Hello.');
    const absentMatch = await writeJson(path.join(temporary, 'absent-phonemes.json'), {
      version: 1, entries: [{ term: 'Hello', matchPhonemes: 'THIS_SUBSTRING_CANNOT_BE_IN_ESPEAK_OUTPUT', phonemes: baseline.phonemes }],
    });
    await expectCliFailure(alternate, path.join(temporary, 'absent-output'), [/0\.1\.1/, /phoneme|match/i],
      ['--check', '--lexicon', absentMatch]);
  });
});
