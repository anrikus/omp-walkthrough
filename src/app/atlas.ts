import '../styles/atlas.css';
import { chapters, type AtlasFeature } from './data';
import { button, element, link } from './dom';
import { citationList, type References } from './evidence';

const atlasFiles = import.meta.glob<AtlasFeature[]>('../../atlas/features.json', { eager: true, import: 'default' });
const features = Object.values(atlasFiles).flat();

type Cite = (el: HTMLElement, refs: References) => void;

export function renderAtlas(root: HTMLElement, featureId: string | undefined, cite: Cite, reducedMotion: () => boolean): () => void {
  const selected = featureId ? features.find(feature => feature.id === featureId) : undefined;
  let cleanup = () => {};
  let disposed = false;
  root.append(element('h1', '', selected?.name ?? 'Feature Atlas'));
  if (featureId && !selected) {
    root.append(element('p', 'error-message', `No feature has the ID “${featureId}”.`), link('Browse the Feature Atlas', '#atlas'));
    return cleanup;
  }
  if (!selected) {
    root.append(element('p', 'page-intro', 'An unnarrated field guide to omp 18.8.6: purpose, invocation, shipped defaults, prerequisites and source documentation. Select a feature to inspect its evidence and available recreation.'));
    const label = element('label', 'atlas-search-label', 'Find a feature');
    label.htmlFor = 'atlas-search';
    const search = element('input', 'atlas-search');
    search.id = 'atlas-search';
    search.type = 'search';
    search.placeholder = 'Search by name, purpose or command';
    const count = element('p', 'atlas-count');
    count.setAttribute('role', 'status');
    const groups = element('div', 'atlas-groups');
    root.append(label, search, count, groups);
    const renderList = () => {
      const query = search.value.trim().toLocaleLowerCase();
      const matches = features.filter(feature => `${feature.name} ${feature.purpose} ${feature.howToInvoke} ${feature.group}`.toLocaleLowerCase().includes(query));
      count.textContent = `${matches.length} of ${features.length} features`;
      groups.replaceChildren();
      for (const groupName of new Set(matches.map(feature => feature.group))) {
        const group = element('section', 'atlas-group');
        group.append(element('h2', '', groupName));
        const list = element('ul', 'atlas-list');
        for (const feature of matches.filter(item => item.group === groupName)) {
          const item = element('li');
          const anchor = link(feature.name, `#atlas/${feature.id}`, 'atlas-feature-link');
          item.append(anchor, element('span', `default-state default-${feature.default}`, `Default: ${feature.default}`), element('p', '', feature.purpose));
          list.append(item);
        }
        group.append(list);
        groups.append(group);
      }
      if (!matches.length) groups.append(element('p', '', features.length ? 'No matching features. Try a tool name or a shorter phrase.' : 'The atlas has no entries in this build.'));
    };
    search.addEventListener('input', renderList);
    renderList();
  } else {
    root.append(link('All features', '#atlas', 'back-link'), element('p', 'feature-group', selected.group), element('p', 'page-intro', selected.purpose));
    const fields = element('dl', 'feature-fields');
    fields.append(element('dt', '', 'How to invoke'), element('dd', 'feature-invocation', selected.howToInvoke));
    fields.append(element('dt', '', `Default: ${selected.default}`), element('dd', '', selected.defaultDetail));
    if (selected.prerequisites) fields.append(element('dt', '', 'Prerequisites'), element('dd', '', selected.prerequisites));
    root.append(fields, citationList(selected, cite));
    if (selected.narratedIn) {
      const chapter = chapters.find(item => item.scenes.some(scene => scene.id === selected.narratedIn));
      if (chapter) root.append(link(`Watch scene ${selected.narratedIn}`, `#${chapter.id}/${selected.narratedIn}`, 'scene-backlink'));
    }
    if (selected.demo) {
      const demo = element('section', 'atlas-demo');
      demo.append(element('h2', '', 'Terminal recreation'));
      const loading = element('p', '', 'Loading the terminal recreation…');
      loading.setAttribute('role', 'status');
      demo.append(loading);
      root.append(demo);
      void import('../kit').then(({ createTerminal }) => {
        if (disposed || !selected.demo) return;
        loading.remove();
        const script = selected.demo;
        const terminal = createTerminal({ cols: script.cols, rows: script.rows, label: script.label });
        const viewport = element('div', 'atlas-terminal-viewport');
        viewport.append(terminal.el);
        let playing = false;
        let origin = 0;
        let demoTime = script.duration;
        let seeking = false;
        let frame = 0;
        const toggle = button('Play demo loop', () => {
          playing = !playing;
          if (playing) { origin = performance.now() - demoTime * 1000; frame = requestAnimationFrame(tick); }
          else cancelAnimationFrame(frame);
          toggle.textContent = playing ? 'Pause demo loop' : 'Play demo loop';
        }, 'secondary-button');
        const controls = element('div', 'atlas-demo-controls');
        const seekLabel = element('label', 'atlas-demo-seek-label', `Demo time for ${selected.name}`);
        const seek = element('input', 'atlas-demo-seek');
        seek.id = `demo-time-${selected.id}`;
        seekLabel.htmlFor = seek.id;
        seek.type = 'range';
        seek.min = '0';
        seek.max = String(script.duration);
        seek.step = '0.01';
        const time = element('output', 'atlas-demo-time');
        time.setAttribute('for', seek.id);
        time.setAttribute('aria-live', 'off');
        const renderTime = (t: number) => {
          demoTime = t;
          terminal.render(script, t);
          seek.value = String(t);
          time.value = `${t.toFixed(2)} / ${script.duration.toFixed(2)} seconds`;
          seek.setAttribute('aria-valuetext', `${t.toFixed(2)} of ${script.duration.toFixed(2)} seconds`);
        };
        seek.addEventListener('input', () => {
          renderTime(seek.valueAsNumber);
          origin = performance.now() - demoTime * 1000;
        });
        // Hold the clock during native pointer scrubbing without changing play state.
        seek.addEventListener('pointerdown', event => {
          seeking = true;
          seek.setPointerCapture(event.pointerId);
        });
        const finishSeek = () => {
          if (!seeking) return;
          seeking = false;
          origin = performance.now() - demoTime * 1000;
        };
        seek.addEventListener('pointerup', finishSeek);
        seek.addEventListener('pointercancel', finishSeek);
        seek.addEventListener('lostpointercapture', finishSeek);
        seek.addEventListener('keydown', event => {
          if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) seeking = true;
        });
        seek.addEventListener('keyup', finishSeek);
        seek.addEventListener('blur', finishSeek);
        const tick = (now: number) => {
          if (!playing || disposed) return;
          if (!seeking) renderTime(reducedMotion() ? script.duration : ((now - origin) / 1000) % script.duration);
          frame = requestAnimationFrame(tick);
        };
        renderTime(script.duration);
        controls.append(toggle, seekLabel, seek, time);
        demo.append(viewport, controls, element('p', 'demo-note', 'Illustrative recreation, not a recording of model execution. Reduced motion shows the completed state during playback; seeking inspects an exact time.'));
        cleanup = () => cancelAnimationFrame(frame);
      }).catch((error: unknown) => {
        if (!disposed) loading.textContent = `The terminal recreation could not load: ${error instanceof Error ? error.message : String(error)}. Check your connection and reload this page to try again.`;
      });
    }
    renderDocs(root, selected);
  }
  return () => { disposed = true; cleanup(); };
}

function renderDocs(root: HTMLElement, feature: AtlasFeature): void {
  const docs = element('section', 'feature-docs');
  docs.append(element('h2', '', 'Documentation'), element('p', '', 'These omp:// references identify the built-in documentation. Open them with omp’s read tool; public source links are in the evidence card.'));
  const list = element('ul');
  for (const uri of feature.docs) {
    const item = element('li');
    item.append(element('code', '', uri));
    list.append(item);
  }
  docs.append(list);
  root.append(docs);
}
