// AdVisor Stage State Machine
//
// Single source of truth for the user's progression through the four stages
// of an AdVisor campaign. The stage is *derived* from the campaign's
// quizData; this module also validates whether a transition is allowed and
// produces UI metadata (titles, descriptions, next-action prompts).

export type Stage = 0 | 1 | 2 | 3;

export interface QuizDataLike {
  selectedPlan?: string;
  phase?: string;
  [key: string]: unknown;
}

export interface StageDescriptor {
  stage: Stage;
  title: string;
  subtitle: string;
  nextAction: string;
}

export const STAGE_DESCRIPTORS: Record<Stage, StageDescriptor> = {
  0: {
    stage: 0,
    title: 'Discovery',
    subtitle: 'Tell AdVisor about your business so it can build a strategy that fits.',
    nextAction: 'Complete the Discovery Quiz to unlock your Strategy options.'
  },
  1: {
    stage: 1,
    title: 'Strategy & Plan',
    subtitle: 'Review the AI-generated plans. Once you select a plan, you can move to Stage 2.',
    nextAction: 'Select a plan card (Plan A, B, C...) then click "Go to Stage 2" to continue.'
  },
  2: {
    stage: 2,
    title: 'Refinement',
    subtitle: 'Define your audience, KPIs, and budget. AI will confirm once everything is locked.',
    nextAction: 'Complete the follow-up questions from AI, then click the "Go to Stage 3" prompt.'
  },
  3: {
    stage: 3,
    title: 'Optimisation',
    subtitle: 'Track performance and iterate. Upload metrics to get AI optimization advice.',
    nextAction: 'Add a Metrics Snapshot in the Insights panel to get periodic analysis.'
  }
};

export function deriveStage(quizData?: QuizDataLike | null): Stage {
  if (!quizData) return 0;

  const phase = typeof quizData.phase === 'string' ? quizData.phase : undefined;
  const hasSelectedPlan = typeof quizData.selectedPlan === 'string' && quizData.selectedPlan.length > 0;
  const answerCount = Object.keys(quizData).filter(
    (k) => k !== 'phase' && k !== 'selectedPlan' && quizData[k] !== undefined && quizData[k] !== ''
  ).length;

  if (phase === '3' && hasSelectedPlan) return 3;
  if (phase === '2' && hasSelectedPlan) return 2;
  // Backward compatibility: older campaigns may not have `phase` but still have quiz answers.
  if (answerCount > 0) return 1;
  if (hasSelectedPlan || phase === '1') return 1;
  return 0;
}

export interface QuizDataIssue {
  code: 'phase_without_plan' | 'phase_without_answers';
  current: Stage;
  message: string;
}

export function inspectQuizData(quizData?: QuizDataLike | null): QuizDataIssue | null {
  if (!quizData) return null;
  const phase = typeof quizData.phase === 'string' ? quizData.phase : undefined;
  const hasSelectedPlan = typeof quizData.selectedPlan === 'string' && quizData.selectedPlan.length > 0;
  const answerCount = Object.keys(quizData).filter(
    (k) => k !== 'phase' && k !== 'selectedPlan' && quizData[k] !== undefined && quizData[k] !== ''
  ).length;
  if ((phase === '2' || phase === '3') && !hasSelectedPlan) {
    return {
      code: 'phase_without_plan',
      current: deriveStage(quizData),
      message:
        'Campaign data is inconsistent: a later stage is set without a selected plan. Reselect a plan to continue.'
    };
  }

  if ((phase === '2' || phase === '3') && answerCount === 0) {
    return {
      code: 'phase_without_answers',
      current: deriveStage(quizData),
      message:
        'Campaign data is inconsistent: a later stage is set with no quiz answers. Restart the discovery quiz.'
    };
  }

  return null;
}

export interface AdvanceCheck {
  ok: boolean;
  reason?: string;
}

export function canAdvance(current: Stage, target: Stage, quizData?: QuizDataLike | null): AdvanceCheck {
  if (target <= current) return { ok: true };

  if (target !== current + 1) {
    return {
      ok: false,
      reason: `You must complete Stage ${current + 1} before reaching Stage ${target}.`
    };
  }

  const qd = quizData || {};
  const hasSelectedPlan = typeof qd.selectedPlan === 'string' && qd.selectedPlan.length > 0;

  if (target === 1) {
    if (qd.phase !== '1') {
      return {
        ok: false,
        reason: 'Complete the Discovery Quiz before advancing to Stage 1.'
      };
    }
  }

  if (target === 2) {
    if (!hasSelectedPlan) {
      return {
        ok: false,
        reason: 'Select a plan (A, B, or C) before advancing to Stage 2.'
      };
    }
  }

  if (target === 3) {
    if (!hasSelectedPlan || qd.phase !== '2') {
      return {
        ok: false,
        reason: 'Complete the Stage 2 follow-up questions before advancing to Stage 3.'
      };
    }
  }

  return { ok: true };
}

export interface ContentPaneMode {
  enabled: boolean;
  placeholder: string;
  emptyTitle: string;
  emptyHint: string;
}

export function getContentPaneMode(stage: Stage): ContentPaneMode {
  switch (stage) {
    case 0:
      return {
        enabled: false,
        placeholder: 'Complete Stage 0 (Discovery) to unlock the Content Writer.',
        emptyTitle: 'Locked',
        emptyHint:
          'Finish the quiz first; the Content Writer activates as soon as a plan is generated.'
      };
    case 1:
      return {
        enabled: true,
        placeholder: 'Try: "Draft a Facebook ad for the selected plan"',
        emptyTitle: 'Draft your first ad copy',
        emptyHint:
          'Pick a plan in the left pane, then ask for headlines, ad copy, or social posts here.'
      };
    case 2:
      return {
        enabled: true,
        placeholder: 'Try: "Write a landing page hero for the refined plan"',
        emptyTitle: 'Produce launch-ready content',
        emptyHint:
          'With the plan refined, generate emails, landing-page copy, and full ad sets ready to ship.'
      };
    case 3:
      return {
        enabled: true,
        placeholder: 'Try: "Summarise this week\u2019s metrics for the team"',
        emptyTitle: 'Iterate on what is working',
        emptyHint:
          'Generate optimisation reports, retargeting copy, and creative refresh ideas based on the latest metrics.'
      };
  }
}

export function stageLabel(stage: Stage): string {
  return STAGE_DESCRIPTORS[stage].title;
}

export function stageSubtitle(stage: Stage): string {
  return STAGE_DESCRIPTORS[stage].subtitle;
}

export function stageNextAction(stage: Stage): string {
  return STAGE_DESCRIPTORS[stage].nextAction;
}
