import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send, Sparkles, Trash2, Plus, Minus, MessageSquare, ChevronLeft, ChevronRight,
  Settings, LogOut, MoreHorizontal, Pencil, Star, Copy, Check, ListChecks,
  BarChart3, BookOpen, Package, Building, Users, RefreshCw, Zap, ArrowRight, ArrowDown, ArrowUp, Award,
  Target, Megaphone, DollarSign, Globe, Clock, Briefcase, Plug, X, HelpCircle,
  Mail, FileText, Palette, Upload, TrendingUp, TrendingDown, Heart, Smartphone, ShoppingBag, CheckCircle2,
  Edit2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { api, Campaign as ApiCampaign, ChatMessage, MetricsSnapshot, QuizProgress } from '../hooks/useApi';
import ChatInput from '../components/ChatInput';
import { findGlossaryMatches, summarizeGlossary, glossaryGroups, getGlossaryByGroup } from '../utils/marketingGlossary';
import {
  type Stage,
  STAGE_DESCRIPTORS,
  deriveStage,
  inspectQuizData,
  canAdvance,
  getContentPaneMode
} from '../lib/stageMachine';
import { cleanStrategyIntroMarkdown as cleanContent, parsePlanOptions } from '../lib/planMarkers';
import {
  formatQuizAnswerForDisplay,
  QUIZ_ACTIVITY_FIELDS,
  quizActivityEventKind,
  quizActivityLogHandledKeys,
  quizActivityLogTitle,
  quizFieldActivityTitle,
  INSIGHT_QUIZ_HINTS
} from '../lib/quizDisplay';
import ClearChatModal from '../components/chat/modals/ClearChatModal';
import DeleteCampaignModal from '../components/chat/modals/DeleteCampaignModal';
import GuidePopupModal from '../components/chat/modals/GuidePopupModal';
import ConfirmationModal from '../components/chat/modals/ConfirmationModal';
import { formatMessageTime, classifyPane, getKpiStatus, formatMetricValue, computeMetricDelta, hasTargetKeywords, metricLabelWithHint, generateSmoothPath } from '../utils/chatHelpers';
import './Chat.css';
import EditQuizModal from '../components/EditQuizModal';

import BrandProfileModal from '../components/chat/modals/BrandProfileModal';
import IntegrationsModal from '../components/chat/modals/IntegrationsModal';
import Phase2QuizPopup from '../components/chat/modals/Phase2QuizPopup';
import GlossaryPanel from '../components/chat/modals/GlossaryPanel';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatHeader from '../components/chat/ChatHeader';

type Message = ChatMessage;

type MetricFieldDef = {
  key: string;
  label: string;
  hint: string;
};

const metricsFields: MetricFieldDef[] = [
  { key: 'cpc', label: 'CPC', hint: 'Cost Per Click' },
  { key: 'cpm', label: 'CPM', hint: 'Cost Per Mille (per 1k impressions)' },
  { key: 'cpa', label: 'CPA', hint: 'Cost Per Acquisition' },
  { key: 'cpl', label: 'CPL', hint: 'Cost Per Lead' },
  { key: 'cac', label: 'CAC', hint: 'Customer Acquisition Cost' },
  { key: 'ltv', label: 'LTV', hint: 'Lifetime Value' },
  { key: 'retentionRate', label: 'Retention Rate', hint: 'Share of customers retained' },
  { key: 'churnRate', label: 'Churn Rate', hint: 'Share of customers lost' },
  { key: 'engagementRate', label: 'Engagement Rate', hint: 'Interactions vs impressions' },
  { key: 'bounceRate', label: 'Bounce Rate', hint: 'Single-page sessions / entries' },
  { key: 'sessionDuration', label: 'Session Duration', hint: 'Average time on site (sec)' },
  { key: 'roas', label: 'ROAS', hint: 'Return on Ad Spend' }
];




interface Campaign extends Pick<ApiCampaign, 'id' | 'name' | 'createdAt' | 'isFavorite'> {
  status?: ApiCampaign['status'];
  updatedAt?: string;
  quizData?: Record<string, string>;
  quizProgress?: QuizProgress;
  strategy?: Record<string, unknown>;
}



interface Phase2Question {
  id: string;
  icon: any;
  question: string;
  type: 'select' | 'text';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

const phase2Questions: Phase2Question[] = [
  {
    id: 'channels',
    icon: Globe,
    question: 'Which channels to focus on?',
    type: 'select' as const,
    options: [
      { value: 'social', label: 'Social Media' },
      { value: 'search', label: 'Search (SEO/SEM)' },
      { value: 'email', label: 'Email Marketing' },
      { value: 'offline', label: 'Offline / OOH' }
    ]
  },
  {
    id: 'deadline',
    icon: Clock,
    question: 'What is your target deadline for this stage?',
    type: 'text' as const,
    placeholder: 'Example: End of Q3, 2026-09-30, in 8 weeks'
  },
  {
    id: 'budget_alloc',
    icon: DollarSign,
    question: 'Primary budget allocation?',
    type: 'select' as const,
    options: [
      { value: 'ads', label: 'Paid Ads' },
      { value: 'content', label: 'Content Production' },
      { value: 'influencer', label: 'Influencer Booking' }
    ]
  },
  {
    id: 'target_ctr',
    icon: TrendingUp,
    question: 'Target CTR (%) you want to reach?',
    type: 'text' as const,
    placeholder: 'Example: 2.5'
  },
  {
    id: 'target_cvr',
    icon: Target,
    question: 'Target Conversion Rate (%)?',
    type: 'text' as const,
    placeholder: 'Example: 4.0'
  },
  {
    id: 'target_roas',
    icon: BarChart3,
    question: 'Target ROAS?',
    type: 'text' as const,
    placeholder: 'Example: 3.5'
  },
  {
    id: 'timeline',
    icon: Clock,
    question: 'Expected campaign duration?',
    type: 'select' as const,
    options: [
      { value: 'short', label: '1-3 months' },
      { value: 'medium', label: '3-6 months' },
      { value: 'long', label: '6+ months' }
    ]
  }
];


import { useLocalChatState } from '../hooks/useLocalChatState';
export default function Chat() {
  const {
    sidebarOpen,
    setSidebarOpen,
    sidebarPanelWidth,
    setSidebarPanelWidth,
    userMenuOpen,
    setUserMenuOpen,
    editingCampaignId,
    setEditingCampaignId,
    editingName,
    setEditingName,
    activeCampaignMenu,
    setActiveCampaignMenu,
    clearModalOpen,
    setClearModalOpen,
    brandProfileModalOpen,
    setBrandProfileModalOpen,
    integrationsModalOpen,
    setIntegrationsModalOpen,
    deleteModalOpen,
    setDeleteModalOpen,
    deletingCampaignId,
    setDeletingCampaignId,
    copiedId,
    setCopiedId,
    insightsOpen,
    setInsightsOpen,
    insightSections,
    setInsightSections,
    guidePopupOpen,
    setGuidePopupOpen,
    guideActiveTab,
    setGuideActiveTab,
    selectedPlanInChat,
    setSelectedPlanInChat,
    newTactic,
    setNewTactic,
    editQuizModalOpen,
    setEditQuizModalOpen,
    isStageBannerHidden,
    setIsStageBannerHidden,
    showAnalystScrollDown,
    setShowAnalystScrollDown,
    showContentScrollDown,
    setShowContentScrollDown,
    showSidebarBackToTop,
    setShowSidebarBackToTop,
    showInsightsBackToTop,
    setShowInsightsBackToTop,
    showConfirmModal,
    setShowConfirmModal,
    showTacticsDropdown,
    setShowTacticsDropdown,
    glossaryOpen,
    setGlossaryOpen,
    phase2PopupOpen,
    setPhase2PopupOpen,
    phase2Step,
    setPhase2Step,
    phase2CustomOpen,
    setPhase2CustomOpen,
    phase2CustomInput,
    setPhase2CustomInput,
    phase2TextInput,
    setPhase2TextInput
  } = useLocalChatState();

  const { campaignId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const {
    messages, setMessages,
    campaigns, setCampaigns,
    currentCampaign, setCurrentCampaign,
    loading, setLoading,
    initialLoading, setInitialLoading,
    metricsSnapshots, setMetricsSnapshots,
    contentPaneCollapsed, setContentPaneCollapsed,
    strategyWidth, setStrategyWidth,
    isDraggingPane, setIsDraggingPane,
    assistLoading, setAssistLoading,
    contentInput, setContentInput,
    activeTactics, setActiveTactics,
    metricsInputs, setMetricsInputs,
    metricsPeriodStart, setMetricsPeriodStart,
    metricsPeriodEnd, setMetricsPeriodEnd,
    metricsLabel, setMetricsLabel,
    editingQuizField, setEditingQuizField,
    editingQuizValue, setEditingQuizValue
  } = useChatStore();
  // ���� Local-only UI state (not shared, stays in Chat component) ����
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contentMessagesEndRef = useRef<HTMLDivElement>(null);
  const analystScrollContainerRef = useRef<HTMLDivElement>(null);
  const contentScrollContainerRef = useRef<HTMLDivElement>(null);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const insightsScrollRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autostartTriggeredRef = useRef(false);

const TACTIC_SUGGESTIONS = [
  "Social Media Post (Facebook/Insta)",
  "Short Video Script (TikTok/Reels)",
  "Long Form Video (YouTube)",
  "Email Newsletter",
  "Blog Post (SEO)",
  "Advertising Copy (Google/Meta)",
  "Landing Page Copy",
  "Product Description"
];
  const [phase2Answers, setPhase2Answers] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!phase2PopupOpen) return;
    setPhase2TextInput('');
  }, [phase2Step, phase2PopupOpen]);

  const glossaryMatches = useMemo(() => {
    if (!currentCampaign) return [];
    const quizContext = Object.values(currentCampaign.quizData || {}).join(' ');
    const recentMessages = messages
      .slice(-24)
      .map((m) => m.content)
      .join(' ');
    return findGlossaryMatches(`${quizContext} ${recentMessages}`);
  }, [currentCampaign, messages]);

  // Re-derive stage (0 = Needs Quiz, 1 = Plan Selection, 2 = Execution)Data using the shared state-machine helper.
  // The helper validates internal consistency (e.g. phase=2 with no selectedPlan
  // is treated as Stage 0) so the UI never silently renders an invalid state.
  const currentStage = useMemo<Stage>(
    () => deriveStage(currentCampaign?.quizData),
    [currentCampaign]
  );

  // Detect inconsistent campaign state so we can surface a recovery banner.
  const quizDataIssue = useMemo(
    () => inspectQuizData(currentCampaign?.quizData),
    [currentCampaign]
  );

  const stageDescriptor = STAGE_DESCRIPTORS[currentStage];
  const contentPaneMode = useMemo(() => getContentPaneMode(currentStage), [currentStage]);

  // Check if content has stage transition marker
  const hasStageTransition = (content: string) => content.includes('[STAGE_TRANSITION]');

  const CampaignProfileCard = () => {
    if (!currentCampaign?.quizData || Object.keys(currentCampaign.quizData).length === 0) return null;
    const profile = fullQuizProfile.slice(0, 12);
    if (profile.length === 0) return null;

    return (
      <motion.div 
        className="campaign-profile-card"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="profile-card-header">
          <Sparkles size={16} className="text-accent" />
          <h3>{'Campaign Discovery Profile'}</h3>
        </div>
        <motion.div 
          className="profile-grid"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          initial="hidden"
          animate="show"
        >
          {profile.map((item, idx) => (
            <motion.div 
              key={idx} 
              className="profile-item"
              variants={{
                hidden: { opacity: 0, scale: 0.9, y: 10 },
                show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
              }}
              whileHover={{ y: -2, backgroundColor: 'rgba(255,255,255,0.08)' }}
            >
              <span className="profile-icon">{item.icon}</span>
              <div className="profile-info">
                <span className="profile-label">{item.label}</span>
                <span className="profile-value">{item.value}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    );
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      setActiveCampaignMenu(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingPane) return;
      const container = document.querySelector('.chat-dual-pane-container') as HTMLElement;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        setStrategyWidth(Math.min(Math.max(newWidth, 30), 70));
      }
    };
    const handleMouseUp = () => setIsDraggingPane(false);

    if (isDraggingPane) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPane]);

  useEffect(() => {
    document.documentElement.classList.add('chat-page-active');
    document.body.classList.add('chat-page-active');

    return () => {
      document.documentElement.classList.remove('chat-page-active');
      document.body.classList.remove('chat-page-active');
      // Force reset styles immediately for SPA navigation to other pages (e.g. Quiz)
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (Object.keys(metricsInputs).length > 0) {
      return;
    }

    const initialMetrics: Record<string, string> = {};
    metricsFields.forEach((field) => {
      initialMetrics[field.key] = '';
    });
    setMetricsInputs(initialMetrics);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const today = now.toISOString().slice(0, 10);
    setMetricsPeriodStart(startOfMonth);
    setMetricsPeriodEnd(today);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchCampaigns();
    fetchHistory();
    if (campaignId) {
      fetchCurrentCampaign();
      fetchMetricsSnapshots();
    } else {
      setCurrentCampaign(null);
      setMetricsSnapshots([]);
    }
  }, [campaignId, navigate]);

  // Auto-scroll analyst chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, assistLoading, initialLoading]);

  // Auto-scroll content writer chat
  useEffect(() => {
    contentMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, assistLoading]);

  const handlePaneScroll = (
    e: React.UIEvent<HTMLDivElement>,
    setShowScrollDown: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    const target = e.target as HTMLDivElement;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 150;
    setShowScrollDown(!isNearBottom);
  };

  const scrollToBottom = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollToTopVisible = (
    e: React.UIEvent<HTMLDivElement>,
    setShowBackToTop: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    const target = e.target as HTMLDivElement;
    setShowBackToTop(target.scrollTop > 200);
  };

  const scrollToTop = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (searchParams.get('autostart') === 'true' && !autostartTriggeredRef.current && messages.length === 0 && !loading && !initialLoading) {
      autostartTriggeredRef.current = true;
      generateInitialStrategy();
    }
  }, [searchParams, initialLoading, messages.length]);

  // Auto-show the guide popup on the user's very first visit. The persist
  // effect must NOT run before the auto-show effect has had a chance to read
  // the flag, otherwise it writes "seen" on every fresh mount (because
  // guidePopupOpen defaults to false) and the modal never auto-opens. We gate
  // the persist with a ref that flips only after we have actually shown the
  // modal at least once in this session.
  const guideHasOpenedOnceRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (initialLoading) return;
    try {
      const seen = window.localStorage.getItem('advisor.guide.seen');
      if (!seen) {
        guideHasOpenedOnceRef.current = true;
        setGuidePopupOpen(true);
      } else {
        // Already seen on a prior visit; treat the modal as having been shown
        // so a manual close in this session still persists the flag.
        guideHasOpenedOnceRef.current = true;
      }
    } catch {
      // localStorage may be unavailable (private mode); fail silently.
    }
  }, [initialLoading]);

  // Persist the "seen" flag whenever the guide is dismissed via close button
  // or overlay click. Gated on the ref so we never write before auto-show ran.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!guideHasOpenedOnceRef.current) return;
    if (!guidePopupOpen) {
      try {
        window.localStorage.setItem('advisor.guide.seen', '1');
      } catch {
        // ignore
      }
    }
  }, [guidePopupOpen]);

  useEffect(() => {
    if (!sidebarOpen) setUserMenuOpen(false);
  }, [sidebarOpen]);

  const fetchCampaigns = async () => {
    const res = await api.getCampaigns();
    if (res.success && res.data) {
      setCampaigns(res.data);
    }
  };

  const fetchCurrentCampaign = async () => {
    if (!campaignId) return;
    const res = await api.getCampaign(campaignId);
    if (res.success && res.data) {
      setCurrentCampaign(res.data as Campaign);
    }
  };

  const fetchMetricsSnapshots = async () => {
    if (!campaignId) return;
    const res = await api.getMetricsSnapshots(campaignId, 12);
    if (res.success && res.data) {
      setMetricsSnapshots(res.data);
    }
  };

  const fetchHistory = async () => {
    if (!campaignId) {
      setMessages([]);
      setInitialLoading(false);
      return;
    }

    const res = await api.getChatHistory(campaignId, 300);
    if (res.success && res.data) {
      setMessages(res.data);
    }
    setInitialLoading(false);
  };

  // Comparison state removal effect

  const appendAssistantMessage = (content: string) => {
    const generatedId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setMessages((prev) => [...prev, {
      id: generatedId,
      role: 'ASSISTANT',
      pane: 'STRATEGY',
      kind: null,
      metadata: null,
      content,
      createdAt: new Date().toISOString()
    }]);
  };

  // Insert a synthetic SYSTEM-pane message that records a stage transition.
  // The metadata stores the target stage and the direction (advance vs
  // rollback) so the activity log can render an unambiguous label.
  const appendSystemTransition = (
    toStage: Stage,
    direction: 'advance' | 'rollback' = 'advance'
  ) => {
    const generatedId = `system-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setMessages((prev) => [...prev, {
      id: generatedId,
      role: 'SYSTEM',
      pane: 'SYSTEM',
      kind: 'stage_transition',
      metadata: { toStage, direction },
      content: '',
      createdAt: new Date().toISOString()
    }]);
  };

  const getGenericAiErrorMessage = () =>
    'Sorry, I encountered an error. Please try again.';

  const buildCampaignNameFromMessage = (message: string) => {
    const normalized = message.trim().replace(/\s+/g, ' ');
    const short = normalized.slice(0, 72);

    if (short.length > 0) {
      return short;
    }

    const now = new Date();
    const month = now.toLocaleDateString('en-US', { month: 'short' });
    return `Campaign ${month} ${now.getDate()}`;
  };

  const ensureCampaignForMessage = async (message: string) => {
    if (campaignId) {
      return campaignId;
    }

    if (currentCampaign?.id) {
      return currentCampaign.id;
    }

    const createRes = await api.createCampaign({
      name: buildCampaignNameFromMessage(message)
    });

    if (!createRes.success || !createRes.data) {
      if (createRes.error === 'Session expired. Please log in again.') {
        navigate('/login');
      }
      return null;
    }

    const createdCampaign: Campaign = {
      id: createRes.data.id,
      name: createRes.data.name,
      createdAt: createRes.data.createdAt,
      isFavorite: createRes.data.isFavorite,
      status: createRes.data.status,
      quizData: createRes.data.quizData
    };

    setCampaigns((prev) => [createdCampaign, ...prev.filter((campaign) => campaign.id !== createdCampaign.id)]);
    setCurrentCampaign(createdCampaign);
    navigate(`/chat/${createdCampaign.id}`, { replace: true });

    return createdCampaign.id;
  };

  // Trigger the initial strategy generation. Used by the `autostart` query
  // param after the Full Quiz and as a recovery option when a campaign has
  // quizData but no AI response yet. Accepts an explicit campaign id so the
  // caller can use it before the URL has been updated.
  const generateInitialStrategy = async (targetCampaignId?: string) => {
    const effectiveCampaignId = targetCampaignId ?? campaignId;
    if (!effectiveCampaignId) return;

    setLoading(true);

    const initialPrompt =
      "Based on the quiz answers I provided, please create a comprehensive marketing strategy for my business. Include specific recommendations for channels, content, budget allocation, and timeline.";

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'USER',
      pane: 'STRATEGY',
      kind: null,
      metadata: null,
      content: initialPrompt,
      createdAt: new Date().toISOString()
    };

    setMessages([userMessage]);

    const glossaryMatches = findGlossaryMatches(
      `${initialPrompt} ${Object.values(currentCampaign?.quizData || {}).join(' ')}`,
      6
    );
    const glossaryContext = summarizeGlossary(glossaryMatches);
    const context = glossaryContext.length > 0 ? { glossary: glossaryContext } : undefined;

    const res = await api.sendMessage(initialPrompt, effectiveCampaignId, context);

    if (res.success && res.data) {
      const { userMessage: savedUser, assistantMessage } = res.data;
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== userMessage.id);
        return [...filtered, savedUser, assistantMessage];
      });
    } else {
      appendAssistantMessage(
        'Sorry, I encountered an error generating your strategy. Please try sending a message.'
      );
    }

    setLoading(false);
    if (searchParams.get('autostart') === 'true' || !campaignId) {
      navigate(`/chat/${effectiveCampaignId}`, { replace: true });
    }
  };

  const handleSend = async (messageText: string) => {
    const nextInput = messageText.trim();
    if (!nextInput || loading) return;
    const isStartingFromBlank = !campaignId && !currentCampaign?.id;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'USER',
      pane: 'STRATEGY',
      kind: null,
      metadata: null,
      content: nextInput,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    const targetCampaignId = await ensureCampaignForMessage(nextInput);
    if (!targetCampaignId) {
      if (!useAuthStore.getState().user) {
        setLoading(false);
        navigate('/login');
        return;
      }

      appendAssistantMessage(
        'Unable to initialize a new conversation. Please try again.'
      );
      setLoading(false);
      return;
    }

    const glossaryMatches = findGlossaryMatches(
      `${nextInput} ${Object.values(currentCampaign?.quizData || {}).join(' ')}`,
      6
    );
    const glossaryContext = summarizeGlossary(glossaryMatches);
    const context = glossaryContext.length > 0 ? { glossary: glossaryContext } : undefined;

    const res = await api.sendMessage(nextInput, targetCampaignId, context);

    if (res.success && res.data) {
      const { userMessage: savedUserMsg, assistantMessage } = res.data;

      setMessages((prev) => {
        const filtered = prev.filter(m => m.id !== userMessage.id);
        return [...filtered, savedUserMsg, assistantMessage];
      });

      if (isStartingFromBlank) {
        // Refresh campaign list to show the new one
        fetchCampaigns();
      }
    } else {
      appendAssistantMessage(getGenericAiErrorMessage());
    }

    setLoading(false);
  };

  const handleClear = async () => {
    if (!campaignId) {
      setMessages([]);
      setSelectedPlanInChat(null);
      setClearModalOpen(false);
      return;
    }

    const res = await api.clearChatHistory(campaignId);
    if (res.success) {
      setMessages([]);
      setSelectedPlanInChat(null);
      setClearModalOpen(false);
    }
  };


  const handleNewChat = () => {
    navigate('/chat');
  };

  const handleOpenFullQuiz = () => {
    const query = campaignId ? `?campaignId=${campaignId}` : '';
    navigate(`/quiz${query}`, { state: { from: campaignId ? `/chat/${campaignId}` : '/chat' } });
  };

  const handlePhase2Answer = async (value: string) => {
    const currentQ = phase2Questions[phase2Step];
    const newAnswers = { ...phase2Answers, [currentQ.id]: value };
    setPhase2Answers(newAnswers);

    if (phase2Step < phase2Questions.length - 1) {
      setTimeout(() => {
        setPhase2Step(phase2Step + 1);
      }, 200);
    } else {
      handlePhase2Complete(newAnswers);
    }
  };

  const handlePhase2SkipQuestion = () => {
    handlePhase2Answer('not_sure');
    setPhase2CustomOpen(false);
    setPhase2CustomInput('');
  };

  const handlePhase2CustomSubmit = () => {
    const value = phase2CustomInput.trim();
    if (!value) return;
    handlePhase2Answer(`custom: ${value}`);
    setPhase2CustomOpen(false);
    setPhase2CustomInput('');
  };

  const handlePhase2Complete = async (answers: Record<string, string>) => {
    setPhase2PopupOpen(false);
    if (!campaignId) return;

    const updatedQuizData = { ...currentCampaign?.quizData, ...answers, phase: '2' };
    const updateRes = await api.updateCampaign(campaignId, { quizData: updatedQuizData });
    if (!updateRes.success) {
      appendAssistantMessage(
        'We could not save your Stage 2 details. Please retry.'
      );
      return;
    }
    fetchCurrentCampaign();
    appendSystemTransition(2);

    const planText = Object.entries(answers)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    const messageContent = `I have selected my plan details: ${planText}. Let's proceed with execution and tracking setup.`;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'USER',
      pane: 'STRATEGY',
      kind: null,
      metadata: null,
      content: messageContent,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    const res = await api.sendMessage(messageContent, campaignId);
    if (res.success && res.data) {
      const { userMessage: savedUserMsg, assistantMessage } = res.data;
      setMessages((prev) => {
        const filtered = prev.filter(m => m.id !== userMessage.id);
        return [...filtered, savedUserMsg, assistantMessage];
      });
      fetchCurrentCampaign();
    }
    setLoading(false);
  };

  const handleSkipToStage3 = async () => {
    if (!campaignId) return;
    setPhase2PopupOpen(false);
    const updatedQuizData = {
      ...currentCampaign?.quizData,
      phase: '3',
      deadline: currentCampaign?.quizData?.deadline || 'not_sure',
      target_ctr: currentCampaign?.quizData?.target_ctr || 'not_sure',
      target_cvr: currentCampaign?.quizData?.target_cvr || 'not_sure',
      target_roas: currentCampaign?.quizData?.target_roas || 'not_sure'
    };
    const updateRes = await api.updateCampaign(campaignId, { quizData: updatedQuizData });
    if (!updateRes.success) {
      appendAssistantMessage('Could not skip Stage 2 right now. Please retry.');
      return;
    }
    appendSystemTransition(2);
    appendSystemTransition(3);
    fetchCurrentCampaign();
    const msg = 'I skipped Stage 2 details for now. Please start Stage 3 optimization using current available data.';
    setLoading(true);
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'USER',
      pane: 'STRATEGY',
      kind: null,
      metadata: null,
      content: msg,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    try {
      const res = await api.sendMessage(msg, campaignId);
      if (res.success && res.data) {
        const { userMessage: savedUserMsg, assistantMessage } = res.data;
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== userMsg.id);
          return [...filtered, savedUserMsg, assistantMessage];
        });
      }
    } catch {
      appendAssistantMessage('Stage 3 is ready. Send any message to begin optimization guidance.');
    }
    setLoading(false);
  };

  const handleSaveQuizField = async (key: string) => {
    if (!campaignId) return;
    const val = editingQuizValue.trim();
    if (!val) {
      setEditingQuizField(null);
      return;
    }
    const updatedQuizData = { ...currentCampaign?.quizData, [key]: val };
    const updateRes = await api.updateCampaign(campaignId, { quizData: updatedQuizData });
    if (updateRes.success) {
      fetchCurrentCampaign();
      toast.success('Campaign details updated!');
    } else {
      toast.error('Failed to update details.');
    }
    setEditingQuizField(null);
  };

  const handleSaveAllQuizFields = async (updatedData: Record<string, string>) => {
    if (!campaignId || !currentCampaign) return;
    try {
      const newQuizData = { ...currentCampaign.quizData, ...updatedData };
      const res = await api.updateCampaign(campaignId, { quizData: newQuizData });
      if (res.success) {
        fetchCurrentCampaign();
        toast.success('Campaign details updated!');
      } else {
        toast.error('Failed to update details.');
      }
      setEditQuizModalOpen(false);
    } catch (err) {
      console.error('Failed to save quiz fields:', err);
      toast.error('Failed to update details.');
    }
  };

  const focusComposer = () => {
    textareaRef.current?.focus();
  };

  const handleSelectPlan = async (planId: string, _planContent: string) => {
    if (!campaignId || loading) return;
    setSelectedPlanInChat(planId);
    const updatedQuizData = { ...currentCampaign?.quizData, selectedPlan: planId, phase: '2' };
    const updateRes = await api.updateCampaign(campaignId, { quizData: updatedQuizData });
    if (!updateRes.success) {
      // Roll back local optimistic plan selection so the UI does not lie about
      // the server state.
      setSelectedPlanInChat(null);
      appendAssistantMessage(
        'We could not record your plan selection. Please retry.'
      );
      return;
    }
    appendSystemTransition(2);
    fetchCurrentCampaign();

    // Send message to AI about selection and request immediate Stage 2 guidance.
    const messageContent = `I selected Plan ${planId}. We are now in Stage 2. Please provide my next-step refinement guidance, including priorities, timeline, and KPIs in clear markdown tables where useful.`;
    setLoading(true);
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'USER',
      pane: 'STRATEGY',
      kind: 'plan_selected',
      metadata: { plan: planId },
      content: messageContent,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await api.sendMessage(messageContent, campaignId);
      if (res.success && res.data) {
        const { userMessage: savedUserMsg, assistantMessage } = res.data;
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== userMsg.id);
          return [...filtered, savedUserMsg, assistantMessage];
        });
      }
    } catch (e) { /* handled by fallback */ }
    setLoading(false);
  };

  const [stageTransitionPending, setStageTransitionPending] = useState(false);
  const [stageTransitionError, setStageTransitionError] = useState<string | null>(null);

  const handleAdvanceStage = async (targetStage: number) => {
    if (!campaignId) return;
    if (stageTransitionPending) return;

    const target = targetStage as Stage;
    const guard = canAdvance(currentStage, target, currentCampaign?.quizData);
    if (!guard.ok && guard.reason) {
      setStageTransitionError(guard.reason);
      return;
    }

    setStageTransitionError(null);

    if (target === 2) {
      // Open Phase 2 quiz; the actual quizData update happens inside
      // handlePhase2Complete after the user submits their answers.
      setPhase2PopupOpen(true);
      setPhase2Step(0);
      return;
    }

    if (target === 3) {
      setStageTransitionPending(true);
      const previousQuizData = currentCampaign?.quizData;
      const updatedQuizData = { ...previousQuizData, phase: '3' };
      const updateRes = await api.updateCampaign(campaignId, { quizData: updatedQuizData });
      if (!updateRes.success) {
        setStageTransitionPending(false);
        setStageTransitionError(
          'Could not advance to Stage 3 (network or server error). Please retry.'
        );
        return;
      }
      fetchCurrentCampaign();
      appendSystemTransition(3);

      const msg =
        'Moving to Stage 3: Ongoing Optimization. I will submit periodic reports for AI analysis.';
      setLoading(true);
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'USER',
        pane: 'STRATEGY',
        kind: null,
        metadata: null,
        content: msg,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMsg]);
      try {
        const res = await api.sendMessage(msg, campaignId);
        if (res.success && res.data) {
          const { userMessage: savedUserMsg, assistantMessage } = res.data;
          setMessages(prev => {
            const filtered = prev.filter(m => m.id !== userMsg.id);
            return [...filtered, savedUserMsg, assistantMessage];
          });
        }
      } catch (e) { /* handled */ }
      setLoading(false);
      setStageTransitionPending(false);
    }
  };

  // Reset the campaign back to an earlier stage. The quiz answers are kept,
  // but phase / selectedPlan are cleared as appropriate so the user can
  // re-do the affected steps. The full activity log is preserved.
  const handleResetToStage = async (targetStage: Stage) => {
    if (!campaignId || stageTransitionPending) return;
    if (targetStage >= currentStage) return;

    const confirmText = `You are about to return to Stage ${targetStage} (${STAGE_DESCRIPTORS[targetStage].title}). This will permanently delete all strategy decisions, selected plans, and execution details made after this stage. Your chat history will remain, but the AI's current context will be reset to this earlier point.`;

    setConfirmModalData({
      title: 'Confirm Reset',
      message: confirmText,
      onConfirm: async () => {
        setStageTransitionPending(true);
        setStageTransitionError(null);
        setShowConfirmModal(false);

        const previous = currentCampaign?.quizData ?? {};
        const next: Record<string, string> = { ...previous };

        // Clear progression markers based on target stage
        if (targetStage < 3) {
          delete next.phase;
        }
        if (targetStage < 2) {
          delete next.selectedPlan;
          delete next.phase;
        }
        
        if (targetStage === 0) {
          Object.keys(next).forEach(k => { delete next[k]; });
        } else if (targetStage === 1) {
          delete next.selectedPlan;
          delete next.phase;
        }

        const updateRes = await api.updateCampaign(campaignId, { quizData: next });
        if (!updateRes.success) {
          setStageTransitionPending(false);
          setStageTransitionError(
            'Could not reset stage. Please retry.'
          );
          return;
        }
        setSelectedPlanInChat(null);
        fetchCurrentCampaign();
        appendSystemTransition(targetStage, 'rollback');
        setStageTransitionPending(false);
      }
    });
    setShowConfirmModal(true);
  };

  // Build a temporary CONTENT-pane error message that always lands in the
  // correct (right-hand) pane.
  const buildContentErrorMessage = (text: string): Message => ({
    id: `assist-error-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role: 'ASSISTANT',
    pane: 'CONTENT',
    kind: 'content_response',
    metadata: { error: true },
    content: text,
    createdAt: new Date().toISOString()
  });

  const handleAssistContent = async (type: 'email' | 'ad_copy' | 'social_post') => {
    if (!campaignId || assistLoading) return;
    setAssistLoading(true);
    try {
      const res = await api.assistContent(type, campaignId);
      if (res.success && res.data) {
        // Use the server-tagged messages so they are guaranteed to render on
        // the Content pane (kind=content_response, pane=CONTENT).
        const updates: Message[] = [];
        if (res.data.userMessage) updates.push(res.data.userMessage);
        updates.push(res.data.assistantMessage);
        setMessages(prev => [...prev, ...updates]);
      } else {
        setMessages(prev => [
          ...prev,
          buildContentErrorMessage(
            'Failed to generate content. Please try again.'
          )
        ]);
      }
    } catch (e) {
      console.error('Failed to generate content', e);
      setMessages(prev => [
        ...prev,
        buildContentErrorMessage(
          'Network error when generating content.'
        )
      ]);
    }
    setAssistLoading(false);
    setContentPaneCollapsed(false);
  };

  const handleSendContent = async (overridePrompt?: string) => {
    const promptText = overridePrompt || contentInput;
    if (!promptText.trim() || !campaignId || assistLoading) return;
    if (!contentPaneMode.enabled) return;
    const prompt = promptText;
    
    // Inject active tactics into the system context silently
    const tacticsContext = activeTactics.length > 0 
      ? `\n\n[System Context - Active Tactics: ${activeTactics.join(', ')}. Base your content on these tactics.]`
      : '';
    const payloadPrompt = prompt + tacticsContext;
    
    if (!overridePrompt) setContentInput('');
    setAssistLoading(true);

    // Optimistically add user message to the Content pane. We mark it pane:CONTENT
    // so the message lands in the right pane regardless of any prefix.
    const tempUserMsgId = `temp-${Date.now()}`;
    const tempUserMsg: Message = {
      id: tempUserMsgId,
      role: 'USER',
      pane: 'CONTENT',
      kind: 'content_prompt',
      metadata: { contentType: 'custom' },
      content: prompt,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await api.assistContent('custom', campaignId, payloadPrompt);
      if (res.success && res.data) {
        const persistedUser = res.data.userMessage;
        setMessages(prev => {
          const withoutTemp = prev.filter(m => m.id !== tempUserMsgId);
          const next: Message[] = persistedUser
            ? [...withoutTemp, persistedUser, res.data!.assistantMessage]
            : [...withoutTemp, tempUserMsg, res.data!.assistantMessage];
          return next;
        });
      } else {
        setMessages(prev => [
          ...prev,
          buildContentErrorMessage(
            'Failed to generate content. Please try again.'
          )
        ]);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [
        ...prev,
        buildContentErrorMessage(
          'Network error when generating content.'
        )
      ]);
    }
    setAssistLoading(false);
    setContentPaneCollapsed(false);
  };

  const handleAutoGenerateContent = async () => {
    if (assistLoading || !contentPaneMode.enabled) return;
    const qd = currentCampaign?.quizData || {};
    const contextLines = Object.entries(qd)
      .filter(([k,v]) => v && v !== 'not_sure' && k !== 'selectedPlan' && k !== 'phase')
      .map(([k,v]) => `${k.replace(/_/g, ' ')}: ${v}`);
    const contextStr = contextLines.join(', ');
    
    const autoPrompt = `Based on our campaign context [${contextStr}], please auto-generate a comprehensive marketing content strategy and draft. Focus on our active tactics if any.`;
    
    await handleSendContent(autoPrompt);
  };

  const handleLogout = () => {
    const confirmText = 'Are you sure you want to logout?';
    if (!window.confirm(confirmText)) return;
    logout();
    navigate('/');
  };

  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) {
        appendAssistantMessage('CSV file seems empty or invalid. Please check the format.');
        return;
      }

      // Simple CSV parser for quoted fields
      const parseCsvLine = (line: string) => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase());
      
      if (lines.length > 2) {
        appendAssistantMessage(`CSV contains ${lines.length - 1} data rows. Only the last row will be loaded into the form.`);
      }
      
      const values = parseCsvLine(lines[lines.length - 1]);
      
      const newInputs: Record<string, string> = {};
      metricsFields.forEach(field => {
        const idx = headers.findIndex(h =>
          h === field.key.toLowerCase() ||
          h === field.label.toLowerCase()
        );
        if (idx >= 0 && values[idx]) {
          newInputs[field.key] = values[idx];
        }
      });
      setMetricsInputs(prev => ({ ...prev, ...newInputs }));
      
      // Try to set label from headers
      const labelIdx = headers.findIndex(h => h === 'label' || h === 'period');
      if (labelIdx >= 0 && values[labelIdx]) setMetricsLabel(values[labelIdx]);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Multi-line chart grid for metrics history
  const TrendLineCharts = ({
    snapshots
  }: {
    snapshots: MetricsSnapshot[];
  }) => {
    const [expandedKey, setExpandedKey] = useState<string | null>(null);

    if (!snapshots || snapshots.length === 0) return null;
    
    // Determine which metrics have at least one non-zero value
    const activeKeys = metricsFields.filter(f => 
      snapshots.some(s => {
        const val = parseFloat(String((s.metrics as any)?.[f.key] || '0'));
        return val > 0;
      })
    ).slice(0, 8); // Show up to 8 active metrics

    if (activeKeys.length === 0) return null;
    
    const sortedSnapshots = [...snapshots].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (expandedKey) {
      const field = activeKeys.find(k => k.key === expandedKey);
      if (!field) {
        setExpandedKey(null);
        return null;
      }
      const targetStr = currentCampaign?.quizData?.[`target_${field.key}`];
      const targetVal = targetStr ? parseFloat(targetStr) : null;
      
      const values = sortedSnapshots.map(s => parseFloat(String((s.metrics as any)?.[field.key] || '0')) || 0);
      
      let allValues = [...values];
      if (targetVal !== null) allValues.push(targetVal);
      
      const maxVal = Math.max(...allValues, 1e-6);
      const minVal = Math.min(...allValues);
      const range = maxVal - minVal || 1;
      
      const VB_W = 800;
      const VB_H = 300;
      const padX = 40;
      const padYTop = 30;
      const padYBot = 60;
      const innerH = VB_H - padYTop - padYBot;
      
      const pointsData = values.map((v, i) => {
        const x = values.length === 1 ? VB_W / 2 : padX + (i / (values.length - 1)) * (VB_W - padX * 2);
        const y = padYTop + innerH - ((v - minVal) / range) * innerH;
        return { x, y };
      });
      const pathD = generateSmoothPath(pointsData);

      const isLowerBetterMetric = ['cpc', 'cpm', 'cpa', 'cpl', 'cac', 'churnRate', 'bounceRate'].includes(field.key);
      const startVal = values[0];
      const endVal = values[values.length - 1];
      const isUp = endVal > startVal;
      const isDown = endVal < startVal;
      
      let color = '#34d399';
      let statusStr = 'Good';
      if (targetVal !== null) {
        const metTarget = isLowerBetterMetric ? endVal <= targetVal : endVal >= targetVal;
        color = metTarget ? '#34d399' : '#f43f5e';
        statusStr = metTarget ? 'On Target' : 'Missed Target';
      } else {
        const improved = isLowerBetterMetric ? endVal <= startVal : endVal >= startVal;
        color = improved ? '#34d399' : '#f43f5e';
        if (isLowerBetterMetric) {
          statusStr = improved ? 'Cost Improved ✅' : 'Cost Increased ⚠️';
        } else {
          statusStr = improved ? 'Good' : 'Needs Attention';
        }
      }
      
      const formatVal = (v: number) => v >= 10 ? v.toFixed(0) : v.toFixed(2);
      const targetY = targetVal !== null ? (padYTop + innerH - ((targetVal - minVal) / range) * innerH) : null;

      return (
        <div className="chat-ext-1">
          <div className="chat-ext-2">
            <div className="chat-ext-3">
              <button onClick={() => setExpandedKey(null)} className="btn-ghost chat-ext-4">
                <ArrowRight size={18} className="chat-ext-5" />
              </button>
              <h3 className="chat-ext-6">{field.label} <span className="chat-ext-7">{field.hint}</span></h3>
            </div>
            <div className="chat-ext-8">
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: color, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span className="chat-ext-9">
                  {isUp ? <TrendingUp size={20} /> : isDown ? <TrendingDown size={20} /> : <Minus size={20} />}
                </span>
                {formatVal(endVal)}
              </div>
              <span style={{ fontSize: '0.85rem', padding: '0.3rem 0.6rem', borderRadius: '999px', background: `${color}15`, color: color, fontWeight: 600, border: `1px solid ${color}30` }}>
                {statusStr}
              </span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem' }}>
            <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="chat-ext-10">
              <defs>
                <filter id={`glow-exp-${field.key}`} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComponentTransfer in="blur" result="glow">
                    <feFuncA type="linear" slope="0.5" />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id={`gradient-exp-${field.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 0.5, 1].map(t => {
                const y = padYTop + innerH * t;
                const val = minVal + range * (1 - t);
                return (
                  <g key={t}>
                    <line x1={padX} x2={VB_W - padX} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                    <text x={padX - 8} y={y + 4} fill="rgba(255,255,255,0.3)" fontSize="11" textAnchor="end">{formatVal(val)}</text>
                  </g>
                );
              })}

              {targetY !== null && (
                <g>
                  <line x1={padX} x2={VB_W - padX} y1={targetY} y2={targetY} stroke="#60a5fa" strokeDasharray="6 4" strokeWidth="2" />
                  <text x={VB_W - padX - 8} y={targetY - 8} fill="#60a5fa" fontSize="12" fontWeight="600" textAnchor="end">Target: {formatVal(targetVal as number)}</text>
                </g>
              )}

              {values.length > 1 && (
                <>
                  <path 
                    d={`${pathD} L ${VB_W - padX},${padYTop + innerH} L ${padX},${padYTop + innerH} Z`} 
                    fill={`url(#gradient-exp-${field.key})`} 
                  />
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    fill="none"
                    stroke={color}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={pathD}
                    filter={`url(#glow-exp-${field.key})`}
                  />
                </>
              )}
              {values.map((v, i) => {
                const x = values.length === 1 ? VB_W / 2 : padX + (i / (values.length - 1)) * (VB_W - padX * 2);
                const y = padYTop + innerH - ((v - minVal) / range) * innerH;
                const snapshot = sortedSnapshots[i];
                const dateStr = snapshot.periodEnd ? new Date(snapshot.periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : new Date(snapshot.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <g key={i}>
                    <motion.circle
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.05, type: 'spring' }}
                      cx={x}
                      cy={y}
                      r="5"
                      fill={color}
                      stroke="rgba(18,18,22,1)"
                      strokeWidth="2"
                    />
                    <motion.text
                      initial={{ opacity: 0, y: y + 10 }}
                      animate={{ opacity: 1, y: y - 12 }}
                      transition={{ delay: 0.6 + i * 0.05 }}
                      x={x}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.9)"
                      fontSize="12"
                      fontWeight="600"
                    >
                      {formatVal(v)}
                    </motion.text>
                    <text
                      x={x}
                      y={VB_H - 25}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.4)"
                      fontSize="11"
                    >
                      {dateStr}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      );
    }

    return (
      <div className="insights-trends-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
        {activeKeys.map((field, idx) => {
          const values = sortedSnapshots.map(s => parseFloat(String((s.metrics as any)?.[field.key] || '0')) || 0);
          
          const maxVal = Math.max(...values, 1e-6);
          const minVal = Math.min(...values);
          const range = maxVal - minVal || 1;
          
          const VB_W = 200;
          const VB_H = 76;
          const padX = 14;
          const padYTop = 10;
          const padYBot = 20;
          const innerH = VB_H - padYTop - padYBot;
          
          const pointsData = values.map((v, i) => {
            const x = values.length === 1 ? VB_W / 2 : padX + (i / (values.length - 1)) * (VB_W - padX * 2);
            const y = padYTop + innerH - ((v - minVal) / range) * innerH;
            return { x, y };
          });
          const pathD = generateSmoothPath(pointsData);

          const isLowerBetterMetric = ['cpc', 'cpm', 'cpa', 'cpl', 'cac', 'churnRate', 'bounceRate'].includes(field.key);
          const startVal = values[0];
          const endVal = values[values.length - 1];
          const isUp = endVal > startVal;
          const isDown = endVal < startVal;
          
          // Determine if the trend is improving
          const improved = isLowerBetterMetric ? endVal <= startVal : endVal >= startVal;
          const color = improved ? '#34d399' : '#f43f5e';
          
          let statusStr = '';
          if (isLowerBetterMetric) {
            statusStr = improved ? 'Cost Improved ✅' : 'Cost Increased ⚠️';
          } else {
            statusStr = improved ? 'Good' : 'Needs Attention';
          }
          
          const formatVal = (v: number) => v >= 10 ? v.toFixed(0) : v.toFixed(2);

          return (
            <div 
              key={field.key} 
              onClick={() => setExpandedKey(field.key)}
              style={{ 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: 'var(--radius-md)', 
                padding: '0.6rem 0.75rem', 
                border: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            >
              <div className="chat-ext-11">
                <div className="chat-ext-12">
                  <span className="chat-ext-13" title={field.hint}>{field.label}</span>
                  <span style={{ fontSize: '0.55rem', padding: '0.1rem 0.3rem', borderRadius: '4px', background: `${color}20`, color: color, fontWeight: 600, border: `1px solid ${color}40` }}>
                    {statusStr}
                  </span>
                </div>
                <span className="chat-ext-14">
                  <span style={{ color, display: 'flex', alignItems: 'center' }}>
                    {isUp ? <TrendingUp size={12} /> : isDown ? <TrendingDown size={12} /> : <Minus size={12} />}
                  </span>
                  {formatVal(endVal)}
                </span>
              </div>
              <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="chat-ext-15">
                <defs>
                  <filter id={`glow-${field.key}`} x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComponentTransfer in="blur" result="glow">
                      <feFuncA type="linear" slope="0.4" />
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <linearGradient id={`gradient-${field.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                {values.length > 1 && (
                  <>
                    <path 
                      d={`${pathD} L ${VB_W - padX},${padYTop + innerH} L ${padX},${padYTop + innerH} Z`} 
                      fill={`url(#gradient-${field.key})`} 
                    />
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.05 }}
                      fill="none"
                      stroke={color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={pathD}
                      filter={`url(#glow-${field.key})`}
                    />
                    <text x={padX} y={VB_H - 4} fontSize="7" fill="rgba(255,255,255,0.4)" textAnchor="start" fontWeight="500">
                      {sortedSnapshots[0].periodEnd ? new Date(sortedSnapshots[0].periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : new Date(sortedSnapshots[0].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </text>
                    <text x={VB_W - padX} y={VB_H - 4} fontSize="7" fill="rgba(255,255,255,0.4)" textAnchor="end" fontWeight="500">
                      {sortedSnapshots[values.length - 1].periodEnd ? new Date(sortedSnapshots[values.length - 1].periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : new Date(sortedSnapshots[values.length - 1].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </text>
                  </>
                )}
                {values.map((v, i) => {
                  const x = values.length === 1 ? VB_W / 2 : padX + (i / (values.length - 1)) * (VB_W - padX * 2);
                  const y = padYTop + innerH - ((v - minVal) / range) * innerH;
                  return (
                    <g key={i}>
                      <motion.circle
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: idx * 0.05 + 0.5 + i * 0.1, type: 'spring' }}
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill={color}
                        stroke="rgba(18,18,22,1)"
                        strokeWidth="1.5"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
          );
        })}
      </div>
    );
  };

  const handleReanalyze = async () => {
    if (loading || !campaignId) return;
    const lastUserMsg = messages.slice().reverse().find(m => m.role === 'USER');
    const textToResend = lastUserMsg ? lastUserMsg.content : ('Please reanalyze the strategy.');

    setLoading(true);
    const generatedId = `${Date.now()}-retry`;
    setMessages((prev) => [...prev, {
      id: generatedId,
      role: 'USER',
      pane: 'STRATEGY',
      kind: null,
      metadata: null,
      content: textToResend,
      createdAt: new Date().toISOString()
    }]);

    try {
      const res = await api.sendMessage(textToResend, campaignId);
      if (res.success && res.data) {
        const { userMessage: savedUserMsg, assistantMessage } = res.data;
        setMessages((prev) => {
          const filtered = prev.filter(m => m.id !== generatedId);
          return [...filtered, savedUserMsg, assistantMessage];
        });
      } else {
        appendAssistantMessage(getGenericAiErrorMessage());
      }
    } catch (e) {
      appendAssistantMessage(getGenericAiErrorMessage());
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for insecure contexts
      try {
        const ta = document.createElement('textarea');
        ta.value = content;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch { /* ignore */ }
    }
  };

  const handleMetricsInputChange = (key: string, value: string) => {
    setMetricsInputs((prev) => ({ ...prev, [key]: value }));
  };

  const buildMetricsPayload = () => {
    const metrics: Record<string, unknown> = {};

    metricsFields.forEach((field) => {
      const raw = metricsInputs[field.key];
      if (raw && raw.trim().length > 0) {
        const parsed = Number(raw);
        metrics[field.key] = Number.isFinite(parsed) ? parsed : raw.trim();
      }
    });

    return metrics;
  };

  const handleSaveMetrics = async () => {
    if (!campaignId) {
      return;
    }

    const metrics = buildMetricsPayload();
    if (Object.keys(metrics).length === 0) {
      appendAssistantMessage('Please fill in at least one metric before saving.');
      return;
    }
    if (!metricsPeriodStart || !metricsPeriodEnd) {
      appendAssistantMessage('Please set both period start and end dates.');
      return;
    }

    const res = await api.createMetricsSnapshot(campaignId, {
      periodStart: new Date(metricsPeriodStart).toISOString(),
      periodEnd: new Date(metricsPeriodEnd).toISOString(),
      label: metricsLabel.trim() || undefined,
      metrics
    });

    if (res.success) {
      setMetricsLabel('');
      fetchMetricsSnapshots();
    }
  };

  const handleApplyTargets = async (targets: Record<string, string | number>) => {
    if (!campaignId || !currentCampaign) return;
    
    const newQuizData = { ...currentCampaign.quizData };
    let hasChanges = false;
    for (const [key, val] of Object.entries(targets)) {
      if (metricsFields.some(f => f.key === key.toLowerCase())) {
        newQuizData[`target_${key.toLowerCase()}`] = String(val);
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      try {
        const res = await api.updateCampaign(campaignId, { quizData: newQuizData });
        if (res.success && res.data) {
          setCurrentCampaign(res.data);
          toast.success("Targets applied to Campaign Insights!");
        }
      } catch (err) {
        toast.error("Failed to apply targets.");
      }
    }
  };

  const handleExtractTargets = async (content: string) => {
    if (!campaignId) return;
    const loadingToast = toast.loading("Extracting targets...");
    try {
      const res = await api.assistContent(
        'custom',
        campaignId,
        `Extract the KPI/metric targets from the following text. Return ONLY a JSON object exactly like {"targets": {"cpa": 1.2, "retentionRate": 15}}. Map metric names to these exact keys: cpc, cpm, cpa, cpl, cac, ctr, conversionRate, roas, churnRate, bounceRate, retentionRate, engagementRate. Text: ${content}`
      );
      toast.dismiss(loadingToast);
      
      if (res.success && res.data) {
        const jsonMatch = res.data.content.match(/```(?:json)?\n([\s\S]*?)\n```/) || res.data.content.match(/({[\s\S]*})/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[1]);
            if (parsed.targets) {
               handleApplyTargets(parsed.targets);
               return;
            }
        }
        toast.error('Could not find any targets.');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to extract targets.');
    }
  };


  const reactMarkdownComponents = useMemo(() => ({
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      if (!inline && match && match[1] === 'json') {
        const content = String(children).replace(/\n$/, '');
        try {
          const parsed = JSON.parse(content);
          if (parsed.type === 'metrics_targets' && parsed.targets) {
            return (
              <div className="ai-targets-card" style={{ background: 'rgba(59,130,246,0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)', margin: '1rem 0' }}>
                <div className="chat-ext-16">
                  <div>
                    <h4 className="chat-ext-17">Suggested Metric Targets</h4>
                    <div className="chat-ext-18">
                      {Object.entries(parsed.targets).map(([k, v]) => (
                        <span key={k} style={{ fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                          <strong className="chat-ext-19">{k.toUpperCase()}</strong>: {String(v)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleApplyTargets(parsed.targets as Record<string, string | number>)}
                  >
                    Apply Targets
                  </button>
                </div>
              </div>
            );
          }
        } catch (e) {
          // ignore
        }
      }
      return <code className={className} {...props}>{children}</code>;
    }
  }), [currentCampaign, campaignId]);



  // Campaign actions
  const handleRenameCampaign = async (id: string) => {
    const nextName = editingName.trim();
    if (!nextName) return;

    const res = await api.updateCampaign(id, { name: nextName });
    const updatedCampaign = res.data;

    if (res.success && updatedCampaign) {
      setCampaigns((prev) => prev.map((campaign) =>
        campaign.id === id ? { ...campaign, name: updatedCampaign.name } : campaign
      ));
      if (currentCampaign?.id === id) {
        setCurrentCampaign(currentCampaign ? { ...currentCampaign, name: updatedCampaign.name } : null);
      }
    }

    setEditingCampaignId(null);
    setEditingName('');
    setActiveCampaignMenu(null);
  };

  const openDeleteModal = (id: string) => {
    setDeletingCampaignId(id);
    setDeleteModalOpen(true);
    setActiveCampaignMenu(null);
  };

  const handleDeleteCampaign = async () => {
    if (!deletingCampaignId) return;

    const res = await api.deleteCampaign(deletingCampaignId);
    if (res.success) {
      setCampaigns((prev) => prev.filter((campaign) => campaign.id !== deletingCampaignId));
      if (deletingCampaignId === campaignId) {
        setCurrentCampaign(null);
        navigate('/chat');
      }
    } else {
      appendAssistantMessage('Failed to delete campaign. Please try again.');
    }

    setDeleteModalOpen(false);
    setDeletingCampaignId(null);
  };

  const handleToggleFavorite = async (id: string) => {
    const targetCampaign = campaigns.find((campaign) => campaign.id === id);
    if (!targetCampaign) {
      return;
    }

    const nextFavoriteState = !targetCampaign.isFavorite;

    setCampaigns((prev) => prev.map((campaign) =>
      campaign.id === id ? { ...campaign, isFavorite: nextFavoriteState } : campaign
    ));

    if (currentCampaign?.id === id) {
      setCurrentCampaign(currentCampaign ? { ...currentCampaign, isFavorite: nextFavoriteState } : null);
    }

    const res = await api.updateCampaign(id, { isFavorite: nextFavoriteState });
    if (!res.success) {
      setCampaigns((prev) => prev.map((campaign) =>
        campaign.id === id ? { ...campaign, isFavorite: targetCampaign.isFavorite } : campaign
      ));
      if (currentCampaign?.id === id) {
        setCurrentCampaign(currentCampaign ? { ...currentCampaign, isFavorite: targetCampaign.isFavorite } : null);
      }
    }

    setActiveCampaignMenu(null);
  };

  // Get full quiz profile for detailed display
  const fullQuizProfile = useMemo(() => {
    if (!currentCampaign?.quizData) return [];
    const qd = currentCampaign.quizData as Record<string, string>;

    const icons: Record<string, ReactNode> = {
      productName: <Package size={16} />,
      business: <Building size={16} />,
      stage: <Zap size={16} />,
      audience: <Users size={16} />,
      region: <Globe size={16} />,
      platform: <Smartphone size={16} />,
      priceRange: <ShoppingBag size={16} />,
      goal: <Target size={16} />,
      usp: <Heart size={16} />,
      channels: <Megaphone size={16} />,
      currentMarketing: <BarChart3 size={16} />,
      experience: <TrendingUp size={16} />,
      competitors: <Briefcase size={16} />,
      timeline: <Clock size={16} />,
      budget: <DollarSign size={16} />,
      seasonality: <Clock size={16} />,
      contentFormat: <BookOpen size={16} />,
      offerType: <Star size={16} />,
      deadline: <Clock size={16} />,
      target_ctr: <TrendingUp size={16} />,
      target_cvr: <Target size={16} />,
      target_roas: <BarChart3 size={16} />
    };

    const labelOverride: Partial<Record<string, string>> = {
      productName: 'Product',
      goal: 'Goal',
      audience: 'Audience',
      channels: 'Channels',
      usp: 'USP',
      target_ctr: 'Target CTR',
      target_cvr: 'Target CVR',
      target_roas: 'Target ROAS'
    };

    const items: { icon: ReactNode; label: string; value: string; key: string; isMissing: boolean }[] = [];
    for (const field of QUIZ_ACTIVITY_FIELDS) {
      const raw = field.read(qd);
      const isMissing = !raw || raw === 'not_sure';
      const value = isMissing ? 'Missing / Skipped' : (formatQuizAnswerForDisplay(field.key, raw) || raw);
      items.push({
        key: field.key,
        icon: icons[field.key] ?? <Sparkles size={16} />,
        label: labelOverride[field.key] ?? field.label,
        value: value,
        isMissing
      });
    }

    return items;
  }, [currentCampaign?.quizData]);


  const latestSnapshot = metricsSnapshots[0];
  const previousSnapshot = metricsSnapshots[1];


  const activeTargets = useMemo(() => {
    const targets: Array<{
      key: string;
      label: string;
      target: number;
      actual: number;
      status: { label: string; tone: string; pct: number };
      isCost: boolean;
      hint: string;
    }> = [];
    
    if (!currentCampaign?.quizData) return targets;

    const quizData = currentCampaign.quizData;
    
    const metricMeta: Record<string, { label: string, hint: string, isCost: boolean }> = {
      ctr: { label: 'CTR', hint: 'Click-through rate %', isCost: false },
      cvr: { label: 'Conversion rate', hint: '% of sessions that convert', isCost: false },
      conversionrate: { label: 'Conversion rate', hint: '% of sessions that convert', isCost: false },
      roas: { label: 'ROAS', hint: 'Return on ad spend', isCost: false },
      cac: { label: 'CAC', hint: 'Cost per acquisition', isCost: true },
      cpc: { label: 'CPC', hint: 'Cost per click', isCost: true },
      cpa: { label: 'CPA', hint: 'Cost per action', isCost: true },
      cpl: { label: 'CPL', hint: 'Cost per lead', isCost: true },
      cpm: { label: 'CPM', hint: 'Cost per mille (1000)', isCost: true },
      engagementrate: { label: 'Engagement rate', hint: '% of engaged users', isCost: false },
      retentionrate: { label: 'Retention rate', hint: '% of returning users', isCost: false },
      churnrate: { label: 'Churn rate', hint: '% of lost users', isCost: true },
      bouncerate: { label: 'Bounce rate', hint: '% of single-page sessions', isCost: true },
    };

    Object.entries(quizData).forEach(([key, value]) => {
      if (key.startsWith('target_')) {
        const metricKey = key.replace('target_', '').toLowerCase();
        const targetVal = Number(value);
        if (targetVal > 0) {
          const actualVal = Number(latestSnapshot?.metrics?.[metricKey] || 0);
          const meta = metricMeta[metricKey] || { 
            label: metricKey.toUpperCase(), 
            hint: 'Custom metric', 
            isCost: false 
          };

          targets.push({
            key: metricKey,
            label: meta.label,
            target: targetVal,
            actual: actualVal,
            status: getKpiStatus(actualVal, targetVal, meta.isCost),
            isCost: meta.isCost,
            hint: meta.hint
          });
        }
      }
    });

    return targets;
  }, [currentCampaign?.quizData, latestSnapshot?.metrics]);

  const buildInsightsAiPrompt = (): string => {
    const lines: string[] = [
      '# ?? Campaign Performance Report',
      '',
      `**Campaign:** ${currentCampaign?.name ?? 'Untitled'}`,
      `**Current Stage:** ${currentStage} ? ${stageDescriptor.title}`,
      `**Report Date:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      ''
    ];

    // Discovery Profile table
    lines.push('## 1. Business Profile');
    if (fullQuizProfile.length === 0) {
      lines.push('_(No quiz answers stored yet)_');
    } else {
      lines.push('| Field | Value |');
      lines.push('|:------|:------|');
      fullQuizProfile.forEach((row) => {
        const hint = INSIGHT_QUIZ_HINTS[row.key];
        const label = hint ? `${row.label} (${hint})` : row.label;
        lines.push(`| ${label} | ${row.value} |`);
      });
    }
    lines.push('');

    // Stage 2 targets
    const qd = currentCampaign?.quizData;
    const hasTargets = (activeTargets.length > 0 || (qd?.deadline && qd.deadline !== 'not_sure'));
    if (hasTargets) {
      lines.push('## 2. KPI Targets');
      lines.push('| KPI | Target | Actual | Status |');
      lines.push('|:----|:-------|:-------|:-------|');
      if (qd?.deadline && qd.deadline !== 'not_sure') {
        lines.push(`| Deadline | ${qd.deadline} | ? | ? |`);
      }
      activeTargets.forEach(t => {
        lines.push(`| ${t.label} | ${t.target.toFixed(2)} | ${t.actual.toFixed(2)} | ${t.status.label} |`);
      });
      lines.push('');
    }

    // Metrics comparison table
    if (latestSnapshot) {
      lines.push('## 3. Metrics Comparison');
      lines.push(`> Latest: **${latestSnapshot.label || 'Untitled'}** (${latestSnapshot.periodStart?.slice(0, 10) ?? '?'} �� ${latestSnapshot.periodEnd?.slice(0, 10) ?? '?'})`);
      if (previousSnapshot) {
        lines.push(`> Previous: **${previousSnapshot.label || 'Untitled'}** (${previousSnapshot.periodStart?.slice(0, 10) ?? '?'} �� ${previousSnapshot.periodEnd?.slice(0, 10) ?? '?'})`);
      }
      lines.push('');
      lines.push('| Metric | Latest | Previous | Change |');
      lines.push('|:-------|-------:|---------:|-------:|');
      const lm = (latestSnapshot.metrics ?? {}) as Record<string, unknown>;
      const pm = previousSnapshot ? (previousSnapshot.metrics ?? {}) as Record<string, unknown> : {};
      metricsFields.forEach((f) => {
        const cur = lm[f.key];
        const prev = pm[f.key];
        if (cur === undefined && prev === undefined) return;
        const curStr = formatMetricValue(cur);
        const prevStr = previousSnapshot ? formatMetricValue(prev) : '?';
        const delta = computeMetricDelta(cur, prev);
        const changeStr = delta
          ? `${delta.diff >= 0 ? '+' : ''}${delta.percent !== null ? delta.percent.toFixed(1) + '%' : delta.diff.toFixed(2)}`
          : '?';
        lines.push(`| ${f.label} (${f.hint}) | ${curStr} | ${prevStr} | ${changeStr} |`);
      });
    } else {
      lines.push('## 3. Metrics');
      lines.push('_No snapshots recorded yet. Please submit your first metrics snapshot._');
    }
    lines.push('');

    // AI instructions
    lines.push('## Instructions');
    lines.push('Based on the data above, please provide:');
    lines.push('1. **Performance Summary** ? Key highlights and concerns in 2?3 sentences');
    lines.push('2. **Risk Analysis** ? Any metrics trending in the wrong direction or missing targets');
    lines.push('3. **Opportunities** ? Where can we scale or improve efficiency');
    lines.push('4. **Action Plan** ? 3?5 specific, prioritised next steps with expected impact');
    lines.push('5. **Data Gaps** ? What additional data would improve this analysis');
    lines.push('');
    lines.push('Format your response with clear headings and use comparison tables where useful.');
    return lines.join('\n');
  };

  const handleSendInsightsToAi = async () => {
    if (!campaignId || loading) return;
    const text = buildInsightsAiPrompt();
    setInsightsOpen(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'USER',
      pane: 'STRATEGY',
      kind: null,
      metadata: null,
      content: text,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    const glossaryMatches = findGlossaryMatches(
      `${text} ${Object.values(currentCampaign?.quizData || {}).join(' ')}`,
      6
    );
    const glossaryContext = summarizeGlossary(glossaryMatches);
    const context = glossaryContext.length > 0 ? { glossary: glossaryContext } : undefined;

    try {
      const res = await api.sendMessage(text, campaignId, context);
      if (res.success && res.data) {
        const { userMessage: savedUserMsg, assistantMessage } = res.data;
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== userMessage.id);
          return [...filtered, savedUserMsg, assistantMessage];
        });
      } else {
        appendAssistantMessage(getGenericAiErrorMessage());
      }
    } catch {
      appendAssistantMessage(getGenericAiErrorMessage());
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const progressPercent = Math.round((currentStage / 4) * 100);
  const completedStages = currentStage;
  const totalStages = 4;

  // Sort campaigns: favorites first, then by date
  const sortedCampaigns = useMemo(
    () => [...campaigns].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }),
    [campaigns]
  );

  // Split messages by their `pane` field. Legacy data without a pane (returned
  // by older backend versions) is classified by content prefix as a fallback,
  // matching the one-time backfill executed on the backend.

  // Activity log derived from messages + metrics snapshots. The log gives
  // the user a chronological audit of every meaningful campaign event:
  // quiz answers, plan selection, stage transitions, content
  // generations, and metrics submissions.
  type ActivityKind = 'quiz' | 'plan' | 'stage' | 'content' | 'metrics' | 'phase2';
  interface ActivityEvent {
    id: string;
    kind: ActivityKind;
    title: string;
    detail?: string;
    when: string;
  }

  const buildActivityEvents = (): ActivityEvent[] => {
    if (!currentCampaign) return [];
    const events: ActivityEvent[] = [];

    // Quiz answers ? same formatter as Insights cards (multi-select, audience pruning, readable labels).
    const qd = (currentCampaign.quizData ?? {}) as Record<string, string>;

    QUIZ_ACTIVITY_FIELDS.forEach(({ key, label, read }) => {
      const raw = read(qd);
      if (!raw?.trim()) return;
      const detail = formatQuizAnswerForDisplay(key, raw);
      if (!detail) return;
      events.push({
        id: `quiz-${key}`,
        kind: quizActivityEventKind(key),
        title: quizActivityLogTitle(key, label),
        detail,
        when: currentCampaign.updatedAt ?? currentCampaign.createdAt
      });
    });

    if (typeof qd.selectedPlan === 'string' && qd.selectedPlan) {
      events.push({
        id: `plan-${qd.selectedPlan}`,
        kind: 'plan',
        title: `Plan ${qd.selectedPlan} selected`,
        when: currentCampaign.updatedAt ?? currentCampaign.createdAt
      });
    }

    const STRUCTURAL_QUIZ_KEYS = new Set<string>(['phase', 'selectedPlan']);
    Object.keys(qd).forEach((key) => {
      if (STRUCTURAL_QUIZ_KEYS.has(key)) return;
      if (quizActivityLogHandledKeys.has(key)) return;
      const v = qd[key];
      if (typeof v !== 'string' || !v.trim()) return;
      const detail = formatQuizAnswerForDisplay(key, v) || v;
      events.push({
        id: `other-${key}`,
        kind: 'phase2',
        title: `Campaign: ${quizFieldActivityTitle(key)}`,
        detail,
        when: currentCampaign.updatedAt ?? currentCampaign.createdAt
      });
    });

    // Stage transitions and Content generations from messages.
    messages.forEach(msg => {
      if (msg.kind === 'stage_transition') {
        const meta = (msg.metadata ?? {}) as Record<string, unknown>;
        const toStage = (typeof meta.toStage === 'number' ? meta.toStage : 0) as Stage;
        const direction = meta.direction === 'rollback' ? 'rollback' : 'advance';
        const desc = STAGE_DESCRIPTORS[toStage] ?? STAGE_DESCRIPTORS[0];
        const verb = direction === 'rollback' ? 'Reset to Stage' : 'Advanced to Stage';
        events.push({
          id: `stage-${msg.id}`,
          kind: 'stage',
          title: `${verb} ${toStage} - ${desc.title}`,
          when: msg.createdAt
        });
      } else if (msg.kind === 'content_response') {
        const meta = (msg.metadata ?? {}) as Record<string, unknown>;
        const label = typeof meta.label === 'string' ? meta.label : 'Content';
        events.push({
          id: `content-${msg.id}`,
          kind: 'content',
          title: `Generated ${label}`,
          when: msg.createdAt
        });
      }
    });

    // Metrics snapshots.
    metricsSnapshots.forEach(snap => {
      events.push({
        id: `metric-${snap.id}`,
        kind: 'metrics',
        title: `Metrics snapshot: ${snap.label || 'Untitled'}`,
        when: snap.createdAt
      });
    });

    return events.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());
  };

  const activityEvents = useMemo(
    () => buildActivityEvents(),
    [currentCampaign, messages, metricsSnapshots]
  );

  // Strategy pane shows STRATEGY messages plus inline SYSTEM transition
  // markers so the user can see in-context when each stage advance happened.
  const analystMessages = messages.filter(m => {
    const p = classifyPane(m);
    return p === 'STRATEGY' || p === 'SYSTEM';
  });
  const contentMessages = messages.filter(m => classifyPane(m) === 'CONTENT');
  const showContentPane = !contentPaneCollapsed && (currentStage > 0 || analystMessages.length > 0);


  return (
    <div className="chat-layout">
      {/* Sidebar: outer animates clipped width; inner stays fixed?width ? no squished/reflow typography */}
      <ChatSidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarPanelWidth={sidebarPanelWidth}
        handleNewChat={handleNewChat}
        sidebarScrollRef={sidebarScrollRef}
        handleScrollToTopVisible={handleScrollToTopVisible}
        setShowSidebarBackToTop={setShowSidebarBackToTop}
        showSidebarBackToTop={showSidebarBackToTop}
        sortedCampaigns={sortedCampaigns}
        campaignId={campaignId}
        editingCampaignId={editingCampaignId}
        editingName={editingName}
        activeCampaignMenu={activeCampaignMenu}
        navigate={navigate}
        setActiveCampaignMenu={setActiveCampaignMenu}
        setEditingCampaignId={setEditingCampaignId}
        setEditingName={setEditingName}
        handleRenameCampaign={handleRenameCampaign}
        openDeleteModal={openDeleteModal}
        handleToggleFavorite={handleToggleFavorite}
        scrollToTop={scrollToTop}
        userMenuRef={userMenuRef}
        userMenuOpen={userMenuOpen}
        setUserMenuOpen={setUserMenuOpen}
        user={user}
        handleLogout={handleLogout}
        setBrandProfileModalOpen={setBrandProfileModalOpen}
        setIntegrationsModalOpen={setIntegrationsModalOpen}
      />

      {/* Main Chat Area */}
      <div className="chat-main">
        {/* Header */}
        <ChatHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentCampaign={currentCampaign}
          handleResetToStage={handleResetToStage}
          stageTransitionPending={stageTransitionPending}
          currentStage={currentStage}
          STAGE_DESCRIPTORS={STAGE_DESCRIPTORS as any}
          guidePopupOpen={guidePopupOpen}
          setGuidePopupOpen={setGuidePopupOpen}
          glossaryOpen={glossaryOpen}
          setGlossaryOpen={setGlossaryOpen}
          insightsOpen={insightsOpen}
          setInsightsOpen={setInsightsOpen}
          setClearModalOpen={setClearModalOpen}
          setEditQuizModalOpen={setEditQuizModalOpen}
          messages={messages}
        />

        {/* Stage banner: always visible when a campaign is open. Tells the user
            where they are and what the next action should be. */}
        {currentCampaign && !isStageBannerHidden && (
          <div className={`stage-banner stage-banner--stage-${currentStage}`}>
            <div className="stage-banner-text">
              <strong className="stage-banner-title">
                {`${'Stage'} ${currentStage} \u2022 ${stageDescriptor.title}`}
              </strong>
              <p className="stage-banner-subtitle">{stageDescriptor.subtitle}</p>
              <p className="stage-banner-next">{stageDescriptor.nextAction}</p>
            </div>
            <button
              type="button"
              className="stage-banner-hide-btn"
              onClick={() => setIsStageBannerHidden(true)}
              aria-label={'Hide banner'}
            >
              <X size={16} />
            </button>
            {stageTransitionError && (
              <div className="stage-banner-error" role="alert">
                {stageTransitionError}
                <button
                  type="button"
                  className="stage-banner-error-dismiss"
                  onClick={() => setStageTransitionError(null)}
                  aria-label={'Dismiss'}
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Recovery banner: surface when quizData is internally inconsistent
            (e.g. phase=3 but no selectedPlan). Offers explicit recovery
            actions instead of silently rendering an invalid stage. */}
        {currentCampaign && quizDataIssue && (
          <div className="stage-recovery-banner" role="alert">
            <div className="stage-recovery-text">
              <strong>{'Campaign data needs recovery'}</strong>
              <p>{quizDataIssue.message}</p>
            </div>
            <div className="stage-recovery-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleResetToStage(1)}
                disabled={stageTransitionPending}
              >
                {'Reselect plan'}
              </button>
              <button
                type="button"
                className="btn-tertiary"
                onClick={() => handleResetToStage(0)}
                disabled={stageTransitionPending}
              >
                {'Restart quiz'}
              </button>
            </div>
          </div>
        )}


        {/* Dual Pane Container */}
        <div className="chat-dual-pane-container">
          {/* Strategy Pane */}
          <div className="chat-pane strategy-pane" style={{ width: showContentPane ? `${strategyWidth}%` : '100%', flex: showContentPane ? '0 1 auto' : 1 }}>
            <div className="chat-pane-header">
              <div className="chat-ext-20">
                <Sparkles size={16} className="chat-ext-21" />
                <h3>{'Strategy Analyst'}</h3>
              </div>
            </div>
            {/* Messages */}
            <div 
              className="chat-messages" 
              data-lenis-prevent="true"
              ref={analystScrollContainerRef}
              onScroll={(e) => handlePaneScroll(e, setShowAnalystScrollDown)}
            >
              {initialLoading ? (
                <div className="chat-loading">
                  <div className="spinner" />
                </div>
              ) : analystMessages.length === 0 ? (
                <div className="chat-welcome">
                  <div className="welcome-icon">
                    <Sparkles size={40} />
                  </div>
                  <h2>{'Welcome to AdVisor'}</h2>
                  <p>{'Ask me anything about marketing strategy, ad copy, or campaign optimization.'}</p>

                  {/* Full Quiz Profile Card */}
                  {currentCampaign && fullQuizProfile.length > 0 && (
                    <div className="welcome-quiz-profile">
                      <div className="quiz-profile-header">
                        <h4>{'Your Campaign Profile'}</h4>
                      </div>
                      <div className="quiz-profile-grid">
                        {fullQuizProfile.map((item, i) => (
                          <div key={i} className="quiz-profile-item">
                            <span className="profile-icon">{item.icon}</span>
                            <div className="profile-content">
                              <span className="profile-label">{item.label}</span>
                              <span className="profile-value">{item.value}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentStage === 0 && (
                    <div className="welcome-actions">
                      <button className="welcome-action primary" onClick={handleOpenFullQuiz}>
                        <div className="welcome-action-title">
                          <ListChecks size={16} />
                          <span>{'Discovery Quiz'}</span>
                        </div>
                        <p>
                          {'Opens the full questionnaire. When you finish, your answers appear above the chat and the strategy starts automatically.'}
                        </p>
                      </button>

                      <button className="welcome-action secondary" onClick={focusComposer}>
                        <div className="welcome-action-title">
                          <MessageSquare size={16} />
                          <span>{'Skip Quiz, Chat Directly'}</span>
                        </div>
                        <p>
                          {'Type your first request below. A new campaign will be created automatically.'}
                        </p>
                      </button>

                      <button
                        className="welcome-action secondary"
                        type="button"
                        onClick={() => {
                          setGuideActiveTab('overview');
                          setGuidePopupOpen(true);
                        }}
                      >
                        <div className="welcome-action-title">
                          <HelpCircle size={16} />
                          <span>{'Show me how AdVisor works'}</span>
                        </div>
                        <p>
                          {'Walkthrough of the four stages, the two panes, and how metrics tie everything together.'}
                        </p>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <CampaignProfileCard />
                  {analystMessages.map((msg, i) => {
                  // SYSTEM-pane messages are rendered as inline stage transition
                  // markers (small label + horizontal rule) instead of chat
                  // bubbles. Their content is computed from `metadata.toStage`.
                  if (classifyPane(msg) === 'SYSTEM') {
                    const meta = (msg.metadata ?? {}) as Record<string, unknown>;
                    const toStage = (typeof meta.toStage === 'number' ? meta.toStage : 0) as Stage;
                    const desc = STAGE_DESCRIPTORS[toStage] ?? STAGE_DESCRIPTORS[0];
                    return (
                      <div key={msg.id} className="stage-transition-divider" role="note">
                        <span className="stage-transition-line" aria-hidden="true" />
                        <span className="stage-transition-label">
                          {`${'Stage'} ${toStage} \u2022 ${desc.title}`}
                        </span>
                        <span className="stage-transition-line" aria-hidden="true" />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`message ${msg.role === 'USER' ? 'user' : 'assistant'}`}
                    >
                      {msg.role === 'ASSISTANT' && (
                        <div className="message-avatar assistant-avatar">
                          <Sparkles size={16} />
                        </div>
                      )}

                      <div className="message-main">
                        <div className="message-meta">
                          <span className="message-author">
                            {msg.role === 'USER' ? (user?.name || ('You')) : 'AdVisor AI'}
                          </span>
                          <span className="message-time">{formatMessageTime(msg.createdAt)}</span>
                        </div>

                        <div className="message-content">
                          {msg.role === 'ASSISTANT' ? (
                            <>
                              {(() => {
                                const introMd = cleanContent(msg.content);
                                const parsedPlans = parsePlanOptions(msg.content);
                                return (
                                  <>
                                    {introMd.trim() ? (
                                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={reactMarkdownComponents}>{introMd}</ReactMarkdown>
                                    ) : null}
                                    {parsedPlans.length > 0 ? (
                                      <div className="plan-cards">
                                        {parsedPlans.map((plan) => (
                                          <motion.button
                                            key={plan.id}
                                            className={`plan-card ${selectedPlanInChat === plan.id || currentCampaign?.quizData?.selectedPlan === plan.id ? 'selected' : ''}`}
                                            onClick={() => handleSelectPlan(plan.id, plan.content)}
                                            disabled={loading || !!currentCampaign?.quizData?.selectedPlan}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                          >
                                            <div className="plan-card-badge">
                                              {plan.id === 'A' || plan.id === '1' ? (
                                                <Zap size={16} />
                                              ) : plan.id === 'B' || plan.id === '2' ? (
                                                <Target size={16} />
                                              ) : plan.id === 'C' || plan.id === '3' ? (
                                                <Award size={16} />
                                              ) : (
                                                <Sparkles size={16} />
                                              )}
                                            </div>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={reactMarkdownComponents}>{plan.content}</ReactMarkdown>
                                            {(selectedPlanInChat === plan.id ||
                                              currentCampaign?.quizData?.selectedPlan === plan.id) && (
                                              <div className="plan-card-check">
                                                <Check size={16} />
                                              </div>
                                            )}
                                          </motion.button>
                                        ))}
                                      </div>
                                    ) : null}
                                  </>
                                );
                              })()}

                              {/* Content Assistant offer - after plan selected, before Stage 2 */}
                              {i === analystMessages.length - 1 && currentCampaign?.quizData?.selectedPlan && currentStage === 1 && !hasStageTransition(msg.content) && (
                                <div className="content-assist-offer">
                                  <p className="chat-ext-22">
                                    {'Want AI to draft some content for your campaign before moving on?'}
                                  </p>
                                  <div className="content-assist-buttons">
                                    <button
                                      className="content-assist-btn"
                                      onClick={() => handleAssistContent('email')}
                                      disabled={assistLoading}
                                    >
                                      <Mail size={14} />
                                      <span>{'Draft Email'}</span>
                                    </button>
                                    <button
                                      className="content-assist-btn"
                                      onClick={() => handleAssistContent('ad_copy')}
                                      disabled={assistLoading}
                                    >
                                      <FileText size={14} />
                                      <span>{'Ad Copy'}</span>
                                    </button>
                                    <button
                                      className="content-assist-btn"
                                      onClick={() => handleAssistContent('social_post')}
                                      disabled={assistLoading}
                                    >
                                      <Palette size={14} />
                                      <span>{'Social Post'}</span>
                                    </button>
                                  </div>
                                  <button
                                    className="btn btn-primary btn-sm chat-ext-23"
                                    onClick={() => handleAdvanceStage(2)}
                                    disabled={loading}
                                    
                                  >
                                    <ArrowRight size={16} />
                                    {'Skip to Stage 2'}
                                  </button>
                                </div>
                              )}

                              {/* Stage transition prompt */}
                              {hasStageTransition(msg.content) && i === analystMessages.length - 1 && (
                                <div className="stage-transition-prompt">
                                  <p>{'Ready to move to the next stage?'}</p>
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleAdvanceStage(currentStage + 1)}
                                    disabled={loading}
                                  >
                                    <ArrowRight size={16} />
                                    {currentStage < 3
                                      ? `Go to Stage ${currentStage + 1}`
                                      : ('Continue Optimizing')}
                                  </button>
                                </div>
                              )}
                            </>
                          ) : msg.content.startsWith('# ?? Campaign Performance Report') ? (
                            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <div className="chat-ext-24">
                                <BarChart3 size={16} className="chat-ext-25" />
                                <span className="chat-ext-26">Campaign Data Provided to AI</span>
                              </div>
                              <p className="chat-ext-27">
                                Includes current stage, quiz answers, KPI targets, and latest metrics snapshots.
                              </p>
                            </div>
                          ) : (
                            <p>{msg.content}</p>
                          )}
                        </div>

                        <div className="message-tools">
                          {msg.role === 'ASSISTANT' && i === analystMessages.length - 1 && (
                            <button
                              className="message-copy-btn"
                              onClick={handleReanalyze}
                              title={'Reanalyze Strategy'}
                            >
                              <RefreshCw size={14} />
                            </button>
                          )}
                          {msg.role === 'ASSISTANT' && showContentPane && (
                            <button
                              className="message-copy-btn chat-ext-28"
                              onClick={() => {
                                setContentInput(`Please write marketing content based on the strategy from the left pane...`);
                                
                                // Auto-extract plan name as a tactic if available
                                if (selectedPlanInChat && !activeTactics.includes(selectedPlanInChat)) {
                                  setActiveTactics(prev => [...prev, selectedPlanInChat]);
                                }

                                setTimeout(() => {
                                  const inputField = document.querySelector('.content-pane textarea') as HTMLTextAreaElement;
                                  if (inputField) inputField.focus();
                                }, 100);
                              }}
                              title={'Send to Content Writer'}
                              
                            >
                              <ArrowRight size={14} />
                            </button>
                          )}
                          {msg.role === 'ASSISTANT' && hasTargetKeywords(msg.content) && (
                            <button
                              className="message-copy-btn chat-ext-29"
                              onClick={() => handleExtractTargets(msg.content)}
                              title={'Extract & Apply Targets'}
                              
                            >
                              <Target size={14} />
                            </button>
                          )}
                          <button
                            className="message-copy-btn"
                            onClick={() => handleCopyMessage(msg.content, msg.id)}
                            title={'Copy'}
                          >
                            {copiedId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      {msg.role === 'USER' && (
                        user?.avatar ? (
                          <img src={user.avatar} alt={user.name || 'User'} className="message-avatar user-avatar chat-ext-30" />
                        ) : (
                          <div className="message-avatar user-avatar">
                            {user?.name?.charAt(0) || 'U'}
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
                {loading && (
                  <div className="message assistant loading-message">
                    <div className="message-avatar assistant-avatar"><Sparkles size={16} /></div>
                    <div className="message-main">
                      <div className="message-meta">
                        <span className="message-author">AdVisor AI</span>
                      </div>
                      <div className="message-content typing-bubble">
                        <div className="typing-indicator">
                          <span /><span /><span /><span />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
            </div>

            <AnimatePresence>
              {showAnalystScrollDown && (
                <motion.button
                  className="btn-scroll-down"
                  initial={{ opacity: 0, y: 10, scale: 0.9, x: "-50%" }}
                  animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                  exit={{ opacity: 0, y: 10, scale: 0.9, x: "-50%" }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => scrollToBottom(messagesEndRef)}
                  aria-label="Scroll to bottom"
                >
                  <ArrowDown size={20} />
                </motion.button>
              )}
            </AnimatePresence>

            <ChatInput 
              onSend={handleSend} 
              loading={loading} 
              currentCampaign={currentCampaign} 
              onOpenFullQuiz={handleOpenFullQuiz} 
            />
          </div>

          {/* Content Pane Restore Button */}
          {contentPaneCollapsed && (currentStage > 0 || analystMessages.length > 0) && (
            <button
              type="button"
              className="content-pane-restore-btn"
              onClick={() => setContentPaneCollapsed(false)}
              title="Show Content Writer"
            >
              <FileText size={14} />
              <ChevronLeft size={14} />
            </button>
          )}

          {/* Resizer */}
          {showContentPane && (
            <div
              className="pane-resizer"
              onMouseDown={() => setIsDraggingPane(true)}
              style={{ width: '6px', cursor: 'col-resize', background: isDraggingPane ? 'var(--accent)' : 'transparent', zIndex: 10, position: 'relative', transition: 'background 0.2s' }}
            >
              <div style={{ width: '2px', height: '100%', background: 'rgba(255,255,255,0.08)', margin: '0 auto' }}></div>
            </div>
          )}

          {/* Content Assistant Pane */}
          {showContentPane && (
            <div className="chat-pane content-pane">
              <div className="chat-pane-header" style={{ background: 'rgba(16, 185, 129, 0.05)', flexDirection: 'column', alignItems: 'stretch', padding: 0 }}>
                <div className="chat-ext-31">
                  <div className="chat-ext-32">
                    <FileText size={16} className="chat-ext-33" />
                    <h3 className="chat-ext-34">{'Content Writer'}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setContentPaneCollapsed(true)}
                    className="btn-ghost chat-ext-35"
                    title="Hide Content Writer"
                    
                  >
                    <X size={14} />
                  </button>
                </div>
                
                {/* Tactics Bar */}
                <div style={{ padding: '0.5rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', background: 'rgba(16, 185, 129, 0.02)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Tactics:</span>
                  {activeTactics.map((tactic, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', color: '#34d399' }}>
                      <span>{tactic}</span>
                      <button 
                        type="button"
                        onClick={() => setActiveTactics(prev => prev.filter((_, i) => i !== idx))} 
                        className="chat-ext-36"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  <div className="chat-ext-37">
                    <input 
                      type="text" 
                      value={newTactic}
                      onChange={(e) => setNewTactic(e.target.value)}
                      onFocus={() => setShowTacticsDropdown(true)}
                      onBlur={() => setTimeout(() => setShowTacticsDropdown(false), 200)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTactic.trim()) {
                          if (!activeTactics.includes(newTactic.trim())) {
                            setActiveTactics(prev => [...prev, newTactic.trim()]);
                          }
                          setNewTactic('');
                        }
                      }}
                      placeholder="Add tactic..."
                      style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', color: 'white', width: '130px', outline: 'none' }}
                    />
                    {showTacticsDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '0.25rem',
                        width: '220px',
                        background: 'rgba(14, 14, 16, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 50,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        {TACTIC_SUGGESTIONS.filter(t => t.toLowerCase().includes(newTactic.toLowerCase())).map((tactic, i) => (
                          <button
                            key={i}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              if (!activeTactics.includes(tactic)) {
                                setActiveTactics(prev => [...prev, tactic]);
                              }
                              setNewTactic('');
                              setShowTacticsDropdown(false);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'rgba(255,255,255,0.8)',
                              padding: '0.5rem 0.75rem',
                              textAlign: 'left',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              borderBottom: i < TACTIC_SUGGESTIONS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                              transition: 'background 0.2s, color 0.2s'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = 'rgba(52, 211, 153, 0.15)';
                              e.currentTarget.style.color = '#34d399';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                            }}
                          >
                            {tactic}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div 
                className="chat-messages" 
                data-lenis-prevent="true"
                ref={contentScrollContainerRef}
                onScroll={(e) => handlePaneScroll(e, setShowContentScrollDown)}
              >
                {contentMessages.length === 0 ? (
                  <div className="chat-welcome chat-ext-38">
                    <div className="welcome-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', marginBottom: 0 }}>
                      <FileText size={40} />
                    </div>
                    <div className="chat-ext-39">
                      <h2 className="chat-ext-40">{contentPaneMode.emptyTitle}</h2>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{contentPaneMode.emptyHint}</p>
                    </div>

                    {currentCampaign?.quizData && Object.keys(currentCampaign.quizData).length > 0 && (
                      <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: '12px', padding: '1rem', width: '100%', maxWidth: '500px', textAlign: 'left' }}>
                        <div className="chat-ext-41">
                          <CheckCircle2 size={16} />
                          <h4 className="chat-ext-42">Quiz Context Imported</h4>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          {Object.entries(currentCampaign.quizData)
                            .filter(([k,v]) => v && v !== 'not_sure' && k !== 'selectedPlan' && k !== 'phase')
                            .slice(0, 4)
                            .map(([k,v]) => (
                              <div key={k} className="chat-ext-43">
                                <span className="chat-ext-44">{k.replace(/_/g, ' ')}:</span> <span className="chat-ext-45">{String(v)}</span>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={handleAutoGenerateContent}
                      disabled={assistLoading || !contentPaneMode.enabled}
                      style={{
                        background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                        border: 'none',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '999px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        marginTop: '0.5rem'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
                      }}
                    >
                      <Sparkles size={16} />
                      Auto-Generate Content
                    </button>
                  </div>
                ) : (
                  contentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message ${msg.role === 'USER' ? 'user' : 'assistant'}`}
                    >
                      {msg.role === 'ASSISTANT' && (
                        <div className="message-avatar assistant-avatar" style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}>
                          <FileText size={16} />
                        </div>
                      )}
                      <div className="message-main">
                        <div className="message-meta">
                          <span className="message-author">
                            {msg.role === 'USER'
                              ? (user?.name || ('You'))
                              : ('Content Writer')}
                          </span>
                          {typeof msg.metadata === 'object' && msg.metadata && 'label' in msg.metadata ? (
                            <span className="message-tag">{String((msg.metadata as Record<string, unknown>).label)}</span>
                          ) : null}
                        </div>
                        <div className="message-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={reactMarkdownComponents}>
                            {msg.content.replace(/^\[Content Prompt\] |^\[Content Assistant - [^\]]+\]\n\n/, '')}
                          </ReactMarkdown>
                        </div>
                        {msg.role === 'ASSISTANT' && (
                          <div className="message-tools">
                            <button
                              className="message-copy-btn"
                              onClick={() => navigator.clipboard.writeText(
                                msg.content.replace(/^\[Content Assistant - [^\]]+\]\n\n/, '')
                              )}
                              aria-label={'Copy content'}
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {assistLoading && (
                  <div className="message assistant loading-message">
                    <div className="message-avatar assistant-avatar" style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}><FileText size={16} /></div>
                    <div className="message-main">
                      <div className="message-content typing-bubble">
                        <div className="typing-indicator"><span /><span /><span /><span /></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={contentMessagesEndRef} />
              </div>

              <AnimatePresence>
                {showContentScrollDown && (
                  <motion.button
                    className="btn-scroll-down"
                    initial={{ opacity: 0, y: 10, scale: 0.9, x: "-50%" }}
                    animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                    exit={{ opacity: 0, y: 10, scale: 0.9, x: "-50%" }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => scrollToBottom(contentMessagesEndRef)}
                    aria-label="Scroll to bottom"
                  >
                    <ArrowDown size={20} />
                  </motion.button>
                )}
              </AnimatePresence>

              <div className="chat-input-wrapper">
                <div className="chat-input">
                  <textarea
                    value={contentInput}
                    onChange={(e) => setContentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendContent();
                      }
                    }}
                    placeholder={contentPaneMode.placeholder}
                    rows={1}
                    disabled={assistLoading || !contentPaneMode.enabled}
                    className="chat-ext-46"
                  />
                  <button
                    className="send-btn"
                    onClick={() => handleSendContent()}
                    disabled={!contentInput.trim() || assistLoading || !contentPaneMode.enabled}
                    aria-label={'Send'}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Quiz Modal */}
      <AnimatePresence>
        {editQuizModalOpen && (
          <EditQuizModal
            isOpen={editQuizModalOpen}
            onClose={() => setEditQuizModalOpen(false)}
            onSave={handleSaveAllQuizFields}
            initialData={currentCampaign?.quizData || {}}
          />
        )}
      </AnimatePresence>

      {/* Clear Chat Modal */}
      <ClearChatModal isOpen={clearModalOpen} onClose={() => setClearModalOpen(false)} onConfirm={handleClear} />

      {/* Delete Campaign Modal */}
      <DeleteCampaignModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDeleteCampaign} />

      {/* Guide Popup Modal -- multi-tab walkthrough. Auto-shows the first
          time a user lands on the chat page (gated by localStorage). */}
      <GuidePopupModal isOpen={guidePopupOpen} onClose={() => setGuidePopupOpen(false)} activeTab={guideActiveTab} setActiveTab={setGuideActiveTab} />

      {/* Campaign Insights Modal */}
      <AnimatePresence>
        {insightsOpen && currentCampaign && (
          <motion.div
            className="modal-overlay insights-modal-overlay chat-ext-47"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInsightsOpen(false)}
            
          >
            <motion.div
              className="insights-modal-content"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="insights-modal-header">
                <div className="insights-modal-header-left">
                  <div className="insights-modal-icon">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h3>{'Campaign Insights'}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setInsightsOpen(false)}
                  className="insights-close-btn"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="insights-modal-toolbar">
                <p className="insights-modal-toolbar-hint">
                  {'Send this panel�fs quiz answers, targets, and latest snapshots to the strategist in one message.'}
                </p>
                <button
                  type="button"
                  className="insights-ai-submit-btn"
                  onClick={handleSendInsightsToAi}
                  disabled={loading || !campaignId}
                >
                  <Sparkles size={15} />
                  {'Ask AI to review'}
                </button>
              </div>

              <div 
                className="insights-modal-body" 
                data-lenis-prevent="true"
                ref={insightsScrollRef}
                onScroll={(e) => handleScrollToTopVisible(e, setShowInsightsBackToTop)}
              >
                <div className="insights-grid">
                  {/* Left Column - Quiz Progress */}
                  <div className="insights-card">
                    <div className="insights-card-header" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(236,72,153,0.08))' }}>
                      <div className="chat-ext-48">
                        <ListChecks size={16} className="chat-ext-49" />
                        <h3>{'Quiz Progress'}</h3>
                      </div>
                      <div className="chat-ext-50">
                        <span className="insights-pill">{progressPercent}%</span>
                      </div>
                    </div>
                      <div className="insights-card-pad">
                        <button
                          type="button"
                          className="insights-section-toggle"
                          aria-expanded={insightSections.quizProgress}
                          onClick={() => setInsightSections((s) => ({ ...s, quizProgress: !s.quizProgress }))}
                        >
                          {insightSections.quizProgress ? <Minus size={14} /> : <Plus size={14} />}
                          <span>{'Stage overview'}</span>
                        </button>
                        {insightSections.quizProgress && (
                          <div className="insights-progress">
                            <div className="insights-progress-bar">
                              <div className="insights-progress-fill" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <div className="insights-progress-meta">
                              <span>
                                {`${completedStages} / ${totalStages || '-'} stages`}
                              </span>
                              {currentCampaign.quizProgress?.lastUpdated && (
                                <span className="chat-ext-51">
                                  {new Date(currentCampaign.quizProgress.lastUpdated).toLocaleDateString('en-US')}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="insights-stage-compare insights-stage-compare--tight">
                          <div className="insights-section-head chat-ext-52">
                            <button
                              type="button"
                              className="insights-section-toggle"
                              aria-expanded={insightSections.quizAnswers}
                              onClick={() => setInsightSections((s) => ({ ...s, quizAnswers: !s.quizAnswers }))}
                            >
                              {insightSections.quizAnswers ? <Minus size={14} /> : <Plus size={14} />}
                              <BookOpen size={14} className="chat-ext-53" />
                              <span>{'Quiz Answers'}</span>
                            </button>
                            <button
                              type="button"
                              className="chat-ext-54"
                              onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent)'}
                              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditQuizModalOpen(true);
                              }}
                              title="Edit Quiz Responses"
                            >
                              <Edit2 size={13} />
                              <span>Edit Quiz</span>
                            </button>
                          </div>
                          {insightSections.quizAnswers && (
                            <div className="insights-stage-list">
                              {fullQuizProfile.length === 0 ? (
                                <p className="chat-ext-55">
                                  {'No data yet.'}
                                </p>
                              ) : (
                                fullQuizProfile.map((item, idx) => {
                                  const qh = INSIGHT_QUIZ_HINTS[item.key];
                                  return (
                                    <div key={idx} className="insights-stage-item">
                                      <span className="insights-stage-key chat-ext-56">
                                        {item.icon}
                                        <span>
                                          {item.label}
                                          {qh && <span className="insights-field-hint">{` (${qh})`}</span>}
                                        </span>
                                      </span>
                                      <span className="insights-stage-value chat-ext-57">
                                        {editingQuizField === item.key ? (
                                          <div className="chat-ext-58">
                                            <input
                                              type="text"
                                              className="form-input chat-ext-59"
                                              autoFocus
                                              value={editingQuizValue}
                                              onChange={(e) => setEditingQuizValue(e.target.value)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveQuizField(item.key);
                                                if (e.key === 'Escape') setEditingQuizField(null);
                                              }}
                                            />
                                            <button
                                              type="button"
                                              className="chat-ext-60"
                                              onClick={() => handleSaveQuizField(item.key)}
                                            >
                                              Save
                                            </button>
                                            <button
                                              type="button"
                                              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ccc', padding: '0 0.4rem', borderRadius: '4px', fontSize: '0.7rem', height: '24px', cursor: 'pointer' }}
                                              onClick={() => setEditingQuizField(null)}
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        ) : (
                                          <span style={{ color: item.isMissing ? '#ef4444' : 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            {item.value}
                                            {item.isMissing && (
                                              <button
                                                type="button"
                                                className="chat-ext-61"
                                                onClick={() => {
                                                  setEditingQuizField(item.key);
                                                  setEditingQuizValue('');
                                                }}
                                                title="Update missing data"
                                              >
                                                <Pencil size={12} />
                                              </button>
                                            )}
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>

                      {(activeTargets.length > 0 || currentCampaign.quizData?.deadline) && (
                        <div className="insights-stage-compare" style={{ borderTop: '1px solid rgba(16,185,129,0.2)' }}>
                          <div className="insights-section-head">
                            <button
                              type="button"
                              className="insights-section-toggle"
                              aria-expanded={insightSections.stage2Targets}
                              onClick={() => setInsightSections((s) => ({ ...s, stage2Targets: !s.stage2Targets }))}
                            >
                              {insightSections.stage2Targets ? <Minus size={14} /> : <Plus size={14} />}
                              <Target size={14} className="chat-ext-62" />
                              <span>{'Active Targets & Milestones'}</span>
                            </button>
                          </div>
                          {insightSections.stage2Targets && (
                            <div className="insights-stage-list">
                              {currentCampaign.quizData?.deadline && currentCampaign.quizData.deadline !== 'not_sure' && (
                                <div className="insights-stage-item">
                                  <span className="insights-stage-key">
                                    {'Deadline'}
                                    <span className="insights-field-hint">{' (launch or review date)'}</span>
                                  </span>
                                  <span className="insights-stage-value">{currentCampaign.quizData.deadline}</span>
                                </div>
                              )}
                              {activeTargets.map(t => (
                                <div className="insights-kpi-row" key={t.key}>
                                  <div className="insights-kpi-head">
                                    <span className="insights-stage-key">
                                      {t.label}
                                      <span className="insights-field-hint">{` (${t.hint})`}</span>
                                    </span>
                                    <span className={`insights-kpi-status insights-kpi-status--${t.status.tone}`}>{t.status.label}</span>
                                  </div>
                                  <div className="insights-kpi-track">
                                    <div className={`insights-kpi-fill insights-kpi-fill--${t.status.tone}`} style={{ width: `${Math.min(100, t.status.pct)}%` }} />
                                  </div>
                                  <span className="insights-stage-value">
                                    {t.isCost ? `$${t.actual.toFixed(2)} / $${t.target.toFixed(2)}` : `${t.actual.toFixed(2)}% / ${t.target.toFixed(2)}%`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Metrics */}
                  <div className="insights-card">
                    <div className="insights-card-header" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.08))' }}>
                      <div className="chat-ext-63">
                        <BarChart3 size={16} className="chat-ext-64" />
                        <h3>{'Metrics Snapshots'}</h3>
                      </div>
                      <div className="chat-ext-65">
                        <span className="insights-pill" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>{metricsSnapshots.length}</span>
                        <input
                          ref={csvInputRef}
                          type="file"
                          accept=".csv"
                          className="chat-ext-66"
                          onChange={handleCsvUpload}
                        />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); csvInputRef.current?.click(); }}
                          style={{
                            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                            color: '#34d399', cursor: 'pointer', padding: '0.3rem 0.6rem',
                            borderRadius: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem',
                            fontSize: '0.72rem', fontWeight: 500
                          }}
                        >
                          <Upload size={12} />
                          CSV
                        </button>
                      </div>
                    </div>

                      <div className="insights-card-pad">
                      <button
                        type="button"
                        className="insights-section-toggle"
                        aria-expanded={insightSections.metricsSnapshot}
                        onClick={() => setInsightSections((s) => ({ ...s, metricsSnapshot: !s.metricsSnapshot }))}
                      >
                        {insightSections.metricsSnapshot ? <Minus size={14} /> : <Plus size={14} />}
                        <BarChart3 size={14} className="chat-ext-67" />
                        <span>{'Snapshot chart & entry form'}</span>
                      </button>
                      {insightSections.metricsSnapshot && (
                        <>
                          {metricsSnapshots.length > 0 && (
                            <div className="insights-chart-panel chat-ext-68">
                              <TrendLineCharts snapshots={metricsSnapshots} />
                            </div>
                          )}

                          <div className="metrics-form">
                            <div className="metrics-row">
                              <label>
                                {'Label'}
                                <input
                                  type="text"
                                  value={metricsLabel}
                                  placeholder={'Baseline, Month 1...'}
                                  onChange={(e) => setMetricsLabel(e.target.value)}
                                />
                              </label>
                            </div>
                            <div className="metrics-row">
                              <label>
                                {'Start date'}
                                <input
                                  type="date"
                                  value={metricsPeriodStart}
                                  onChange={(e) => setMetricsPeriodStart(e.target.value)}
                                />
                              </label>
                              <label>
                                {'End date'}
                                <input
                                  type="date"
                                  value={metricsPeriodEnd}
                                  onChange={(e) => setMetricsPeriodEnd(e.target.value)}
                                />
                              </label>
                            </div>
                            <div className="metrics-grid">
                              {metricsFields.map((field) => {
                                const targetVal = currentCampaign?.quizData?.[`target_${field.key}`];
                                return (
                                  <label key={field.key}>
                                    <span className="metrics-label-with-hint" title={field.hint}>
                                      {metricLabelWithHint(field)}
                                      {targetVal && <span className="chat-ext-69">(Target: {targetVal})</span>}
                                    </span>
                                    <input
                                      type="text"
                                      value={metricsInputs[field.key] || ''}
                                      onChange={(e) => handleMetricsInputChange(field.key, e.target.value)}
                                    />
                                  </label>
                                );
                              })}
                            </div>
                            <button type="button" className="metrics-save" onClick={handleSaveMetrics}>
                              <Check size={14} />
                              {'Save Snapshot'}
                            </button>
                          </div>
                        </>
                      )}

                      <div className="metrics-compare metrics-compare--insights">
                        <button
                          type="button"
                          className="insights-section-toggle insights-section-toggle--flush"
                          aria-expanded={insightSections.trends}
                          onClick={() => setInsightSections((s) => ({ ...s, trends: !s.trends }))}
                        >
                          {insightSections.trends ? <Minus size={14} /> : <Plus size={14} />}
                          <TrendingUp size={14} className="chat-ext-70" />
                          <span>{'Performance trends'}</span>
                        </button>
                        {insightSections.trends && (
                          <>
                            {latestSnapshot ? (
                              <div className="metrics-compare-list">
                                {metricsFields.map((field) => {
                                  const current = latestSnapshot.metrics?.[field.key];
                                  const previous = previousSnapshot?.metrics?.[field.key];
                                  const delta = computeMetricDelta(current, previous);
                                  const isPositive = delta && delta.diff >= 0;
                                  return (
                                    <div key={field.key} className="metrics-compare-item">
                                      <span className="metrics-compare-label" title={field.hint}>
                                        {metricLabelWithHint(field)}
                                      </span>
                                      <span className="metrics-compare-value">{formatMetricValue(current)}</span>
                                      <span className={`metrics-compare-delta ${isPositive ? 'up' : 'down'}`}>
                                        {delta ? (
                                          <>
                                            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                            {delta.percent !== null ? `${delta.percent.toFixed(1)}%` : delta.diff.toFixed(2)}
                                          </>
                                        ) : (
                                          '-'
                                        )}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="chat-ext-71">
                                {'Add a snapshot to see trends.'}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Log: chronological list of every meaningful event
                    in the campaign so the user has a clean audit trail of
                    what happened and when. */}
                <div className="activity-log">
                  <div className="activity-log-header activity-log-header--toggle">
                    <button
                      type="button"
                      className="insights-section-toggle insights-section-toggle--activity"
                      aria-expanded={insightSections.activity}
                      onClick={() => setInsightSections((s) => ({ ...s, activity: !s.activity }))}
                    >
                      {insightSections.activity ? <Minus size={14} /> : <Plus size={14} />}
                      <BookOpen size={16} className="chat-ext-72" />
                      <h3>{'Activity Log'}</h3>
                    </button>
                  </div>
                  {insightSections.activity && (() => {
                    if (activityEvents.length === 0) {
                      return (
                        <div className="activity-log-empty">
                          <p>
                            {'No activity yet. Complete the Discovery Quiz to get started.'}
                          </p>
                          <button type="button" className="btn btn-secondary btn-sm chat-ext-73" onClick={handleOpenFullQuiz}>
                            {'Open quiz'}
                          </button>
                        </div>
                      );
                    }
                    return (
                      <ol className="activity-log-list">
                        {activityEvents.map(ev => (
                          <li key={ev.id} className={`activity-log-item activity-log-item--${ev.kind}`}>
                            <div className="activity-log-bullet" aria-hidden="true" />
                            <div className="activity-log-body">
                              <div className="activity-log-title">{ev.title}</div>
                              {ev.detail && <div className="activity-log-detail">{ev.detail}</div>}
                              <div className="activity-log-time">
                                {new Date(ev.when).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ol>
                    );
                  })()}
                </div>
              </div>

              <AnimatePresence>
                {showInsightsBackToTop && (
                  <motion.button
                    className="btn-back-to-top"
                    initial={{ opacity: 0, y: 10, scale: 0.9, x: "-50%" }}
                    animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                    exit={{ opacity: 0, y: 10, scale: 0.9, x: "-50%" }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => scrollToTop(insightsScrollRef)}
                    aria-label="Back to top"
                  >
                    <ArrowUp size={20} />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmationModal 
        isOpen={showConfirmModal} 
        data={confirmModalData} 
        onClose={() => setShowConfirmModal(false)} 
        />


      <BrandProfileModal isOpen={brandProfileModalOpen} onClose={() => setBrandProfileModalOpen(false)} />
      <IntegrationsModal isOpen={integrationsModalOpen} onClose={() => setIntegrationsModalOpen(false)} />
      {/* Phase 2 Quiz Popup */}
      <Phase2QuizPopup isOpen={phase2PopupOpen} onClose={() => setPhase2PopupOpen(false)} phase2Step={phase2Step} phase2Questions={phase2Questions as any} phase2Answers={phase2Answers} phase2TextInput={phase2TextInput} setPhase2TextInput={setPhase2TextInput} phase2CustomOpen={phase2CustomOpen} setPhase2CustomOpen={setPhase2CustomOpen} phase2CustomInput={phase2CustomInput} setPhase2CustomInput={setPhase2CustomInput} handlePhase2Answer={handlePhase2Answer} handlePhase2CustomSubmit={handlePhase2CustomSubmit} handlePhase2SkipQuestion={handlePhase2SkipQuestion} handleSkipToStage3={handleSkipToStage3} />
      {/* Glossary Panel */}
      <GlossaryPanel isOpen={glossaryOpen} onClose={() => setGlossaryOpen(false)} glossaryMatches={glossaryMatches} />
    </div>
  );
}

