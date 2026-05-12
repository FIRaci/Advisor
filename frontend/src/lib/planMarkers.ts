/**
 * Parse [PLAN_X] … [/PLAN_X] blocks from assistant markdown.
 * Robust to stray markdown (e.g. "** [PLAN_A]"), inner spaces in brackets,
 * mixed-case ids, and tag letter spacing — cases that break simple RegExp pairs.
 */

export function normalizePlanContent(content: string): string {
  let s = content.replace(/[\u200B-\u200D\uFEFF]/g, '');
  // Strip emphasis immediately before plan tags ("** [PLAN_A]")
  s = s.replace(/\*{1,3}\s*(?=\[\s*\/?\s*PLAN\b)/gi, '');
  // "[PLAN A]" → canonical "[PLAN_A]"
  s = s.replace(/\[\s*(\/?)\s*PLAN\s+([A-Za-z0-9]+)\s*\]/gi, '[$1PLAN_$2]');
  return s;
}

const PLAN_BRACKET_RE = /\[\s*(\/?)\s*PLAN\s*[_\s]?\s*([A-Za-z0-9]+)\s*\]/gi;

export interface PlanBracketMatch {
  index: number;
  end: number;
  isClose: boolean;
  /** Uppercase canonical id */
  id: string;
}

export function scanPlanBrackets(normalized: string): PlanBracketMatch[] {
  const out: PlanBracketMatch[] = [];
  PLAN_BRACKET_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PLAN_BRACKET_RE.exec(normalized))) {
    const isClose = m[1] === '/';
    const id = m[2].toUpperCase();
    out.push({
      index: m.index,
      end: m.index + m[0].length,
      isClose,
      id,
    });
  }
  return out;
}

export function extractPlanBlocks(normalized: string): { id: string; content: string }[] {
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

/** Raw assistant message → up to six plan bodies (ids A/B/C…) for selection cards */
export function parsePlanOptions(content: string): { id: string; content: string }[] {
  return extractPlanBlocks(normalizePlanContent(content));
}

const FIRST_OPEN_PLAN = /\[\s*PLAN\s*[_\s]?\s*[A-Za-z0-9]+\s*\]/i;

/** Intro-only markdown: everything before the first plan open tag, with helper markers stripped. */
export function cleanStrategyIntroMarkdown(content: string): string {
  const normalized = normalizePlanContent(content);
  const planStart = normalized.search(FIRST_OPEN_PLAN);
  const base = planStart >= 0 ? normalized.slice(0, planStart) : normalized;
  return base
    .replace(/\*\*\[PLAN_OPTIONS\]\*\*/gi, '')
    .replace(/\[PLAN_OPTIONS\]/gi, '')
    .replace(/\[\/PLAN_OPTIONS\]/gi, '')
    .replace(/\*\*\[STAGE_TRANSITION\]\*\*/gi, '')
    .replace(/\[STAGE_TRANSITION\]/gi, '')
    .replace(/^\s*\*\*\s*$/gm, '')
    .replace(/\[\s*\/?\s*PLAN\s*[_\s]?\s*[A-Za-z0-9]+\s*\]/gi, '')
    .trim();
}
