/**
 * Parse [PLAN_X] … [/PLAN_X] blocks from assistant markdown.
 * Robust to stray markdown, Unicode brackets, case variants, inner spaces,
 * and monolithic blobs where one “plan” body still contains the next [PLAN_*] opener.
 */

const PLAN_TAG =
  /\[\s*(\/?)\s*plan\s*[_\s\-\u2013\u2014]?\s*([a-z0-9]+)\s*\]/gi;

/** First *opening* plan tag only (must not match `[/PLAN_A]`). */
const FIRST_OPEN_PLAN = /\[\s*(?!\/)\s*plan\s*[_\s\-\u2013\u2014]?\s*[a-z0-9]+\s*\]/i;

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
  // Strip emphasis immediately before any plan tag ("** [PLAN_A]", "**[/PLAN_A]")
  s = s.replace(/\*{1,3}\s*(?=\[\s*\/?\s*plan\b)/gi, '');
  // "[PLAN A]" → "[PLAN_A]" (space-separated id)
  s = s.replace(/\[\s*(\/?)\s*plan\s+([a-z0-9]+)\s*\]/gi, '[$1PLAN_$2]');
  return s;
}

export interface PlanBracketMatch {
  index: number;
  end: number;
  isClose: boolean;
  /** Uppercase canonical id */
  id: string;
}

export function scanPlanBrackets(normalized: string): PlanBracketMatch[] {
  const out: PlanBracketMatch[] = [];
  PLAN_TAG.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PLAN_TAG.exec(normalized))) {
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

/** True if body still contains another opening plan tag (parser merge bug or malformed AI). */
function hasEmbeddedPlanOpen(body: string): boolean {
  return /\[\s*(?!\/)\s*plan\s*[_\s\-\u2013\u2014]?\s*[a-z0-9]+\s*\]/i.test(body);
}

/**
 * If the model dumped multiple plans into one body, re-parse inner text so each card stays clean.
 */
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

/** Remove any leftover plan markers so ReactMarkdown never shows raw tags. */
export function stripPlanTagResiduals(text: string): string {
  if (!text) return text;
  return text
    .replace(/\[\s*\/?\s*plan\s*[_\s\-\u2013\u2014]?\s*[a-z0-9]+\s*\]/gi, '')
    .replace(/\*{1,3}\s*$/gm, '')
    .trim();
}

/** Raw assistant message → up to six plan bodies (ids A/B/C…) for selection cards */
export function parsePlanOptions(content: string): { id: string; content: string }[] {
  const normalized = normalizePlanContent(content);
  let plans = extractPlanBlocks(normalized);
  plans = rescueMonolithicPlans(plans);
  return plans.map((p) => ({ ...p, content: stripPlanTagResiduals(p.content) })).slice(0, 6);
}

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
    .replace(/\[\s*\/?\s*plan\s*[_\s\-\u2013\u2014]?\s*[a-z0-9]+\s*\]/gi, '')
    .trim();
}
