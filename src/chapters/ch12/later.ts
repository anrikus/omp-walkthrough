import type { SceneModule } from '../../engine/types';
import { statCard } from '../../kit';
import { withEvidence } from '../shared/scene';
import { architectureScene, beat, box, canvas, claim, draw, element, line, shape, text } from './helpers';

// Geometry follows the audio clock; factual labels and qualifications never disappear.
export const scene125: SceneModule = architectureScene('12.5', (frame, ctx) => {
  frame.visual.classList.add('ch12-later', 'ch12-boundary');
  const svg = canvas(1760, 330, 'Trusted host and executor separated by a trust boundary; bounded request and result streams share a job model. Minimized stub remains partial.');
  frame.visual.append(svg);
  box(svg, 20, 52, 500, 180, 'Trusted host', 'state · routing · approvals · limits');
  const boundary = line(svg, 865, 12, 865, 277, 'ch12-trust-boundary');
  text(svg, 865, 317, 'Trust boundary', 26);
  box(svg, 1190, 52, 550, 180, 'Executor', 'Minimized remote/container/VM stub', 'ch12-partial');
  text(svg, 1465, 201, 'Partial', 25);
  const request = line(svg, 545, 96, 1165, 96);
  const result = line(svg, 1165, 168, 545, 168);
  text(svg, 710, 79, 'Capped requests', 25);
  text(svg, 1010, 207, 'Capped results', 25);
  for (const x of [545, 1165]) {
    line(svg, x, 84, x, 108);
    line(svg, x, 156, x, 180);
  }
  const partial = shape('path', { d: 'M 1220 242 H 1200 V 309 H 1220', class: 'ch12-line ch12-muted', 'stroke-dasharray': '6 5' });
  svg.append(partial);
  text(svg, 1480, 268, 'Effective extension-confinement\ndefaults unresolved', 24);
  const job = shape('rect', { x: 20, y: 252, width: 710, height: 64, rx: 12, class: 'ch12-job-panel' });
  svg.append(job);
  text(svg, 375, 293, 'Long-running calls + subagents → one job model', 26);
  const jobConnection = line(svg, 580, 96, 580, 252);
  const claims = element('div', 'ch12-later-claims');
  frame.visual.append(claims);
  claim(claims, ctx, '12.5.a');
  claim(claims, ctx, '12.5.b', 'ch12-caveat');
  return (now) => {
    draw(boundary, 0.15 + 0.85 * beat(now, '12.5.1'));
    draw(request, beat(now, '12.5.2'));
    draw(result, beat(now, '12.5.2'));
    draw(jobConnection, beat(now, '12.5.2'));
    partial.setAttribute('transform', `translate(0 ${-8 * (1 - beat(now, '12.5.3'))})`);
  };
});

export const scene126: SceneModule = architectureScene('12.6', (frame, ctx) => {
  frame.visual.classList.add('ch12-later');
  const svg = canvas(1760, 350, 'Convars declare scope and persistence. Directors compose a stack with Plan containing ForceTool. Model and provider inputs feed a separate rulebook; plugin migration is a different concern.');
  frame.visual.append(svg);
  svg.append(shape('rect', { x: 20, y: 35, width: 400, height: 180, rx: 12, class: 'ch12-job-panel' }));
  text(svg, 220, 80, 'Convars', 29);
  const scope = box(svg, 40, 115, 170, 65, 'Scope');
  const persistence = box(svg, 225, 115, 175, 65, 'Persistence');
  text(svg, 685, 25, 'Directors', 24);
  svg.append(shape('rect', { x: 465, y: 35, width: 440, height: 180, rx: 12, class: 'ch12-job-panel' }));
  text(svg, 685, 80, 'Plan', 29);
  const force = box(svg, 515, 112, 340, 73, 'ForceTool', '', 'ch12-nested');
  text(svg, 460, 257, 'Playbook design, not CLI syntax', 26);
  text(svg, 1075, 62, 'Model', 26);
  text(svg, 1075, 181, 'Provider', 26);
  const model = line(svg, 1140, 57, 1280, 108);
  const provider = line(svg, 1140, 174, 1280, 125);
  box(svg, 1280, 35, 460, 180, 'Compiled rulebook', 'Model/provider semantics');
  const separate = line(svg, 1010, 242, 1740, 242, 'ch12-partial-line');
  text(svg, 1375, 283, 'Plugin migration is separate', 27);
  const claims = element('div', 'ch12-later-claims');
  frame.visual.append(claims);
  claim(claims, ctx, '12.6.a');
  claim(claims, ctx, '12.6.b', 'ch12-caveat');
  return (now) => {
    const p = beat(now, '12.6.1');
    scope.setAttribute('transform', `translate(0 ${12 * (1 - p)})`);
    persistence.setAttribute('transform', `translate(0 ${-12 * (1 - p)})`);
    force.setAttribute('transform', `translate(0 ${18 * (1 - p)})`);
    draw(model, beat(now, '12.6.2'));
    draw(provider, beat(now, '12.6.2'));
    draw(separate, beat(now, '12.6.3'));
  };
});

export const scene127: SceneModule = architectureScene('12.7', (frame, ctx) => {
  frame.visual.classList.add('ch12-later', 'ch12-views');
  const svg = canvas(1760, 232, 'One shared-state hub feeds terminal, remote and inspector views. Full web equivalence is partial. Bounded transcript model checks are not whole-application proof.');
  frame.visual.append(svg);
  box(svg, 20, 70, 390, 105, 'Shared state', 'One session owner');
  const links = [line(svg, 410, 119, 610, 59), line(svg, 410, 119, 950, 119), line(svg, 410, 119, 1290, 179)];
  const views = [
    { x: 610, y: 19, name: 'Terminal' },
    { x: 950, y: 59, name: 'Remote' },
    { x: 1290, y: 139, name: 'Inspector' },
  ];
  for (const view of views) {
    box(svg, view.x, view.y, 270, 76, view.name);
    line(svg, view.x + 100, view.y + 88, view.x + 170, view.y + 88);
    line(svg, view.x + 135, view.y + 76, view.x + 135, view.y + 88);
  }
  text(svg, 1310, 34, 'Full web equivalence: partial', 27);
  const claims = element('div', 'ch12-later-claims ch12-evidence-grid');
  frame.visual.append(claims);
  claim(claims, ctx, '12.7.a');
  const bounded = claim(claims, ctx, '12.7.b', 'ch12-bounded');
  const marker = element('div', 'ch12-audio-rule');
  bounded.prepend(marker);
  claim(claims, ctx, '12.7.c');
  claim(claims, ctx, '12.7.d');
  return (now) => {
    for (const link of links) draw(link, beat(now, '12.7.1'));
    marker.style.transform = `scaleX(${0.08 + 0.92 * beat(now, '12.7.2')})`;
  };
});

export const scene128: SceneModule = architectureScene('12.8', (frame, ctx) => {
  frame.visual.classList.add('ch12-later', 'ch12-register');
  const upper = element('div', 'ch12-register-upper');
  const lower = element('div', 'ch12-register-lower');
  frame.visual.append(upper, lower);
  const status = ctx.onScreen('12.8.a');
  const stat = statCard({
    value: '36 ADRs',
    label: '25 Implemented / 11 Partial',
    condition: status.text,
  });
  stat.el.classList.add('ch12-register-stat');
  stat.el.dataset.onScreen = status.id;
  upper.append(stat.el);
  withEvidence(stat.el, status, ctx);
  const register = element('section', 'ch12-component-register');
  upper.append(register);
  const svg = canvas(830, 92, 'Author-reported built components, partial infrastructure, and planned tiny local chore model. The tiny model is absent; its supporting layer is partial.');
  register.append(svg);
  const swatches = [
    shape('rect', { x: 115, y: 54, width: 24, height: 24, class: 'ch12-built-bar' }),
    shape('rect', { x: 400, y: 54, width: 24, height: 24, class: 'ch12-partial-bar' }),
    shape('rect', { x: 685, y: 54, width: 24, height: 24, class: 'ch12-planned-bar' }),
  ];
  text(svg, 127, 33, 'Built', 29);
  text(svg, 412, 33, 'Partial', 29);
  text(svg, 697, 33, 'Planned / absent', 29);
  svg.append(...swatches);
  claim(register, ctx, '12.8.b');
  const migration = element('section', 'ch12-migration');
  lower.append(migration);
  migration.append(element('h3', '', 'Configuration conversion ≠ upgrade guarantee'));
  claim(migration, ctx, '12.8.c');
  const ownership = element('section', 'ch12-ownership');
  lower.append(ownership);
  ownership.append(element('h3', '', 'Shared complexity needs one owner'));
  claim(ownership, ctx, '12.8.d');
  const migrationRule = element('div', 'ch12-audio-rule');
  const ownershipRule = element('div', 'ch12-audio-rule');
  migration.prepend(migrationRule);
  ownership.prepend(ownershipRule);
  return (now) => {
    const p = beat(now, '12.8.1');
    for (const swatch of swatches) swatch.setAttribute('transform', `translate(0 ${12 * (1 - p)})`);
    migrationRule.style.transform = `scaleX(${0.08 + 0.92 * beat(now, '12.8.2')})`;
    ownershipRule.style.transform = `scaleX(${0.08 + 0.92 * beat(now, '12.8.3')})`;
  };
});
