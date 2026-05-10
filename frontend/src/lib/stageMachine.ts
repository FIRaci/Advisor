// AdVisor Stage State Machine
//
// Single source of truth for the user's progression through the four stages
// of an AdVisor campaign. The stage is *derived* from the campaign's
// quizData; this module also validates whether a transition is allowed and
// produces UI metadata (titles, descriptions, next-action prompts).
//
// Stages:
//   0 - Discovery       : user has not completed the initial quick quiz yet
//   1 - Strategy & Plan : quiz answered, AI has produced 3 plans, user picks one
//   2 - Refinement      : selected plan + phase 2 details answered
//   3 - Optimisation    : ongoing metrics tracking and AI-assisted iteration

export type Stage = 0 | 1 | 2 | 3;

export type Lang = 'en' | 'vi';

export interface QuizDataLike {
  selectedPlan?: string;
  phase?: string;
  // any answer keys (business, audience, goal, ...)
  [key: string]: unknown;
}

export interface StageDescriptor {
  stage: Stage;
  title: { en: string; vi: string };
  subtitle: { en: string; vi: string };
  nextAction: { en: string; vi: string };
}

export const STAGE_DESCRIPTORS: Record<Stage, StageDescriptor> = {
  0: {
    stage: 0,
    title: { en: 'Discovery', vi: 'Khám phá' },
    subtitle: {
      en: 'Tell AdVisor about your business so it can build a strategy that fits.',
      vi: 'Cung cấp thông tin doanh nghiệp để AdVisor xây dựng chiến lược phù hợp.'
    },
    nextAction: {
      en: 'Run the Quick Setup (5 questions) or open the Full Quiz to begin.',
      vi: 'Hoàn thành Quick Setup (5 câu) hoặc mở Quiz đầy đủ để bắt đầu.'
    }
  },
  1: {
    stage: 1,
    title: { en: 'Strategy & Plan', vi: 'Chiến lược & Kế hoạch' },
    subtitle: {
      en: 'Three tailored plans are ready. Compare them, then pick the one that fits.',
      vi: 'Ba kế hoạch đã được đề xuất. Hãy so sánh và chọn một kế hoạch phù hợp.'
    },
    nextAction: {
      en: 'Select Plan A, B, or C to advance to Stage 2.',
      vi: 'Chọn Plan A, B hoặc C để chuyển sang Giai đoạn 2.'
    }
  },
  2: {
    stage: 2,
    title: { en: 'Refinement', vi: 'Chi tiết hoá' },
    subtitle: {
      en: 'Lock down audience, KPIs, and budget split before launch.',
      vi: 'Chốt chi tiết đối tượng, KPI và phân bổ ngân sách trước khi triển khai.'
    },
    nextAction: {
      en: 'Answer the Stage 2 follow-up questions to fully refine the plan.',
      vi: 'Trả lời các câu hỏi Giai đoạn 2 để hoàn tất chi tiết kế hoạch.'
    }
  },
  3: {
    stage: 3,
    title: { en: 'Optimisation', vi: 'Tối ưu' },
    subtitle: {
      en: 'Submit periodic metrics. AdVisor will recommend adjustments each cycle.',
      vi: 'Nộp dữ liệu hiệu suất định kỳ để AdVisor đề xuất tinh chỉnh mỗi chu kỳ.'
    },
    nextAction: {
      en: 'Upload a CSV or fill in the metrics form, then ask for analysis.',
      vi: 'Tải CSV hoặc điền số liệu, sau đó yêu cầu AdVisor phân tích.'
    }
  }
};

/**
 * Derive the current stage from quizData. Validates internal consistency: a
 * campaign that claims phase = '3' but has no selectedPlan is treated as
 * Stage 0 (the user must restart). Use `inspectQuizData` to detect such cases
 * and surface a recovery banner.
 */
export function deriveStage(quizData?: QuizDataLike | null): Stage {
  if (!quizData) return 0;

  const phase = typeof quizData.phase === 'string' ? quizData.phase : undefined;
  const hasSelectedPlan = typeof quizData.selectedPlan === 'string' && quizData.selectedPlan.length > 0;
  const answerCount = Object.keys(quizData).filter(
    (k) => k !== 'phase' && k !== 'selectedPlan' && quizData[k] !== undefined && quizData[k] !== ''
  ).length;

  // Stage 3 requires phase=3 and selectedPlan
  if (phase === '3' && hasSelectedPlan) return 3;
  // Stage 2 requires phase=2 and selectedPlan
  if (phase === '2' && hasSelectedPlan) return 2;
  // Stage 1 means quiz answered (or selectedPlan present even without phase)
  if (hasSelectedPlan || answerCount > 0) return 1;
  return 0;
}

export interface QuizDataIssue {
  code: 'phase_without_plan' | 'phase_without_answers';
  current: Stage;
  message: { en: string; vi: string };
}

/**
 * Detect inconsistent quiz data states so the UI can offer recovery.
 */
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
      message: {
        en: 'Campaign data is inconsistent: a later stage is set without a selected plan. Reselect a plan to continue.',
        vi: 'Dữ liệu chiến dịch không nhất quán: giai đoạn sau đã được đặt nhưng chưa chọn plan. Hãy chọn lại plan để tiếp tục.'
      }
    };
  }

  if ((phase === '2' || phase === '3') && answerCount === 0) {
    return {
      code: 'phase_without_answers',
      current: deriveStage(quizData),
      message: {
        en: 'Campaign data is inconsistent: a later stage is set with no quiz answers. Restart the discovery quiz.',
        vi: 'Dữ liệu chiến dịch không nhất quán: giai đoạn sau đã đặt nhưng chưa có câu trả lời quiz. Hãy làm lại quiz khám phá.'
      }
    };
  }

  return null;
}

export interface AdvanceCheck {
  ok: boolean;
  reason?: { en: string; vi: string };
}

/**
 * Validate whether the user can move from `current` to `target`. Pure function
 * — never mutates state. The Chat page should call this before triggering any
 * stage transition and surface `reason` as an inline error when blocked.
 */
export function canAdvance(current: Stage, target: Stage, quizData?: QuizDataLike | null): AdvanceCheck {
  // Allow rollback to any earlier stage (handled by handleResetStage).
  if (target <= current) return { ok: true };

  // Cannot skip: must advance one step at a time.
  if (target !== current + 1) {
    return {
      ok: false,
      reason: {
        en: `You must complete Stage ${current + 1} before reaching Stage ${target}.`,
        vi: `Bạn phải hoàn thành Giai đoạn ${current + 1} trước khi tới Giai đoạn ${target}.`
      }
    };
  }

  const qd = quizData || {};
  const hasSelectedPlan = typeof qd.selectedPlan === 'string' && qd.selectedPlan.length > 0;
  const answerCount = Object.keys(qd).filter(
    (k) => k !== 'phase' && k !== 'selectedPlan' && qd[k] !== undefined && qd[k] !== ''
  ).length;

  if (target === 1) {
    if (answerCount === 0) {
      return {
        ok: false,
        reason: {
          en: 'Answer at least one quiz question before advancing to Stage 1.',
          vi: 'Trả lời ít nhất một câu quiz trước khi sang Giai đoạn 1.'
        }
      };
    }
  }

  if (target === 2) {
    if (!hasSelectedPlan) {
      return {
        ok: false,
        reason: {
          en: 'Select a plan (A, B, or C) before advancing to Stage 2.',
          vi: 'Chọn một plan (A, B hoặc C) trước khi sang Giai đoạn 2.'
        }
      };
    }
  }

  if (target === 3) {
    if (!hasSelectedPlan || qd.phase !== '2') {
      return {
        ok: false,
        reason: {
          en: 'Complete the Stage 2 follow-up questions before advancing to Stage 3.',
          vi: 'Hoàn thành các câu hỏi Giai đoạn 2 trước khi sang Giai đoạn 3.'
        }
      };
    }
  }

  return { ok: true };
}

export interface ContentPaneMode {
  enabled: boolean;
  placeholder: { en: string; vi: string };
  emptyTitle: { en: string; vi: string };
  emptyHint: { en: string; vi: string };
}

/**
 * Returns the per-stage configuration for the right-hand Content Assistant
 * pane. The pane is intentionally disabled until Stage 1 to keep the user
 * focused on the quiz first.
 */
export function getContentPaneMode(stage: Stage): ContentPaneMode {
  switch (stage) {
    case 0:
      return {
        enabled: false,
        placeholder: {
          en: 'Complete Stage 0 (Discovery) to unlock the Content Writer.',
          vi: 'Hoàn thành Giai đoạn 0 (Khám phá) để mở khoá Trợ lý Nội dung.'
        },
        emptyTitle: { en: 'Locked', vi: 'Đang khoá' },
        emptyHint: {
          en: 'Finish the quiz first; the Content Writer activates as soon as a plan is generated.',
          vi: 'Hoàn thành quiz trước; Trợ lý Nội dung sẽ kích hoạt khi đã có plan.'
        }
      };
    case 1:
      return {
        enabled: true,
        placeholder: {
          en: 'Try: "Draft a Facebook ad for the selected plan"',
          vi: 'Ví dụ: "Viết quảng cáo Facebook cho plan đã chọn"'
        },
        emptyTitle: { en: 'Draft your first ad copy', vi: 'Viết bài quảng cáo đầu tiên' },
        emptyHint: {
          en: 'Pick a plan in the left pane, then ask for headlines, ad copy, or social posts here.',
          vi: 'Chọn plan ở khung trái, rồi yêu cầu headlines, bài quảng cáo hoặc post mạng xã hội tại đây.'
        }
      };
    case 2:
      return {
        enabled: true,
        placeholder: {
          en: 'Try: "Write a landing page hero for the refined plan"',
          vi: 'Ví dụ: "Viết hero landing page cho plan đã chốt"'
        },
        emptyTitle: { en: 'Produce launch-ready content', vi: 'Tạo nội dung sẵn sàng triển khai' },
        emptyHint: {
          en: 'With the plan refined, generate emails, landing-page copy, and full ad sets ready to ship.',
          vi: 'Sau khi chốt chi tiết, tạo email, nội dung landing page và bộ quảng cáo sẵn để chạy.'
        }
      };
    case 3:
      return {
        enabled: true,
        placeholder: {
          en: 'Try: "Summarise this week\u2019s metrics for the team"',
          vi: 'Ví dụ: "Tóm tắt số liệu tuần này cho team"'
        },
        emptyTitle: { en: 'Iterate on what is working', vi: 'Tinh chỉnh dựa trên hiệu suất' },
        emptyHint: {
          en: 'Generate optimisation reports, retargeting copy, and creative refresh ideas based on the latest metrics.',
          vi: 'Tạo báo cáo tối ưu, nội dung retargeting và ý tưởng làm mới sáng tạo dựa trên số liệu mới nhất.'
        }
      };
  }
}

export function stageLabel(stage: Stage, lang: Lang): string {
  return STAGE_DESCRIPTORS[stage].title[lang];
}

export function stageSubtitle(stage: Stage, lang: Lang): string {
  return STAGE_DESCRIPTORS[stage].subtitle[lang];
}

export function stageNextAction(stage: Stage, lang: Lang): string {
  return STAGE_DESCRIPTORS[stage].nextAction[lang];
}
