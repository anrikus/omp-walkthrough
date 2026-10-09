import type { ChapterModule } from '../engine/types';

const chapters = import.meta.glob<{ default: ChapterModule }>('./ch*/index.ts');

export async function loadChapter(id: string): Promise<ChapterModule | null> {
  const loader = chapters[`./${id}/index.ts`];
  if (loader === undefined) return null;

  const chapter = (await loader()).default;
  if (
    !chapter ||
    typeof chapter.id !== 'string' ||
    typeof chapter.scenes !== 'object' ||
    chapter.scenes === null
  ) {
    throw new Error(`Chapter ${id} has an invalid default export.`);
  }
  return chapter;
}
