import { create } from 'zustand';
import { Campaign as ApiCampaign, ChatMessage, MetricsSnapshot, QuizProgress } from '../hooks/useApi';

export type Message = ChatMessage;

export interface Campaign extends Pick<ApiCampaign, 'id' | 'name' | 'createdAt' | 'isFavorite'> {
  status?: ApiCampaign['status'];
  updatedAt?: string;
  quizData?: Record<string, string>;
  quizProgress?: QuizProgress;
  strategy?: Record<string, unknown>;
}

interface ChatState {
  // ── Core Data ──────────────────────────────────────────────────────
  messages: Message[];
  campaigns: Campaign[];
  currentCampaign: Campaign | null;
  loading: boolean;
  initialLoading: boolean;
  metricsSnapshots: MetricsSnapshot[];

  // ── Pane / Layout UI State ─────────────────────────────────────────
  /** Width of the strategy (left) pane as a percentage of the dual-pane container */
  strategyWidth: number;
  /** Whether the content writer pane is collapsed */
  contentPaneCollapsed: boolean;
  /** Whether the user is actively dragging the pane divider */
  isDraggingPane: boolean;

  // ── Content Writer State ───────────────────────────────────────────
  /** True while an AI content-assist request is in-flight */
  assistLoading: boolean;
  /** Current value of the content writer textarea */
  contentInput: string;
  /** Active tactics (content types) selected for the content writer */
  activeTactics: string[];

  // ── Metrics / Insights State ───────────────────────────────────────
  metricsInputs: Record<string, string>;
  metricsPeriodStart: string;
  metricsPeriodEnd: string;
  metricsLabel: string;

  // ── Inline Quiz Edit State ─────────────────────────────────────────
  editingQuizField: string | null;
  editingQuizValue: string;

  // ── Actions ────────────────────────────────────────────────────────
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setCampaigns: (campaigns: Campaign[] | ((prev: Campaign[]) => Campaign[])) => void;
  setCurrentCampaign: (campaign: Campaign | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialLoading: (loading: boolean) => void;
  setMetricsSnapshots: (snapshots: MetricsSnapshot[] | ((prev: MetricsSnapshot[]) => MetricsSnapshot[])) => void;

  setStrategyWidth: (width: number) => void;
  setContentPaneCollapsed: (collapsed: boolean) => void;
  setIsDraggingPane: (dragging: boolean) => void;

  setAssistLoading: (loading: boolean) => void;
  setContentInput: (input: string) => void;
  setActiveTactics: (tactics: string[] | ((prev: string[]) => string[])) => void;

  setMetricsInputs: (inputs: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  setMetricsPeriodStart: (date: string) => void;
  setMetricsPeriodEnd: (date: string) => void;
  setMetricsLabel: (label: string) => void;

  setEditingQuizField: (field: string | null) => void;
  setEditingQuizValue: (value: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  // Core Data
  messages: [],
  campaigns: [],
  currentCampaign: null,
  loading: false,
  initialLoading: true,
  metricsSnapshots: [],

  // Pane / Layout
  strategyWidth: 60,
  contentPaneCollapsed: false,
  isDraggingPane: false,

  // Content Writer
  assistLoading: false,
  contentInput: '',
  activeTactics: [],

  // Metrics / Insights
  metricsInputs: {},
  metricsPeriodStart: '',
  metricsPeriodEnd: '',
  metricsLabel: '',

  // Inline Quiz Edit
  editingQuizField: null,
  editingQuizValue: '',

  // ── Setters ──────────────────────────────────────────────────────
  setMessages: (updater) =>
    set((state) => ({
      messages: typeof updater === 'function' ? updater(state.messages) : updater,
    })),
  setCampaigns: (updater) =>
    set((state) => ({
      campaigns: typeof updater === 'function' ? updater(state.campaigns) : updater,
    })),
  setCurrentCampaign: (campaign) => set({ currentCampaign: campaign }),
  setLoading: (loading) => set({ loading }),
  setInitialLoading: (initialLoading) => set({ initialLoading }),
  setMetricsSnapshots: (updater) =>
    set((state) => ({
      metricsSnapshots: typeof updater === 'function' ? updater(state.metricsSnapshots) : updater,
    })),

  setStrategyWidth: (strategyWidth) => set({ strategyWidth }),
  setContentPaneCollapsed: (contentPaneCollapsed) => set({ contentPaneCollapsed }),
  setIsDraggingPane: (isDraggingPane) => set({ isDraggingPane }),

  setAssistLoading: (assistLoading) => set({ assistLoading }),
  setContentInput: (contentInput) => set({ contentInput }),
  setActiveTactics: (updater) =>
    set((state) => ({
      activeTactics: typeof updater === 'function' ? updater(state.activeTactics) : updater,
    })),

  setMetricsInputs: (updater) =>
    set((state) => ({
      metricsInputs: typeof updater === 'function' ? updater(state.metricsInputs) : updater,
    })),
  setMetricsPeriodStart: (metricsPeriodStart) => set({ metricsPeriodStart }),
  setMetricsPeriodEnd: (metricsPeriodEnd) => set({ metricsPeriodEnd }),
  setMetricsLabel: (metricsLabel) => set({ metricsLabel }),

  setEditingQuizField: (editingQuizField) => set({ editingQuizField }),
  setEditingQuizValue: (editingQuizValue) => set({ editingQuizValue }),
}));
