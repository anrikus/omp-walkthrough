import { citationLabels, gradeLabels, loadEvidence } from './data';
import type { EvidenceSource } from './data';
import { button, element, link } from './dom';
import type { Grade } from '../engine/types';

export interface References { claims?: string[]; sources?: string[] }

export function gradeBadge(grade: Grade | null): HTMLElement {
  const badge = element('span', 'grade-badge', grade ? `${grade} ${gradeLabels[grade]}` : 'Ungraded');
  badge.dataset.grade = grade ?? 'ungraded';
  return badge;
}

function claimText(text: string): DocumentFragment {
  const content = document.createDocumentFragment();
  let offset = 0;
  for (const match of text.matchAll(/\[INFERENCE(?::([^\]]*))?\]/g)) {
    content.append(text.slice(offset, match.index));
    const detail = match[1] === undefined ? '' : `:${match[1]}`;
    content.append(element('span', 'researcher-inference', `Researcher inference${detail}`));
    offset = match.index + match[0].length;
  }
  content.append(text.slice(offset));
  return content;
}

function sourceCard(source: EvidenceSource): HTMLElement {
  const article = element('article', 'source-card');
  article.id = `source-${source.key}`;
  const title = element('h3', '', source.title);
  const metadata = element('p', 'source-metadata', [source.authors, source.venue, source.year].filter(Boolean).join(' · '));
  article.append(gradeBadge(source.grade), title, metadata);
  if (source.gradeNote !== undefined) article.append(element('p', 'evidence-note', `Evidence grading: ${source.gradeNote}`));
  const urls = element('ul', 'source-links');
  let hasNonWebLocators = false;
  for (const [index, url] of source.urls.entries()) {
    const item = element('li');
    if (/^https?:\/\//.test(url)) item.append(link(`${index + 1}. ${url}`, url));
    else {
      item.append(element('code', '', url));
      hasNonWebLocators = true;
    }
    urls.append(item);
  }
  article.append(urls);
  if (hasNonWebLocators) article.append(element('p', 'evidence-note', 'Non-web locators are not public links. Built-in omp/tool locators require the matching installation; file paths are research locators, not public downloads.'));
  if (source.accessed) article.append(element('p', 'source-accessed', `Accessed ${source.accessed}`));
  return article;
}

export function createEvidenceDialog(pause: () => void) {
  const dialog = element('dialog', 'evidence-dialog');
  dialog.setAttribute('aria-labelledby', 'evidence-title');
  const header = element('div', 'dialog-header');
  const title = element('h2', '', 'Evidence');
  title.id = 'evidence-title';
  header.append(title, button('Close evidence', close, 'quiet-button'));
  const body = element('div', 'evidence-body');
  dialog.append(header, body);
  let requestVersion = 0;
  dialog.addEventListener('cancel', () => { ++requestVersion; });
  dialog.addEventListener('close', () => {
    if (!dialog.open) ++requestVersion;
  });

  function close(): void {
    ++requestVersion;
    if (dialog.open) dialog.close();
  }

  function open(refs: References): void {
    pause();
    const request = ++requestVersion;
    const loading = element('p', '', 'Loading evidence…');
    loading.setAttribute('role', 'status');
    body.replaceChildren(loading);
    body.scrollTop = 0;
    if (!dialog.open) dialog.showModal();
    void fill(refs, request);
  }

  async function fill(refs: References, request: number): Promise<void> {
    try {
      const evidence = await loadEvidence();
      if (request !== requestVersion || !dialog.open || !dialog.isConnected) return;
      body.replaceChildren();
      const sourceIds = new Set(refs.sources ?? []);
      for (const id of refs.claims ?? []) {
        const claim = evidence.claims[id];
        if (!claim) {
          body.append(element('p', 'error-message', `Evidence record not found: ${id}. Rebuild the evidence data.`));
          continue;
        }
        const section = element('section', 'claim-card');
        section.append(element('h3', 'claim-id', id));
        const grades = element('div', 'grade-list');
        for (const grade of claim.grades) grades.append(gradeBadge(grade));
        section.append(grades);
        if (typeof claim.text === 'string') {
          const paragraph = element('p', 'claim-text');
          paragraph.append(claimText(claim.text));
          section.append(paragraph);
        } else {
          const fields = element('dl', 'claim-fields');
          for (const [key, value] of Object.entries(claim.text)) {
            const description = element('dd');
            description.append(claimText(claim.resolved?.[key] ?? value));
            fields.append(element('dt', '', key), description);
          }
          section.append(fields);
        }
        if (claim.flags.length) section.append(element('p', 'evidence-note', `Evidence notes: ${claim.flags.join(', ')}.`));
        body.append(section);
        for (const key of claim.citations) sourceIds.add(key);
      }
      body.append(element('h3', 'evidence-sources-title', 'Sources'));
      for (const key of sourceIds) {
        const source = evidence.sources[key];
        body.append(source ? sourceCard(source) : element('p', 'error-message', `Source record not found: ${key}.`));
      }
      body.scrollTop = 0;
    } catch (error) {
      if (request !== requestVersion || !dialog.open || !dialog.isConnected) return;
      const message = element('p', 'error-message', `Evidence could not load. Check your connection and reload this page to try again. Details: ${error instanceof Error ? error.message : String(error)}`);
      message.setAttribute('role', 'alert');
      body.replaceChildren(message);
    }
  }

  function cite(el: HTMLElement, refs: References): void {
    el.classList.add('citation-chip');
    if (!el.textContent) el.textContent = [
      ...(refs.claims ?? []).map(id => citationLabels.claims[id]?.label ?? 'Evidence unavailable'),
      ...(refs.sources ?? []).map(id => citationLabels.sources[id]?.label ?? 'Evidence unavailable'),
    ].join(', ');
    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', `View evidence: ${el.textContent}`);
    if (el instanceof HTMLButtonElement) el.type = 'button';
    else {
      el.setAttribute('role', 'button');
      el.tabIndex = 0;
      el.addEventListener('keydown', event => {
        if (event.key === 'Enter') { event.preventDefault(); open(refs); }
        if (event.key === ' ') event.preventDefault();
      });
      el.addEventListener('keyup', event => {
        if (event.key === ' ') { event.preventDefault(); open(refs); }
      });
    }
    el.addEventListener('click', event => { event.preventDefault(); open(refs); });
  }

  return { dialog, open, close, cite };
}

export function citationList(refs: References, cite: (el: HTMLElement, refs: References) => void): HTMLElement {
  const list = element('div', 'citation-list');
  for (const id of refs.claims ?? []) {
    const metadata = citationLabels.claims[id];
    const chip = element('button', '', metadata?.label ?? 'Evidence unavailable');
    chip.setAttribute('aria-label', metadata ? `View ${metadata.label}. ${metadata.description}` : 'Evidence unavailable: claim label missing');
    cite(chip, { claims: [id] });
    list.append(chip);
  }
  for (const id of refs.sources ?? []) {
    const metadata = citationLabels.sources[id];
    const chip = element('button', '', metadata?.label ?? 'Evidence unavailable');
    chip.setAttribute('aria-label', metadata ? `View ${metadata.label}. ${metadata.description}` : 'Evidence unavailable: source label missing');
    cite(chip, { sources: [id] });
    list.append(chip);
  }
  return list;
}

export async function renderReferences(): Promise<DocumentFragment> {
  const evidence = await loadEvidence();
  const root = document.createDocumentFragment();
  root.append(element('h1', '', 'References'), element('p', 'page-intro', 'Every source cited in the presentation and Feature Atlas, grouped by evidence grade. A stronger grade does not remove the conditions of a claim.'));
  for (const grade of ['A', 'B', 'C', 'D', 'E', null] as const) {
    const sources = Object.values(evidence.sources).filter(source => source.grade === grade).sort((a, b) => a.title.localeCompare(b.title));
    if (!sources.length) continue;
    const group = element('section', 'reference-group');
    const heading = element('h2');
    heading.append(gradeBadge(grade), element('span', 'reference-count', `${sources.length} sources`));
    group.append(heading);
    for (const source of sources) group.append(sourceCard(source));
    root.append(group);
  }
  if (!Object.keys(evidence.sources).length) root.append(element('p', '', 'No sources are referenced by the available chapters or atlas yet.'));
  return root;
}
