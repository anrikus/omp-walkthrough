import type { SceneModule } from '../../engine/types';
import { reveal, sceneFrame, withEvidence } from '../shared/scene';

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text: string,
  styles: Partial<CSSStyleDeclaration> = {},
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.textContent = text;
  Object.assign(el.style, { margin: '0', boxSizing: 'border-box' }, styles);
  return el;
}

function panel(title: string): HTMLElement {
  const el = element('section', '', {
    display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px',
    height: '616px', minWidth: '0', background: 'var(--color-paper)',
    border: '1px solid var(--color-control-line)', borderRadius: '12px',
  });
  el.append(element('h3', title, {
    fontFamily: 'var(--font-display)', fontSize: '32px', lineHeight: '1.15',
    fontWeight: '600',
  }));
  return el;
}

function exactText(text: string): HTMLParagraphElement {
  return element('p', text, {
    fontSize: '22px', lineHeight: '1.3', color: 'var(--color-ink)',
  });
}

/** Independent measurements on one fixed 0–100 scale, not stacked shares. */
function useBar(label: string, value: number, valueLabel: string): HTMLElement {
  const row = element('div', '', { display: 'grid', gap: '7px' });
  const labels = element('div', '', {
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
    fontSize: '26px', lineHeight: '1.15',
  });
  labels.append(element('span', label), element('strong', valueLabel, {
    fontVariantNumeric: 'tabular-nums', fontSize: '30px',
  }));
  const track = element('div', '', {
    height: '19px', background: 'var(--color-panel)',
    borderInlineStart: '1px solid var(--color-muted)',
  });
  const fill = element('div', '', {
    height: '100%', width: `${value}%`, background: 'var(--color-accent)',
    borderRadius: '0 3px 3px 0',
  });
  track.setAttribute('aria-hidden', 'true');
  track.append(fill);
  row.append(labels, track);
  return row;
}

export const adoptionScene: SceneModule = (() => {
  let root: HTMLElement;
  let rows: HTMLElement[];
  let overlapAccent: HTMLElement;
  let trust: HTMLElement;

  return {
    id: '1.4',
    mount(stage, ctx) {
      const frame = sceneFrame(stage, {
        title: ctx.scene.title, layout: 'full', date: '2026-10-08',
        eyebrow: 'Two questions. Two populations.',
      });
      root = frame.el;
      Object.assign(frame.visual.style, {
        display: 'grid', gridTemplateColumns: '1000px 730px', gap: '30px',
      });

      const useItem = ctx.onScreen('1.4.a');
      const use = panel('Past-year use');
      use.style.gap = '12px';
      const chart = element('div', '', {
        display: 'grid', gap: '12px', paddingBlock: '4px',
      });
      chart.setAttribute('role', 'group');
      chart.setAttribute('aria-label', 'Independent product-use bars; common scale from 0 to 100 percent. Selections overlap.');
      rows = [
        useBar('Claude Code', 65.5, '65.5%'),
        useBar('GitHub Copilot', 58.7, '58.7%'),
        useBar('OpenAI Codex', 29.5, '29.5%'),
      ];
      chart.append(...rows);
      const axis = element('div', '', {
        position: 'relative', height: '29px',
        borderBlockStart: '1px solid var(--color-muted)', paddingBlockStart: '4px',
        fontSize: '22px', lineHeight: '1.1', color: 'var(--color-muted)',
        fontVariantNumeric: 'tabular-nums',
      });
      for (const value of [0, 25, 50, 75, 100]) {
        axis.append(element('span', value === 100 ? '100%' : String(value), {
          position: 'absolute', left: `${value}%`,
          transform: value === 0 ? 'none' : value === 100 ? 'translateX(-100%)' : 'translateX(-50%)',
        }));
      }
      chart.append(axis);

      const overlap = element('div', '', {
        position: 'relative', padding: '10px 16px',
        background: 'var(--color-panel)', borderRadius: '6px',
        fontSize: '25px', lineHeight: '1.2', fontWeight: '600',
      });
      overlapAccent = element('div', '', {
        position: 'absolute', inset: '0', pointerEvents: 'none',
        border: '3px solid var(--color-accent)', borderRadius: '6px',
      });
      overlapAccent.setAttribute('aria-hidden', 'true');
      overlap.append(
        element('p', 'Overlapping selections — not exclusive market shares'),
        overlapAccent,
      );
      use.append(chart, overlap, exactText(useItem.text));
      const useEvidence = withEvidence(use, useItem, ctx);
      if (useEvidence) useEvidence.style.marginBlockStart = 'auto';

      const trustItem = ctx.onScreen('1.4.b');
      trust = panel('Trust in AI output');
      trust.append(element('p', 'AITrust · single-select · n = 14,304', {
        fontSize: '24px', lineHeight: '1.25', fontWeight: '600',
      }));
      const trustValues = element('dl', '', {
        display: 'grid', gridTemplateColumns: '168px minmax(0, 1fr)',
        alignItems: 'center', gap: '18px 20px', paddingBlock: '12px',
        borderBlock: '1px solid var(--color-control-line)',
      });
      for (const [value, label] of [
        ['48.0%', 'Trust when output is easy to verify'],
        ['6.6%', 'Trust with important work decisions'],
      ]) {
        const term = element('dt', label, {
          gridColumn: '2', fontSize: '26px', lineHeight: '1.2',
        });
        const result = element('dd', value, {
          gridColumn: '1', gridRow: value === '48.0%' ? '1' : '2',
          fontFamily: 'var(--font-display)', fontSize: '44px',
          lineHeight: '1.2', fontWeight: '600', fontVariantNumeric: 'tabular-nums',
        });
        trustValues.append(term, result);
      }
      trust.append(trustValues, element('p', 'Separate question; different denominator', {
        fontSize: '24px', lineHeight: '1.25', fontWeight: '600',
        color: 'var(--color-accent)',
      }), exactText(trustItem.text));
      const trustEvidence = withEvidence(trust, trustItem, ctx);
      if (trustEvidence) trustEvidence.style.marginBlockStart = 'auto';
      frame.visual.append(use, trust);
      frame.notes.append(element('p',
        'Survey responses describe reported use and conditional trust—not mutually exclusive market shares.',
        { fontSize: '26px', lineHeight: '1.3' },
      ));
    },
    render(ctx) {
      const useProgress = ctx.progress('1.4.1');
      for (let index = 0; index < rows.length; index += 1) {
        reveal(rows[index], useProgress * 3 - index, ctx.reducedMotion);
        rows[index].inert = !ctx.reducedMotion && useProgress * 3 <= index;
      }
      overlapAccent.style.opacity = String(ctx.reducedMotion ? 1 : ctx.progress('1.4.2'));
      const trustProgress = ctx.progress('1.4.3');
      reveal(trust, trustProgress * 4, ctx.reducedMotion);
      trust.inert = !ctx.reducedMotion && trustProgress === 0;
    },
    unmount() {
      root.remove();
    },
  };
})();

export const datasetScene: SceneModule = (() => {
  let root: HTMLElement;
  let paper: HTMLElement;
  let artifact: HTMLElement;
  let caveat: HTMLElement;

  return {
    id: '1.5',
    mount(stage, ctx) {
      const frame = sceneFrame(stage, {
        title: ctx.scene.title, layout: 'full', date: '2026-10-08',
        eyebrow: 'Published sample ≠ later artifact',
      });
      root = frame.el;
      Object.assign(frame.visual.style, {
        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: '30px',
      });

      const paperItem = ctx.onScreen('1.5.a');
      paper = panel('AIDev published paper');
      paper.append(
        element('p', '932,791', {
          fontFamily: 'var(--font-display)', fontSize: '86px', lineHeight: '1.1',
          fontWeight: '600', fontVariantNumeric: 'tabular-nums', marginBlockStart: '16px',
        }),
        element('p', 'agent-authored pull requests', { fontSize: '30px', lineHeight: '1.2' }),
        element('p', 'Cutoff 2025-08-01 · 5 agents', {
          fontSize: '28px', lineHeight: '1.25', fontWeight: '600',
          paddingBlock: '18px', borderBlock: '1px solid var(--color-control-line)',
        }),
        exactText(paperItem.text),
      );
      const paperEvidence = withEvidence(paper, paperItem, ctx);
      if (paperEvidence) paperEvidence.style.marginBlockStart = 'auto';

      const artifactItem = ctx.onScreen('1.5.b');
      artifact = panel('Separate author-maintained artifact');
      artifact.append(
        element('p', '2,743,854', {
          fontFamily: 'var(--font-display)', fontSize: '86px', lineHeight: '1.1',
          fontWeight: '600', fontVariantNumeric: 'tabular-nums', marginBlockStart: '16px',
        }),
        element('p', 'pull requests · AIDev v4', { fontSize: '30px', lineHeight: '1.2' }),
        element('p', 'Cutoff November 2025 · 6 agents', {
          fontSize: '28px', lineHeight: '1.25', fontWeight: '600',
          paddingBlock: '18px', borderBlock: '1px solid var(--color-control-line)',
        }),
        exactText(artifactItem.text),
      );
      const artifactEvidence = withEvidence(artifact, artifactItem, ctx);
      if (artifactEvidence) artifactEvidence.style.marginBlockStart = 'auto';
      frame.visual.append(paper, artifact);
      caveat = element('p',
        'Different cutoffs and populations. Observed public GitHub workflows—not a census of all AI coding.',
        { fontSize: '26px', lineHeight: '1.3' },
      );
      frame.notes.append(caveat);
    },
    render(ctx) {
      const paperProgress = ctx.progress('1.5.1');
      const artifactProgress = ctx.progress('1.5.2');
      reveal(paper, paperProgress * 4, ctx.reducedMotion);
      reveal(artifact, artifactProgress * 4, ctx.reducedMotion);
      reveal(caveat, artifactProgress * 4, ctx.reducedMotion);
      paper.inert = !ctx.reducedMotion && paperProgress === 0;
      artifact.inert = !ctx.reducedMotion && artifactProgress === 0;
    },
    unmount() {
      root.remove();
    },
  };
})();
