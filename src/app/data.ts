import generatedCitationLabels from '../generated/citation-labels.json';
import type { ChapterCues, Grade, NarrationChapter } from '../engine/types';
import type { TerminalScript } from '../kit';

export interface EvidenceClaim {
  id: string;
  text: string | Record<string, string>;
  resolved?: Record<string, string>;
  citations: string[];
  grades: Grade[];
  min_grade: Grade;
  flags: string[];
}
export interface EvidenceSource {
  key: string; title: string; authors: string; venue: string | null; year: number | string | null;
  grade: Grade | null; gradeNote?: string; urls: string[]; accessed?: string;
}
export interface EvidenceData {
  claims: Record<string, EvidenceClaim>;
  sources: Record<string, EvidenceSource>;
}
export interface AtlasFeature {
  id: string; name: string;
  group: 'Editing & code intelligence' | 'Search & reading' | 'Execution & automation' | 'Context & memory' | 'Sessions & planning' | 'Multi-agent' | 'Extensibility' | 'Providers & models' | 'Safety & settings' | 'Interface';
  purpose: string; howToInvoke: string;
  default: 'on' | 'off' | 'conditional'; defaultDetail: string; prerequisites?: string;
  docs: string[]; claims: string[]; sources: string[]; narratedIn?: string; demo?: TerminalScript;
}

const chapterFiles = import.meta.glob<NarrationChapter>('../../narration/ch[0-9][0-9]-*.json', { eager: true, import: 'default' });
const cueFiles = import.meta.glob<ChapterCues>('../generated/cues/ch[0-9][0-9].json', { eager: true, import: 'default' });
export const chapters = Object.values(chapterFiles).sort((a, b) => a.id.localeCompare(b.id));
export const cues = new Map(Object.values(cueFiles).map(cue => [cue.chapter, cue]));
export const gradeLabels: Record<Grade, string> = {
  A: 'Peer-reviewed', B: 'Preprint / tech report', C: 'First-party', D: 'Secondary', E: 'Anecdotal',
};

export const citationLabels: {
  claims: Record<string, { label: string; description: string }>;
  sources: Record<string, { label: string; description: string }>;
} = generatedCitationLabels;

let evidencePromise: Promise<EvidenceData> | undefined;

export function loadEvidence(): Promise<EvidenceData> {
  return evidencePromise ??= import('../generated/evidence.json').then(module => module.default as EvidenceData);
}

export function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}
