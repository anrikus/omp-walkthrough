import { withEvidence, reveal } from '../shared/scene';
import { architectureScene, beat, box, canvas, claim, draw, element, line, shape, stagger, text } from './helpers';

export const scene121 = architectureScene('12.1', (frame, ctx) => {
  const diagram = canvas(1760, 430, 'Three separate things: released omp 18.8.6, the public omp2 pre-release branch, and the target architecture.');
  const released = box(diagram, 25, 70, 490, 258, 'Released omp 18.8.6', 'Used in this walkthrough');
  const branch = box(diagram, 635, 70, 490, 258, 'Public omp2 branch', 'Rust rewrite\nPre-release breaking changes', 'ch12-accent');
  const target = box(diagram, 1245, 70, 490, 258, 'Target architecture', 'Design commitments', 'ch12-partial');
  const leftGap = text(diagram, 575, 214, '≠', 58);
  const rightGap = text(diagram, 1185, 214, '≠', 58);
  const lowerRule = line(diagram, 635, 355, 1735, 355, 'ch12-muted');
  text(diagram, 1185, 399, 'Public pre-release work — not the released product', 26);
  frame.visual.append(diagram);
  claim(frame.visual, ctx, '12.1.a');
  return renderCtx => {
    const first = beat(renderCtx, '12.1.1');
    const second = beat(renderCtx, '12.1.2');
    released.setAttribute('transform', `translate(${70 * (1 - first)} 0)`);
    branch.setAttribute('transform', `translate(${-70 * (1 - first)} 0)`);
    target.setAttribute('transform', `translate(0 ${70 * (1 - second)})`);
    target.style.opacity = String(second);
    leftGap.style.opacity = String(first);
    rightGap.style.opacity = String(second);
    draw(lowerRule, second);
  };
});

export const scene122 = architectureScene('12.2', (frame, ctx) => {
  const diagram = canvas(1760, 432, 'Five separate state owners. Only the message-history marker rewinds; extension state, jobs, configuration, and UI state remain at a later moment. This is a schematic diagnosis, not a reproduced bug.');
  const names = ['Messages', 'Extension state', 'Jobs', 'Configuration', 'UI state'];
  const owners = names.map((name, index) => box(diagram, 20, 12 + index * 72, 330, 59, name));
  const rails = names.map((_, index) => line(diagram, 405, 42 + index * 72, 1640, 42 + index * 72, 'ch12-muted'));
  const markers = names.map((_, index) => {
    const marker = shape('circle', { cx: 440, cy: 42 + index * 72, r: 13, class: 'ch12-packet' });
    diagram.append(marker);
    return marker;
  });
  const rewind = shape('path', { d: 'M 1515 24 H 775 l 18 -12 M 775 24 l 18 12', class: 'ch12-line', pathLength: 1 });
  diagram.append(rewind);
  text(diagram, 435, 403, 'Earlier', 24, 'start');
  text(diagram, 1640, 403, 'Later', 24, 'end');
  text(diagram, 1040, 403, 'Separate session-state moments', 24);
  frame.visual.append(diagram);
  claim(frame.visual, ctx, '12.2.a');
  frame.visual.append(element('p', 'ch12-caption', 'Schematic illustration of the creator’s diagnosis — not a reproduced bug.'));
  return renderCtx => {
    const first = beat(renderCtx, '12.2.1');
    const second = beat(renderCtx, '12.2.2');
    owners.forEach((owner, index) => {
      const p = stagger(first, index, owners.length);
      owner.setAttribute('transform', `translate(${55 * (1 - p)} ${(2 - index) * 50 * (1 - p)})`);
      owner.style.opacity = String(p);
      draw(rails[index]!, p);
      markers[index]!.setAttribute('cx', String(440 + 1135 * first - (index === 0 ? 800 * second : 0)));
      markers[index]!.style.opacity = String(p);
    });
    draw(rewind, second);
  };
});

export const scene123 = architectureScene('12.3', (frame, ctx) => {
  claim(frame.visual, ctx, '12.3.a');
  const item = ctx.onScreen('12.3.b');
  const sheet = element('section', 'ch12-status-sheet');
  sheet.dataset.onScreen = item.id;
  const spine = element('div', 'ch12-status-spine');
  spine.setAttribute('aria-hidden', 'true');
  const list = element('ul', 'ch12-status-list');
  list.setAttribute('role', 'list');
  const sources = [
    ['ohmypicontributors2026one'],
    ['ohmypicontributors2026policy'],
    ['ohmypicontributors2026output', 'ohmypicontributors2026one-2'],
    ['ohmypicontributors2026model', 'ohmypicontributors2026inference'],
    ['ohmypicontributors2026controller', 'ohmypicontributors2026typed'],
  ];
  const rows = item.text.split('; ').map((commitment, index) => {
    const [heading = '', status = ''] = commitment.split(' — ');
    const row = element('li', 'ch12-status-row');
    const branch = element('span', 'ch12-status-branch');
    branch.setAttribute('aria-hidden', 'true');
    const title = element('h3', 'ch12-status-heading', heading);
    const description = element('p', 'ch12-status-description', `— ${status}${index < 4 ? ';' : ''}`);
    const source = element('button', 'ch12-status-source', 'Source');
    source.type = 'button';
    source.setAttribute('aria-label', `Source for ${commitment}`);
    ctx.cite(source, { sources: sources[index] });
    row.append(branch, title, description, source);
    list.append(row);
    return { branch, title, description, source };
  });
  const evidence = element('div', 'ch12-status-evidence');
  evidence.append(element('span', 'ch12-status-evidence-label', 'All five commitment statuses'));
  withEvidence(evidence, item, ctx);
  sheet.append(spine, list, evidence);
  frame.visual.append(sheet);
  return renderCtx => {
    const first = beat(renderCtx, '12.3.1');
    const second = beat(renderCtx, '12.3.2');
    spine.style.transform = `scaleY(${first})`;
    rows.forEach(({ branch, title, description, source }, index) => {
      const headingProgress = stagger(first, index, rows.length);
      const statusProgress = stagger(second, index, rows.length);
      branch.style.transform = `scaleX(${headingProgress})`;
      title.style.transform = `translateX(${36 * (1 - headingProgress)}px)`;
      title.style.opacity = String(headingProgress);
      description.style.transform = `translateX(${55 * (1 - statusProgress)}px)`;
      description.style.opacity = String(statusProgress);
      source.style.opacity = String(statusProgress);
      source.inert = statusProgress === 0;
    });
  };
});

export const scene124 = architectureScene('12.4', (frame, ctx) => {
  const diagram = canvas(1760, 372, 'Journal events flow through Fold into an authoritative session tree containing messages, tools, jobs, todos, and queues. Directional arrows connect the tree to projections for rewind, fork, resume, prompts, and views. An audio-driven scrubber selects reconstructed snapshots. Filesystem and network side effects remain outside session reconstruction.');
  const defs = shape('defs');
  const arrow = shape('marker', { id: 'ch12-state-arrow', markerWidth: 12, markerHeight: 12, refX: 12, refY: 6, orient: 'auto', markerUnits: 'userSpaceOnUse' });
  arrow.append(shape('path', { d: 'M 0 0 L 12 6 L 0 12 Z', class: 'ch12-packet' }));
  defs.append(arrow);
  diagram.append(defs);
  const reconstruction = shape('rect', { x: 340, y: 8, width: 1400, height: 292, rx: 16, fill: 'none', stroke: 'var(--color-control-line)', 'stroke-width': 2 });
  diagram.append(reconstruction);
  text(diagram, 1060, 40, 'Session reconstruction', 24);
  box(diagram, 14, 55, 285, 200, 'Journal', 'Recorded events');
  box(diagram, 365, 119, 160, 72, 'Fold');
  const journalFeed = line(diagram, 299, 155, 365, 155);
  const trunk = line(diagram, 525, 155, 682, 155);
  const root = shape('circle', { cx: 700, cy: 155, r: 18, class: 'ch12-node' });
  diagram.append(root);
  text(diagram, 652, 94, 'Session tree', 27);
  const kinds = ['Messages', 'Tools', 'Jobs', 'Todos', 'Queues'];
  const endpoints = kinds.map((name, index) => {
    const y = 70 + index * 39;
    const branch = line(diagram, 700, 155, 840, y);
    const node = shape('circle', { cx: 840, cy: y, r: 9, class: 'ch12-node' });
    diagram.append(node);
    text(diagram, 862, y + 8, name, 24, 'start');
    return { branch, node };
  });
  const events = endpoints.map((_, index) => {
    const event = shape('rect', { x: 72, y: 156 + index * 14, width: 170 - index * 15, height: 5, rx: 2, class: 'ch12-packet' });
    diagram.append(event);
    return event;
  });
  const projectionFeed = shape('path', { d: 'M 700 173 V 272 H 1100', class: 'ch12-line', pathLength: 1 });
  diagram.append(projectionFeed);
  const projectionBus = line(diagram, 1100, 272, 1100, 71);
  text(diagram, 1497, 35, 'Projections', 24);
  const consumers = ['Rewind', 'Fork', 'Resume', 'Prompts', 'Views'];
  const outputs = consumers.map((name, index) => {
    const y = 53 + index * 44;
    const wire = line(diagram, 1100, y + 18, 1310, y + 18);
    const card = box(diagram, 1310, y, 375, 36, name);
    const label = card.querySelector('text');
    label?.setAttribute('font-size', '24');
    return { wire, card };
  });
  const scrubber = shape('circle', { cx: 1050, cy: 272, r: 11, class: 'ch12-packet' });
  diagram.append(scrubber);
  const external = line(diagram, 380, 323, 1740, 323, 'ch12-muted ch12-external');
  text(diagram, 1060, 357, 'Outside the rewind area: filesystem and network side effects', 26);
  const proof = element('div', 'ch12-proof-grid');
  frame.visual.append(diagram, proof);
  claim(proof, ctx, '12.4.a');
  const caveat = claim(proof, ctx, '12.4.b');
  return renderCtx => {
    const first = beat(renderCtx, '12.4.1');
    const second = beat(renderCtx, '12.4.2');
    const third = beat(renderCtx, '12.4.3');
    const journalProgress = Math.min(1, first * 4);
    const trunkProgress = Math.max(0, Math.min(1, first * 4 - 1));
    const treeProgress = Math.max(0, first * 2 - 1);
    draw(journalFeed, journalProgress);
    draw(trunk, trunkProgress);
    journalFeed.setAttribute('marker-end', journalProgress === 1 ? 'url(#ch12-state-arrow)' : 'none');
    trunk.setAttribute('marker-end', trunkProgress === 1 ? 'url(#ch12-state-arrow)' : 'none');
    root.style.opacity = String(trunkProgress === 1 ? 1 : 0);
    endpoints.forEach(({ branch, node }, index) => {
      const p = stagger(treeProgress, index, endpoints.length);
      draw(branch, p);
      node.setAttribute('r', String(4 + 5 * p));
      node.style.opacity = String(p);
      events[index]!.style.opacity = String(1 - 0.6 * Math.sin(p * Math.PI));
    });
    const feedProgress = Math.min(1, second / 0.4);
    const busProgress = Math.max(0, Math.min(1, (second - 0.4) / 0.15));
    const projectionProgress = Math.max(0, (second - 0.55) / (1 - 0.55));
    const snapshot = projectionProgress < 0.55 ? 1 - projectionProgress / 0.55 * 0.75 : 0.25 + (projectionProgress - 0.55) / 0.45 * 0.5;
    scrubber.setAttribute('cx', String(735 + 330 * snapshot));
    scrubber.style.opacity = String(busProgress === 1 ? 1 : 0);
    draw(projectionFeed, feedProgress);
    draw(projectionBus, busProgress);
    projectionFeed.setAttribute('marker-end', feedProgress === 1 ? 'url(#ch12-state-arrow)' : 'none');
    outputs.forEach(({ wire, card }, index) => {
      const p = stagger(projectionProgress, index, outputs.length);
      draw(wire, p);
      wire.setAttribute('marker-end', p === 1 ? 'url(#ch12-state-arrow)' : 'none');
      card.style.opacity = String(p);
    });
    external.setAttribute('stroke-width', String(2 + third * 3));
    reveal(caveat, Math.min(1, third * 3 + 0.8), renderCtx.reducedMotion);
  };
});
