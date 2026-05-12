import glossaryData from '../data/marketingGlossary.json';

export type GlossaryGroup = 'cost' | 'engagement' | 'lifecycle' | 'tools';

export interface GlossaryEntry {
  id: string;
  term: string;
  name: string;
  definition: string;
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

export const glossaryGroups: { id: GlossaryGroup; label: string }[] = [
  { id: 'cost', label: 'Cost & Budget' },
  { id: 'engagement', label: 'Engagement & Experience' },
  { id: 'lifecycle', label: 'Lifecycle Value' },
  { id: 'tools', label: 'Marketing Concepts' }
];

export function getGlossaryByGroup(group: GlossaryGroup): GlossaryEntry[] {
  return entries.filter((entry) => entry.group === group);
}

export function findGlossaryMatches(text: string, max = 6): GlossaryEntry[] {
  if (!text) return [];
  const normalized = normalizeText(text);
  const matches: GlossaryEntry[] = [];

  for (const entry of entries) {
    const terms = [entry.term, entry.name, ...(entry.aliases || [])];
    if (terms.some((term) => normalized.includes(normalizeText(term)) || wordBoundaryRegex(term).test(text))) {
      matches.push(entry);
    }

    if (matches.length >= max) {
      break;
    }
  }

  return matches;
}

export function summarizeGlossary(entriesToSummarize: GlossaryEntry[]) {
  return entriesToSummarize.map((entry) => ({
    term: entry.term,
    name: entry.name,
    definition: entry.definition
  }));
}
