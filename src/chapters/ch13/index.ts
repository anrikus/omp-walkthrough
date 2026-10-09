import type { ChapterModule, RenderContext, SceneModule } from '../../engine/types';
import { sceneFrame, withEvidence } from '../shared/scene';
import './close.css';

interface Takeaway {
  content: HTMLElement;
  rule: HTMLElement;
  cue: string;
}

let takeaways: Takeaway[] = [];
let navigation: HTMLElement;
let disclaimer: HTMLElement;
let root: HTMLElement;

function progress(ctx: RenderContext, cue: string): number {
  if (ctx.reducedMotion) return 1;
  return Math.min(1, ctx.progress(cue) * 5);
}

function visibility(el: HTMLElement, value: number): void {
  el.style.opacity = String(value);
  el.toggleAttribute('inert', value < 1);
  el.setAttribute('aria-hidden', String(value === 0));
}

const close: SceneModule = {
  id: '13.1',
  mount(stage, ctx) {
    const frame = sceneFrame(stage, {
      title: ctx.scene.title,
      layout: 'full',
      date: '2026-10-08',
    });
    root = frame.el;
    root.classList.add('ch13-close');
    const bands = document.createElement('div');
    bands.className = 'ch13-close__bands';
    takeaways = ['13.1.a', '13.1.b', '13.1.c'].map((id, index) => {
      const item = ctx.onScreen(id);
      const band = document.createElement('section');
      band.className = 'ch13-close__band';
      const joint = document.createElement('div');
      joint.className = 'ch13-close__joint';
      joint.setAttribute('aria-hidden', 'true');
      const rule = document.createElement('div');
      rule.className = 'ch13-close__rule';
      rule.setAttribute('aria-hidden', 'true');
      rule.style.transform = 'scaleX(0)';
      const content = document.createElement('div');
      content.className = 'ch13-close__content';
      const heading = document.createElement('h3');
      heading.textContent = item.text;
      content.append(heading);
      withEvidence(content, item, ctx);
      visibility(content, 0);
      band.append(joint, rule, content);
      bands.append(band);
      return { content, rule, cue: `13.1.${index + 2}` };
    });

    const navigationItem = ctx.onScreen('13.1.e');
    const [dateText, referencesText, atlasText] = navigationItem.text.split(' · ') as [string, string, string];
    navigation = document.createElement('nav');
    navigation.className = 'ch13-close__navigation';
    navigation.setAttribute('aria-label', 'Explore the evidence and features');
    const date = document.createElement('time');
    date.dateTime = '2026-10-08';
    date.textContent = dateText;
    const references = document.createElement('a');
    references.href = '#references';
    references.textContent = referencesText;
    const atlas = document.createElement('a');
    atlas.href = '#atlas';
    atlas.textContent = atlasText;
    navigation.append(date, ' · ', references, ' · ', atlas);
    withEvidence(navigation, navigationItem, ctx);
    visibility(navigation, 0);
    frame.visual.append(bands, navigation);

    const disclaimerItem = ctx.onScreen('13.1.d');
    disclaimer = document.createElement('p');
    disclaimer.className = 'ch13-close__disclaimer';
    disclaimer.textContent = disclaimerItem.text;
    withEvidence(disclaimer, disclaimerItem, ctx);
    visibility(disclaimer, 0);
    frame.notes.append(disclaimer);
  },
  render(ctx) {
    for (const takeaway of takeaways) {
      const p = progress(ctx, takeaway.cue);
      // A branch locks into the shared spine before its supported claim lands.
      const draw = Math.min(1, p * 2);
      const arrival = Math.max(0, Math.min(1, (p - 0.2) / 0.8));
      const eased = arrival * arrival * (3 - 2 * arrival);
      takeaway.rule.style.transform = `scaleX(${draw})`;
      visibility(takeaway.content, eased);
      takeaway.content.style.transform = `translateX(${(1 - eased) * 24}px)`;
    }
    visibility(navigation, progress(ctx, '13.1.5'));
    visibility(disclaimer, progress(ctx, '13.1.6'));
  },
  unmount() {
    root.remove();
    takeaways = [];
  },
};

const chapter: ChapterModule = { id: 'ch13', scenes: { '13.1': close } };
export default chapter;
