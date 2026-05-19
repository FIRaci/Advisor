/**
 * Plan Marker Parser and Normalization Utilities for AdVisor Marketing Platform.
 * 
 * Provides robust regex scanning, Unicode normalization, and block reconstruction
 * to ensure that marketing strategies contain the expected markers (e.g., [PLAN_A/B/C])
 * and stage transitions (e.g., [STAGE_TRANSITION]) aligned with frontend rendering rules.
 */

/** Keeps parsing rules aligned with frontend `src/lib/planMarkers.ts`. */
const PLAN_TAG_BACKEND = /\[\s*(\/?)\s*plan\s*[_\s\-\u2013\u2014]?\s*([a-z0-9]+)\s*\]/gi;

function toAsciiBrackets(s: string): string {
  return s
    .replace(/\uFF3B/g, '[')
    .replace(/\uFF3D/g, ']')
    .replace(/\u3010/g, '[')
    .replace(/\u3011/g, ']');
}

export function normalizePlanContent(content: string): string {
  let s = content.replace(/[\u200B-\u200D\uFEFF]/g, '');
  try {
    s = s.normalize('NFKC');
  } catch {
    /* ignore */
  }
  s = toAsciiBrackets(s);
  s = s.replace(/\*{1,3}\s*(?=\[\s*\/?\s*plan\b)/gi, '');
  s = s.replace(/\[\s*(\/?)\s*plan\s+([a-z0-9]+)\s*\]/gi, '[$1PLAN_$2]');
  return s;
}

type PlanBracketMatch = {
  index: number;
  end: number;
  isClose: boolean;
  id: string;
};

function scanPlanBrackets(normalized: string): PlanBracketMatch[] {
  const out: PlanBracketMatch[] = [];
  PLAN_TAG_BACKEND.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PLAN_TAG_BACKEND.exec(normalized))) {
    const isClose = m[1] === '/';
    const id = m[2].toUpperCase();
    out.push({ index: m.index, end: m.index + m[0].length, isClose, id });
  }
  return out;
}

function extractPlanBlocks(normalized: string): { id: string; content: string }[] {
  const tags = scanPlanBrackets(normalized);
  const plans: { id: string; content: string }[] = [];
  const seen = new Set<string>();

  let i = 0;
  while (i < tags.length) {
    const open = tags[i];
    i += 1;
    if (open.isClose) continue;
    if (seen.has(open.id)) continue;

    let closeIdx = -1;
    for (let j = i; j < tags.length; j += 1) {
      if (tags[j].isClose && tags[j].id === open.id) {
        closeIdx = j;
        break;
      }
    }

    let body: string;
    if (closeIdx >= 0) {
      body = normalized.slice(open.end, tags[closeIdx].index).trim();
      i = closeIdx + 1;
    } else {
      let nextOpenIdx = -1;
      for (let j = i; j < tags.length; j += 1) {
        if (!tags[j].isClose) {
          nextOpenIdx = j;
          break;
        }
      }
      if (nextOpenIdx >= 0) {
        body = normalized.slice(open.end, tags[nextOpenIdx].index).trim();
        i = nextOpenIdx;
      } else {
        body = normalized.slice(open.end).trim();
        i = tags.length;
      }
    }

    if (!body) continue;
    seen.add(open.id);
    plans.push({ id: open.id, content: body });
  }

  return plans.slice(0, 6);
}

function hasEmbeddedPlanOpen(body: string): boolean {
  return /\[\s*(?!\/)\s*plan\s*[_\s\-\u2013\u2014]?\s*[a-z0-9]+\s*\]/i.test(body);
}

function stripPlanTagResiduals(text: string): string {
  if (!text) return text;
  return text
    .replace(/\[\s*\/?\s*plan\s*[_\s\-\u2013\u2014]?\s*[a-z0-9]+\s*\]/gi, '')
    .replace(/\*{1,3}\s*$/gm, '')
    .trim();
}

function rescueMonolithicPlans(plans: { id: string; content: string }[]): { id: string; content: string }[] {
  if (plans.length !== 1) return plans;
  const only = plans[0];
  if (!hasEmbeddedPlanOpen(only.content)) return plans;

  const innerNorm = normalizePlanContent(only.content);
  const inner = extractPlanBlocks(innerNorm);
  if (inner.length < 2) return plans;

  const firstOpen = only.content.search(/\[\s*(?!\/)\s*plan\b/i);
  const lead = firstOpen >= 0 ? only.content.slice(0, firstOpen).trim() : '';
  if (lead) {
    const hasA = inner.some((p) => p.id === 'A');
    if (!hasA) {
      return [{ id: 'A', content: stripPlanTagResiduals(lead) }, ...inner];
    }
    return [{ ...inner[0], content: `${lead}\n\n${inner[0].content}`.trim() }, ...inner.slice(1)];
  }
  return inner;
}

export function countPlanBlocks(content: string): number {
  const normalized = normalizePlanContent(content);
  let plans = extractPlanBlocks(normalized);
  plans = rescueMonolithicPlans(plans);
  return plans.length;
}

export function hasPlanTags(content: string): boolean {
  return scanPlanBrackets(normalizePlanContent(content)).some((t) => !t.isClose);
}

const PLAN_OPTIONS_FALLBACK = [
  '**[PLAN_OPTIONS]**',
  '[PLAN_A]',
  '**Plan A: Growth Accelerator**',
  '- Focus: Rapid acquisition with paid channels',
  '- Budget mix: 70% Paid, 20% Content, 10% Email',
  '- Timeline: 3 months',
  '- Best for: Fast results',
  '[/PLAN_A]',
  '[PLAN_B]',
  '**Plan B: Organic Builder**',
  '- Focus: Content, community, and long-term trust',
  '- Budget mix: 30% Paid, 50% Content, 20% Community',
  '- Timeline: 6 months',
  '- Best for: Low-cost, steady growth',
  '[/PLAN_B]',
  '[PLAN_C]',
  '**Plan C: Hybrid Strategy**',
  '- Focus: Balanced paid and organic growth',
  '- Budget mix: 50% Paid, 30% Content, 20% Email/Community',
  '- Timeline: 4 months',
  '- Best for: Balanced risk and ROI',
  '[/PLAN_C]',
  '[/PLAN_OPTIONS]'
].join('\n');

export function appendPlanOptionsIfMissing(content: string): string {
  const normalized = normalizePlanContent(content);
  if (countPlanBlocks(normalized) >= 3) return normalized;
  const trimmed = normalized.trim();
  if (!trimmed) return PLAN_OPTIONS_FALLBACK;
  return `${trimmed}\n\n${PLAN_OPTIONS_FALLBACK}`;
}

export function detectStrategyKind(content: string): { kind: string | null; metadata: Record<string, unknown> | null } {
  if (content.includes('[PLAN_OPTIONS]') || countPlanBlocks(content) > 0 || hasPlanTags(content)) {
    return { kind: 'plan_options', metadata: null };
  }
  if (content.includes('[STAGE_TRANSITION]')) {
    return { kind: 'stage_transition', metadata: null };
  }
  return { kind: null, metadata: null };
}

export function buildAiFallbackResponse(): string {
  return [
    'Sorry, the AI service is temporarily unavailable so I could not generate a full response right now.',
    '',
    'You can continue by:',
    '- Retrying in a few seconds',
    '- Sending a shorter prompt (goal, budget, audience)',
    '- Asking for a starter campaign template to begin immediately'
  ].join('\n');
}
