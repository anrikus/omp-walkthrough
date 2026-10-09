import type { Grade, NarrationScene, SceneModule } from './types';

const gradeLabels: Record<Grade, string> = {
  A: 'Peer-reviewed',
  B: 'Preprint/tech report',
  C: 'First-party',
  D: 'Secondary',
  E: 'Anecdotal',
};

export function createFallbackScene(scene: NarrationScene): SceneModule {
  const items: Array<{ el: HTMLLIElement; at?: string }> = [];

  return {
    id: scene.id,
    mount(stage, ctx) {
      const section = document.createElement('section');
      section.className = 'fallback-scene';
      const count = scene.onScreen.length;
      section.style.setProperty('--fallback-columns', count > 8 ? '3' : count > 3 ? '2' : '1');
      section.style.setProperty('--fallback-font', count > 8 ? '25px' : count > 3 ? '30px' : '35px');
      section.style.setProperty('--fallback-gap', count > 8 ? '14px' : '24px');
      const title = document.createElement('h2');
      title.className = 'fallback-title';
      title.textContent = scene.title;
      const list = document.createElement('ul');
      list.className = 'fallback-items';

      for (const item of scene.onScreen) {
        const row = document.createElement('li');
        row.className = 'fallback-item';
        row.dataset.item = item.id;
        row.dataset.kind = item.kind;
        const text = document.createElement(item.kind === 'code' || item.kind === 'tui' ? 'pre' : 'p');
        text.className = 'fallback-item-text';
        text.textContent = item.text;
        row.append(text);

        if (item.grade) {
          const badge = document.createElement('span');
          badge.className = 'grade-badge';
          badge.dataset.grade = item.grade;
          badge.textContent = `${item.grade} ${gradeLabels[item.grade]}`;
          row.append(badge);
        }

        if (item.claims.length || item.sources?.length) {
          const citation = document.createElement('button');
          citation.type = 'button';
          citation.className = 'citation-chip';
          citation.textContent = 'Evidence';
          citation.setAttribute('aria-label', `Evidence for ${item.text}`);
          ctx.cite(citation, { claims: item.claims, sources: item.sources });
          row.append(citation);
        }

        items.push({ el: row, at: item.at });
        list.append(row);
      }

      section.append(title, list);
      stage.append(section);
    },
    render(ctx) {
      for (const item of items) {
        item.el.hidden = !(
          ctx.reducedMotion ||
          ctx.duration === 0 ||
          !item.at ||
          ctx.t >= ctx.sentence(item.at).start
        );
      }
    },
    unmount() {
      items.length = 0;
    },
  };
}
