import glossaryData from '../data/marketingGlossary.json';

export type GlossaryGroup = 'cost' | 'engagement' | 'lifecycle' | 'tools';

export interface GlossaryEntry {
  id: string;
  term: string;
  name: { en: string; vi: string };
  definition: { en: string; vi: string };
  group: GlossaryGroup;
  aliases?: string[];
}

const entries: GlossaryEntry[] = glossaryData as GlossaryEntry[];

const normalizeText = (value: string) => value.toLowerCase();

const wordBoundaryRegex = (term: string) => {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
};

export const glossaryEntries = entries;

export const glossaryGroups: { id: GlossaryGroup; label: { en: string; vi: string } }[] = [
  { id: 'cost', label: { en: 'Cost & Budget', vi: 'Chi phi & Ngan sach' } },
  { id: 'engagement', label: { en: 'Engagement & Experience', vi: 'Tuong tac & Trai nghiem' } },
  { id: 'lifecycle', label: { en: 'Lifecycle Value', vi: 'Gia tri vong doi' } },
  { id: 'tools', label: { en: 'Marketing Concepts', vi: 'Khung & Khai niem' } }
];

export function getGlossaryByGroup(group: GlossaryGroup): GlossaryEntry[] {
  return entries.filter((entry) => entry.group === group);
}

export function findGlossaryMatches(text: string, max = 6): GlossaryEntry[] {
  if (!text) return [];
  const normalized = normalizeText(text);
  const matches: GlossaryEntry[] = [];

  for (const entry of entries) {
    const terms = [entry.term, entry.name.en, entry.name.vi, ...(entry.aliases || [])];
    if (terms.some((term) => normalized.includes(normalizeText(term)) || wordBoundaryRegex(term).test(text))) {
      matches.push(entry);
    }

    if (matches.length >= max) {
      break;
    }
  }

  return matches;
}

export function summarizeGlossary(entriesToSummarize: GlossaryEntry[], lang: 'en' | 'vi') {
  return entriesToSummarize.map((entry) => ({
    term: entry.term,
    name: entry.name[lang],
    definition: entry.definition[lang]
  }));
}
