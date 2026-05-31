import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send, Sparkles, Trash2, Plus, Minus, MessageSquare, ChevronLeft, ChevronRight,
  Settings, LogOut, MoreHorizontal, Pencil, Star, Copy, Check, ListChecks,
  BarChart3, BookOpen, Package, Building, Users, RefreshCw, Zap, ArrowRight, Award,
  Target, Megaphone, DollarSign, Globe, Clock, Briefcase, X, HelpCircle,
  Mail, FileText, Palette, Upload, TrendingUp, TrendingDown, Heart, Smartphone, ShoppingBag
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
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
  quizFieldActivityTitle
} from '../lib/quizDisplay';
import './Chat.css';

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

const metricLabelWithHint = (f: MetricFieldDef) => `${f.label} (${f.hint})`;

const INSIGHT_QUIZ_HINTS: Partial<Record<string, string>> = {
  productName: 'Offer name',
  business: 'Industry / model',
  stage: 'Company maturity',
  audience: 'Who you sell to',
  region: 'Geography',
  platform: 'Touchpoints',
  priceRange: 'Pricing tier',
  goal: 'Primary objective',
  usp: 'Unique Selling Proposition',
  channels: 'Marketing mix',
  currentMarketing: 'Where you are today',
  experience: 'Team skill level',
  competitors: 'Market context',
  timeline: 'Results horizon',
  budget: 'Spend level',
  seasonality: 'Demand peaks',
  contentFormat: 'Creative formats',
  offerType: 'Deal style',
  deadline: 'Stage 2 target date',
  target_ctr: 'Click-through target',
  target_cvr: 'Conversion target',
  target_roas: 'Efficiency target'
};

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

export default function Chat() {
  const { campaignId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  /** Match mobile drawer width to CSS breakpoints so the clip animation stays smooth */
  const [sidebarPanelWidth, setSidebarPanelWidth] = useState(280);

  useEffect(() => {
    const pick = () => {
      const compact =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(max-width: 768px)').matches;
      const w =
        compact
          ? Math.min(320, Math.max(260, Math.round(window.innerWidth * 0.86)))
          : 280;
      setSidebarPanelWidth(w);
    };
    pick();
    window.addEventListener('resize', pick);
    return () => window.removeEventListener('resize', pick);
  }, []);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [activeCampaignMenu, setActiveCampaignMenu] = useState<string | null>(null);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingCampaignId, setDeletingCampaignId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insightSections, setInsightSections] = useState({
    quizProgress: true,
    quizAnswers: true,
    stage2Targets: true,
    metricsSnapshot: true,
    trends: true,
    activity: true
  });
  const [guidePopupOpen, setGuidePopupOpen] = useState(false);
  const [guideActiveTab, setGuideActiveTab] = useState<'overview' | 'stages' | 'panes' | 'metrics' | 'faq'>('overview');
  const [selectedPlanInChat, setSelectedPlanInChat] = useState<string | null>(null);
  const [assistLoading, setAssistLoading] = useState(false);
  const [contentInput, setContentInput] = useState('');
  const [strategyWidth, setStrategyWidth] = useState(60);
  const [isDraggingPane, setIsDraggingPane] = useState(false);
  const [contentPaneCollapsed, setContentPaneCollapsed] = useState(false);
  const [metricsSnapshots, setMetricsSnapshots] = useState<MetricsSnapshot[]>([]);
  const [metricsLabel, setMetricsLabel] = useState('');
  const [metricsPeriodStart, setMetricsPeriodStart] = useState('');
  const [metricsPeriodEnd, setMetricsPeriodEnd] = useState('');
  const [metricsInputs, setMetricsInputs] = useState<Record<string, string>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autostartTriggeredRef = useRef(false);



  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [phase2PopupOpen, setPhase2PopupOpen] = useState(false);
  const [phase2Step, setPhase2Step] = useState(0);
  const [phase2Answers, setPhase2Answers] = useState<Record<string, string>>({});
  const [phase2CustomOpen, setPhase2CustomOpen] = useState(false);
  const [phase2CustomInput, setPhase2CustomInput] = useState('');
  const [phase2TextInput, setPhase2TextInput] = useState('');

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const formatMessageTime = (time: string) =>
    new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

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

  const handleSendContent = async () => {
    if (!contentInput.trim() || !campaignId || assistLoading) return;
    if (!contentPaneMode.enabled) return;
    const prompt = contentInput;
    setContentInput('');
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
      const res = await api.assistContent('custom', campaignId, prompt);
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
      
      const points = values.map((v, i) => {
        const x = values.length === 1 ? VB_W / 2 : padX + (i / (values.length - 1)) * (VB_W - padX * 2);
        const y = padYTop + innerH - ((v - minVal) / range) * innerH;
        return `${x},${y}`;
      }).join(' ');

      const isCostOrRate = ['cpc', 'cpm', 'cpa', 'cpl', 'cac', 'churnRate', 'bounceRate'].includes(field.key);
      const startVal = values[0];
      const endVal = values[values.length - 1];
      
      let color = '#34d399';
      if (targetVal !== null) {
        const metTarget = isCostOrRate ? endVal <= targetVal : endVal >= targetVal;
        color = metTarget ? '#34d399' : '#f43f5e';
      } else {
        const improved = isCostOrRate ? endVal <= startVal : endVal >= startVal;
        color = improved ? '#34d399' : '#f43f5e';
      }
      
      const formatVal = (v: number) => v >= 10 ? v.toFixed(0) : v.toFixed(2);
      const targetY = targetVal !== null ? (padYTop + innerH - ((targetVal - minVal) / range) * innerH) : null;

      return (
        <div style={{ padding: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button onClick={() => setExpandedKey(null)} className="btn-ghost" style={{ padding: '0.4rem', borderRadius: '50%' }}>
                <ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} />
              </button>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{field.label} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>{field.hint}</span></h3>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: color }}>
              {formatVal(endVal)}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem' }}>
            <svg viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ width: '100%', height: 'auto', maxHeight: '400px', overflow: 'visible' }}>
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
                  <polygon 
                    points={`${padX},${padYTop + innerH} ${points} ${VB_W - padX},${padYTop + innerH}`} 
                    fill={`url(#gradient-exp-${field.key})`} 
                  />
                  <motion.polyline
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    fill="none"
                    stroke={color}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
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
          
          const points = values.map((v, i) => {
            const x = values.length === 1 ? VB_W / 2 : padX + (i / (values.length - 1)) * (VB_W - padX * 2);
            const y = padYTop + innerH - ((v - minVal) / range) * innerH;
            return `${x},${y}`;
          }).join(' ');

          const isCostOrRate = ['cpc', 'cpm', 'cpa', 'cpl', 'cac', 'churnRate', 'bounceRate'].includes(field.key);
          const startVal = values[0];
          const endVal = values[values.length - 1];
          // Determine if the trend is improving
          const improved = isCostOrRate ? endVal <= startVal : endVal >= startVal;
          const color = improved ? '#34d399' : '#f43f5e';
          
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }} title={field.hint}>{field.label}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  {formatVal(endVal)}
                </span>
              </div>
              <svg viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ width: '100%', height: '56px', overflow: 'visible' }}>
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
                    <polygon 
                      points={`${padX},${padYTop + innerH} ${points} ${VB_W - padX},${padYTop + innerH}`} 
                      fill={`url(#gradient-${field.key})`} 
                    />
                    <motion.polyline
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.05 }}
                      fill="none"
                      stroke={color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={points}
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

  const hasTargetKeywords = (text: string) => {
    const t = text.toLowerCase();
    return t.includes('target') || t.includes('milestone') || t.includes('kpi') || t.includes('benchmark');
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#60a5fa' }}>Suggested Metric Targets</h4>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {Object.entries(parsed.targets).map(([k, v]) => (
                        <span key={k} style={{ fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                          <strong style={{ color: '#93c5fd' }}>{k.toUpperCase()}</strong>: {String(v)}
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

  const formatMetricValue = (value?: unknown) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') return value.toLocaleString('en-US');
    return String(value);
  };

  const computeMetricDelta = (current?: unknown, previous?: unknown) => {
    if (typeof current !== 'number' || typeof previous !== 'number') return null;
    const diff = current - previous;
    const percent = previous === 0 ? null : (diff / previous) * 100;
    return { diff, percent };
  };

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
        setCurrentCampaign((prev) => (prev ? { ...prev, name: updatedCampaign.name } : prev));
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
      setCurrentCampaign((prev) => (prev ? { ...prev, isFavorite: nextFavoriteState } : prev));
    }

    const res = await api.updateCampaign(id, { isFavorite: nextFavoriteState });
    if (!res.success) {
      setCampaigns((prev) => prev.map((campaign) =>
        campaign.id === id ? { ...campaign, isFavorite: targetCampaign.isFavorite } : campaign
      ));
      if (currentCampaign?.id === id) {
        setCurrentCampaign((prev) => (prev ? { ...prev, isFavorite: targetCampaign.isFavorite } : prev));
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

    const items: { icon: ReactNode; label: string; value: string; key: string }[] = [];
    for (const field of QUIZ_ACTIVITY_FIELDS) {
      const raw = field.read(qd);
      const value = formatQuizAnswerForDisplay(field.key, raw);
      if (!value) continue;
      items.push({
        key: field.key,
        icon: icons[field.key] ?? <Sparkles size={16} />,
        label: labelOverride[field.key] ?? field.label,
        value
      });
    }

    return items;
  }, [currentCampaign?.quizData]);


  const latestSnapshot = metricsSnapshots[0];
  const previousSnapshot = metricsSnapshots[1];
  const targetCtr = Number(currentCampaign?.quizData?.target_ctr || 0);
  const targetCvr = Number(currentCampaign?.quizData?.target_cvr || 0);
  const targetRoas = Number(currentCampaign?.quizData?.target_roas || 0);
  const actualCtr = Number(latestSnapshot?.metrics?.ctr || 0);
  const actualCvr = Number(latestSnapshot?.metrics?.conversionRate || 0);
  const actualRoas = Number(latestSnapshot?.metrics?.roas || 0);
  const getKpiStatus = (actual: number, target: number) => {
    if (!target || target <= 0) return { label: 'No target', tone: 'neutral' as const, pct: 0 };
    const pct = Math.max(0, Math.min(140, (actual / target) * 100));
    if (actual >= target) return { label: 'On track', tone: 'good' as const, pct };
    if (actual >= target * 0.8) return { label: 'Close', tone: 'warn' as const, pct };
    return { label: 'Behind', tone: 'bad' as const, pct };
  };
  const ctrStatus = getKpiStatus(actualCtr, targetCtr);
  const cvrStatus = getKpiStatus(actualCvr, targetCvr);
  const roasStatus = getKpiStatus(actualRoas, targetRoas);

  const buildInsightsAiPrompt = (): string => {
    const lines: string[] = [
      '# 📊 Campaign Performance Report',
      '',
      `**Campaign:** ${currentCampaign?.name ?? 'Untitled'}`,
      `**Current Stage:** ${currentStage} • ${stageDescriptor.title}`,
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
    const hasTargets = (targetCtr > 0 || targetCvr > 0 || targetRoas > 0 || (qd?.deadline && qd.deadline !== 'not_sure'));
    if (hasTargets) {
      lines.push('## 2. KPI Targets');
      lines.push('| KPI | Target | Actual | Status |');
      lines.push('|:----|:-------|:-------|:-------|');
      if (qd?.deadline && qd.deadline !== 'not_sure') {
        lines.push(`| Deadline | ${qd.deadline} | — | — |`);
      }
      if (targetCtr > 0) {
        lines.push(`| CTR (%) | ${targetCtr.toFixed(2)} | ${actualCtr.toFixed(2)} | ${ctrStatus.label} |`);
      }
      if (targetCvr > 0) {
        lines.push(`| Conversion Rate (%) | ${targetCvr.toFixed(2)} | ${actualCvr.toFixed(2)} | ${cvrStatus.label} |`);
      }
      if (targetRoas > 0) {
        lines.push(`| ROAS | ${targetRoas.toFixed(2)} | ${actualRoas.toFixed(2)} | ${roasStatus.label} |`);
      }
      lines.push('');
    }

    // Metrics comparison table
    if (latestSnapshot) {
      lines.push('## 3. Metrics Comparison');
      lines.push(`> Latest: **${latestSnapshot.label || 'Untitled'}** (${latestSnapshot.periodStart?.slice(0, 10) ?? '—'} → ${latestSnapshot.periodEnd?.slice(0, 10) ?? '—'})`);
      if (previousSnapshot) {
        lines.push(`> Previous: **${previousSnapshot.label || 'Untitled'}** (${previousSnapshot.periodStart?.slice(0, 10) ?? '—'} → ${previousSnapshot.periodEnd?.slice(0, 10) ?? '—'})`);
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
        const prevStr = previousSnapshot ? formatMetricValue(prev) : '—';
        const delta = computeMetricDelta(cur, prev);
        const changeStr = delta
          ? `${delta.diff >= 0 ? '+' : ''}${delta.percent !== null ? delta.percent.toFixed(1) + '%' : delta.diff.toFixed(2)}`
          : '—';
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
    lines.push('1. **Performance Summary** — Key highlights and concerns in 2–3 sentences');
    lines.push('2. **Risk Analysis** — Any metrics trending in the wrong direction or missing targets');
    lines.push('3. **Opportunities** — Where can we scale or improve efficiency');
    lines.push('4. **Action Plan** — 3–5 specific, prioritised next steps with expected impact');
    lines.push('5. **Data Gaps** — What additional data would improve this analysis');
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
  const classifyPane = (msg: Message): 'STRATEGY' | 'CONTENT' | 'SYSTEM' => {
    if (msg.pane) return msg.pane;
    if (msg.content.startsWith('[Content Assistant') || msg.content.startsWith('[Content Prompt]')) {
      return 'CONTENT';
    }
    return 'STRATEGY';
  };

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

    // Quiz answers — same formatter as Insights cards (multi-select, audience pruning, readable labels).
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

  const ConfirmationModal = ({
    isOpen,
    data,
    onClose
  }: {
    isOpen: boolean;
    data: { title: string; message: string; onConfirm: () => void } | null;
    onClose: () => void;
  }) => {
    if (!isOpen || !data) return null;
    return (
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
        <motion.div 
          className="modal-container" 
          onClick={e => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          style={{ maxWidth: '450px', background: 'rgba(18, 18, 22, 0.98)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>{data.title}</h3>
            <button className="modal-close" onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
          <div className="modal-body" style={{ padding: '1.5rem', color: '#ccc', lineHeight: 1.6 }}>
            <p>{data.message}</p>
          </div>
          <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
              {'Cancel'}
            </button>
            <button 
              className="btn btn-primary" 
              onClick={data.onConfirm} 
              style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
            >
              {'Reset Stage'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="chat-layout">
      {/* Sidebar: outer animates clipped width; inner stays fixed‑width — no squished/reflow typography */}
      <motion.aside
        className={`chat-sidebar ${sidebarOpen ? '' : 'collapsed'}`}
        aria-hidden={!sidebarOpen}
        initial={false}
        animate={{ width: sidebarOpen ? sidebarPanelWidth : 0 }}
        transition={{ duration: sidebarOpen ? 0.34 : 0.28, ease: [0.4, 0, 0.2, 1] }}
        style={{ pointerEvents: sidebarOpen ? 'auto' : 'none' }}
      >
        <div className="chat-sidebar-inner" style={{ width: sidebarPanelWidth }}>
          <div className="sidebar-header">
            <Link to="/" className="sidebar-logo">
              <Sparkles size={24} />
            </Link>
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(false)}
              aria-label={'Hide sidebar'}
            >
              <ChevronLeft size={18} />
            </button>
          </div>

          <button type="button" className="new-chat-btn" onClick={handleNewChat}>
            <Plus size={18} />
            {'New Chat'}
          </button>

          <div className="sidebar-section" data-lenis-prevent="true">
            <span className="section-label">{'Saved Campaigns'}</span>
            <div className="campaigns-list">
              {sortedCampaigns.map((campaign) => (
                <CampaignItem
                  key={campaign.id}
                  campaign={campaign}
                  isActive={campaign.id === campaignId}
                  isEditing={editingCampaignId === campaign.id}
                  editingName={editingName}
                  menuOpen={activeCampaignMenu === campaign.id}
                  onNavigate={() => navigate(`/chat/${campaign.id}`)}
                  onMenuToggle={() => setActiveCampaignMenu(activeCampaignMenu === campaign.id ? null : campaign.id)}
                  onStartEdit={() => {
                    setEditingCampaignId(campaign.id);
                    setEditingName(campaign.name);
                  }}
                  onEditChange={setEditingName}
                  onEditSubmit={() => handleRenameCampaign(campaign.id)}
                  onEditCancel={() => setEditingCampaignId(null)}
                  onDelete={() => openDeleteModal(campaign.id)}
                  onToggleFavorite={() => handleToggleFavorite(campaign.id)}
                />
              ))}
              {sortedCampaigns.length === 0 && <p className="no-campaigns">{'No campaigns yet'}</p>}
            </div>
          </div>

          <div className="sidebar-footer">
            <div className="user-menu-wrapper" ref={userMenuRef}>
              <button type="button" className="user-profile-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name || 'User'} className="user-avatar-small" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div className="user-avatar-small">{user?.name?.charAt(0) || 'U'}</div>
                )}
                <span className="user-name-text">{user?.name || 'User'}</span>
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    className="user-dropdown"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="user-dropdown-header">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name || 'User'} className="user-avatar-large" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div className="user-avatar-large">{user?.name?.charAt(0) || 'U'}</div>
                      )}
                      <div className="user-dropdown-info">
                        <span className="user-dropdown-name">{user?.name || 'User'}</span>
                        <span className="user-dropdown-email">{user?.email}</span>
                      </div>
                    </div>
                    <div className="user-dropdown-divider" />
                    <button type="button" className="user-dropdown-item" onClick={() => navigate('/settings')}>
                      <Settings size={16} />
                      {'Settings'}
                    </button>
                    <div className="user-dropdown-divider" />
                    <button type="button" className="user-dropdown-item logout" onClick={handleLogout}>
                      <LogOut size={16} />
                      {'Logout'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Chat Area */}
      <div className="chat-main">
        {/* Header */}
        <header className="chat-header">
          <div className="chat-header-left">
            {!sidebarOpen && (
              <button
                className="sidebar-toggle-open"
                onClick={() => setSidebarOpen(true)}
                aria-label={'Show sidebar'}
              >
                <ChevronRight size={18} />
              </button>
            )}

            <div className="chat-title-wrap">
              <h1 className="chat-title">
                {currentCampaign?.name || ('General Marketing Chat')}
              </h1>
              <p className="chat-subtitle">
                {`${messages.length} message${messages.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>

          <div className="chat-header-right">
            {currentCampaign && (
              <div className="chat-stage-timeline" role="list" aria-label={'Campaign stages'}>
                {([0, 1, 2, 3] as const).map(stage => (
                  <button
                    key={stage}
                    type="button"
                    role="listitem"
                    className={`stage-step ${currentStage > stage ? 'completed' : ''} ${currentStage === stage ? 'current' : ''} ${stage < currentStage ? 'clickable' : ''}`}
                    disabled={stage > currentStage || stageTransitionPending}
                    onClick={() => stage < currentStage && handleResetToStage(stage)}
                    aria-current={currentStage === stage ? 'step' : undefined}
                    title={stage < currentStage
                      ? `Return to Stage ${stage} (Warning: Progress after this stage will be reset)`
                      : STAGE_DESCRIPTORS[stage].title}
                  >
                    <div className="stage-dot">
                      {currentStage > stage ? <Check size={12} /> : stage}
                    </div>
                    <span className="stage-label">{STAGE_DESCRIPTORS[stage].title}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="chat-header-actions">
              {currentCampaign && (
                <button
                  className={`chat-action-btn ${insightsOpen ? 'active' : ''}`}
                  onClick={() => setInsightsOpen(true)}
                >
                  <BarChart3 size={16} />
                  <span>{'Insights'}</span>
                </button>
              )}
              <button
                className={`chat-action-btn ${guidePopupOpen ? 'active' : ''}`}
                onClick={() => setGuidePopupOpen(true)}
              >
                <HelpCircle size={16} />
                <span>{'Guide'}</span>
              </button>
              <button
                className={`chat-action-btn ${glossaryOpen ? 'active' : ''}`}
                onClick={() => setGlossaryOpen(!glossaryOpen)}
              >
                <BookOpen size={16} />
              </button>
              <button
                className="chat-action-btn"
                onClick={() => setClearModalOpen(true)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Stage banner: always visible when a campaign is open. Tells the user
            where they are and what the next action should be. */}
        {currentCampaign && (
          <div className={`stage-banner stage-banner--stage-${currentStage}`}>
            <div className="stage-banner-text">
              <strong className="stage-banner-title">
                {`${'Stage'} ${currentStage} \u2022 ${stageDescriptor.title}`}
              </strong>
              <p className="stage-banner-subtitle">{stageDescriptor.subtitle}</p>
              <p className="stage-banner-next">{stageDescriptor.nextAction}</p>
            </div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} style={{ color: 'var(--accent)' }} />
                <h3>{'Strategy Analyst'}</h3>
              </div>
            </div>
            {/* Messages */}
            <div className="chat-messages" data-lenis-prevent="true">
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
                                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
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
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleAdvanceStage(2)}
                                    disabled={loading}
                                    style={{ marginTop: '0.75rem' }}
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
                          ) : msg.content.startsWith('# 📊 Campaign Performance Report') ? (
                            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                                <BarChart3 size={16} style={{ color: '#34d399' }} />
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Campaign Data Provided to AI</span>
                              </div>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
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
                              className="message-copy-btn"
                              onClick={() => {
                                setContentInput(`Please write marketing content based on the strategy from the left pane...`);
                                setTimeout(() => {
                                  const inputField = document.querySelector('.content-pane textarea') as HTMLTextAreaElement;
                                  if (inputField) inputField.focus();
                                }, 100);
                              }}
                              title={'Send to Content Writer'}
                              style={{ color: '#34d399' }}
                            >
                              <ArrowRight size={14} />
                            </button>
                          )}
                          {msg.role === 'ASSISTANT' && hasTargetKeywords(msg.content) && (
                            <button
                              className="message-copy-btn"
                              onClick={() => handleExtractTargets(msg.content)}
                              title={'Extract & Apply Targets'}
                              style={{ color: '#3b82f6' }}
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
                          <img src={user.avatar} alt={user.name || 'User'} className="message-avatar user-avatar" style={{ objectFit: 'cover' }} />
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
                          <span /><span /><span />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

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
              <div className="chat-pane-header" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={16} style={{ color: '#34d399' }} />
                  <h3 style={{ color: '#34d399' }}>{'Content Writer'}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setContentPaneCollapsed(true)}
                  className="btn-ghost"
                  title="Hide Content Writer"
                  style={{ width: '28px', height: '28px' }}
                >
                  <X size={14} />
                </button>
              </div>
              <div className="chat-messages" data-lenis-prevent="true">
                {contentMessages.length === 0 ? (
                  <div className="chat-welcome" style={{ marginTop: '2rem' }}>
                    <div className="welcome-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
                      <FileText size={40} />
                    </div>
                    <h2 style={{ fontSize: '1.25rem' }}>{contentPaneMode.emptyTitle}</h2>
                    <p style={{ fontSize: '0.85rem' }}>{contentPaneMode.emptyHint}</p>
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
                        <div className="typing-indicator"><span /><span /><span /></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
                    style={{ padding: '0.8rem 1rem', fontSize: '0.85rem' }}
                  />
                  <button
                    className="send-btn"
                    onClick={handleSendContent}
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

      {/* Clear Chat Modal */}
      <AnimatePresence>
        {clearModalOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setClearModalOpen(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-icon">
                <Trash2 size={32} />
              </div>
              <h3>{'Clear All Messages?'}</h3>
              <p>{'This will permanently delete all messages in this conversation. This action cannot be undone.'}</p>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setClearModalOpen(false)}>
                  {'Cancel'}
                </button>
                <button className="btn btn-danger" onClick={handleClear}>
                  {'Clear All'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Campaign Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteModalOpen(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-icon delete-icon">
                <Trash2 size={32} />
              </div>
              <h3>{'Delete Campaign?'}</h3>
              <p>{'This will permanently delete this campaign and all its messages. This action cannot be undone.'}</p>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setDeleteModalOpen(false)}>
                  {'Cancel'}
                </button>
                <button className="btn btn-danger" onClick={handleDeleteCampaign}>
                  {'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guide Popup Modal -- multi-tab walkthrough. Auto-shows the first
          time a user lands on the chat page (gated by localStorage). */}
      <AnimatePresence>
        {guidePopupOpen && (
          <motion.div
            className="modal-overlay guide-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setGuidePopupOpen(false)}
            style={{ zIndex: 1200 }}
          >
            <motion.div
              className="guide-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="guide-modal-header">
                <div className="guide-modal-title">
                  <div className="guide-modal-icon"><HelpCircle size={20} /></div>
                  <h3>{'How AdVisor Works'}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setGuidePopupOpen(false)}
                  className="guide-modal-close"
                  aria-label={'Close'}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="guide-modal-tabs" role="tablist">
                {([
                  { id: 'overview', label: 'Overview' },
                  { id: 'stages', label: '4 Stages' },
                  { id: 'panes', label: 'Two Panes' },
                  { id: 'metrics', label: 'Metrics' },
                  { id: 'faq', label: 'FAQ' }
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={guideActiveTab === tab.id}
                    className={`guide-modal-tab ${guideActiveTab === tab.id ? 'active' : ''}`}
                    onClick={() => setGuideActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="guide-modal-body" data-lenis-prevent="true">
                {guideActiveTab === 'overview' && (
                  <div className="guide-section">
                    <p>
                      {'AdVisor is a staged workflow: Discovery captures your situation, Strategy produces comparable plans you can pick from, Refinement locks targets the AI will measure against, and Optimisation turns live metrics into concrete next steps.'}
                    </p>
                    <p>
                      {'Use the left sidebar to switch campaigns; the header shows which stage you are in. The Insights panel aggregates your quiz answers, plan choice, Stage 2 targets, and every metrics snapshot so nothing is scattered across threads.'}
                    </p>
                    <ul className="guide-list">
                      <li>{'Stage 0 – Discovery: Full or partial quiz; some questions allow multiple selections so the model sees the real mix of audiences, goals, and channels.'}</li>
                      <li>{'Stage 1 – Strategy: The assistant may return several plan cards. You must tap one plan to continue; optional content drafts can follow before you advance.'}</li>
                      <li>{'Stage 2 – Refinement: Deadline and KPI targets (e.g. CTR, conversion rate, ROAS). You can skip straight to Stage 3 if you prefer; targets still help the AI benchmark later.'}</li>
                      <li>{'Stage 3 – Optimisation: Enter metrics snapshots (or CSV import). Compare period over period and ask the strategist for remediation when trends slip.'}</li>
                      <li>{'Rolling back via the timeline clears later stages but keeps chat history visible for context.'}</li>
                    </ul>
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(124, 58, 237, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-border)' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--accent)', marginBottom: '0.25rem' }}>
                        {'Pro tip'}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {'Collapse the sidebar when you need horizontal room; the strip animates by clipping a fixed inner panel so labels do not jitter. Reopen it from the chevron in the header.'}
                      </p>
                    </div>
                  </div>
                )}

                {guideActiveTab === 'stages' && (
                  <div className="guide-stages-grid">
                    {([0, 1, 2, 3] as const).map(stage => {
                      const desc = STAGE_DESCRIPTORS[stage];
                      return (
                        <div key={stage} className={`guide-stage-card guide-stage-card--${stage}`}>
                          <div className="guide-stage-card-head">
                            <div className="guide-stage-num">{stage}</div>
                            <h4>{desc.title}</h4>
                          </div>
                          <p className="guide-stage-subtitle">{desc.subtitle}</p>
                          <p className="guide-stage-next">{desc.nextAction}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {guideActiveTab === 'panes' && (
                  <div className="guide-section">
                    <h4>{'Campaign sidebar'}</h4>
                    <p>
                      {'Start a new thread, open saved campaigns, and access your account menu. Favorites float to the top; row actions rename, delete, or star a campaign. On small screens the drawer sits above the chat and uses the same smooth width animation as desktop.'}
                    </p>
                    <h4>{'Strategy Analyst (left pane)'}</h4>
                    <p>
                      {'This is where plans are generated, compared, and selected. System messages mark stage advances. After you pick a plan you may see shortcuts to draft content or jump to Stage 2.'}
                    </p>
                    <h4>{'Content Writer (right pane)'}</h4>
                    <p>
                      {'Drafts channel-specific copy once a plan exists so the model can align tone and offer with your chosen direction. If the pane is empty, finish Discovery or open the split view from the resizer.'}
                    </p>
                    <h4>{'Send to Content Writer'}</h4>
                    <p>
                      {'Use the arrow on a strategy message to copy that block into the writer’s input. Edit the prompt before sending if you need a tighter brief.'}
                    </p>
                    <h4>{'Resizable split'}</h4>
                    <p>
                      {'Drag the vertical handle between panes to rebalance reading space. Both columns stay scrollable independently.'}
                    </p>
                  </div>
                )}

                {guideActiveTab === 'metrics' && (
                  <div className="guide-section">
                    <p>
                      {'Campaign Insights is the single place to review structured inputs and outputs: the Quiz Answers card wraps long multi-select values across lines, Stage 2 targets sit beside your latest snapshot, and the activity log lists chronologically—with Profile rows for Discovery answers, Targets rows for deadline and KPIs, plus plans, stages, content, metrics, and any extra campaign fields.'}
                    </p>
                    <p>
                      {'Use Ask AI to review to send quiz answers, Stage 2 targets, and your latest (and previous) metrics snapshot to the strategist in one chat message. Section headers use + / − so you can hide quiz blocks, the snapshot form, performance trends, or the activity log when you want a calmer view.'}
                    </p>
                    <p>
                      {'Metric labels spell out acronyms in parentheses (for example CPC (Cost Per Click), ROAS (Return on Ad Spend)). Hover labels or chart bars for the same hints. The snapshot mini chart plots the first six core fields with a grid and gradient bars; Performance trends compares each field to the prior snapshot when one exists.'}
                    </p>
                    <ul className="guide-list">
                      <li>{'Each snapshot is stored per campaign with its label and timestamp for easy audits.'}</li>
                      <li>{'CSV import helps backfill historical rows; download a template from your analytics stack and map headers consistently.'}</li>
                      <li>{'At Stage 3, mention the newest snapshot when you ask for optimisations so the AI can contrast targets vs actuals.'}</li>
                      <li>{'KPI bands (on track / close / behind) compare the latest reading to the Stage 2 targets you entered.'}</li>
                    </ul>
                  </div>
                )}

                {guideActiveTab === 'faq' && (
                  <div className="guide-section">
                    <h4>{'How do I advance to the next stage?'}</h4>
                    <p>
                      {'Use the in-chat controls: select a plan card in Stage 1, confirm Stage 2 questions (or skip where offered), then use the stage transition prompt when the assistant finishes a milestone summary.'}
                    </p>
                    <h4>{'Can I choose multiple answers in Discovery?'}</h4>
                    <p>
                      {'Yes. Where you see multi-select, tap every option that applies, then Continue. Values are stored as a combined list and shown with wrapping in Insights so long channel or audience mixes stay readable.'}
                    </p>
                    <h4>{'Why does “B2B & B2C” sometimes hide extra B2B/B2C chips?'}</h4>
                    <p>
                      {'Choosing the combined audience preset already implies both sides, so redundant individual B2B/B2C tokens are dropped when we render the profile to avoid duplicate labels.'}
                    </p>
                    <h4>{'Can I redo a stage?'}</h4>
                    <p>
                      {'Yes. Click a completed stage in the header timeline. Anything after that stage is reset so the AI does not mix obsolete plans with new answers.'}
                    </p>
                    <h4>{'Why is the Content Writer disabled?'}</h4>
                    <p>
                      {'It unlocks after Stage 1 because copy drafts need your selected plan and positioning context.'}
                    </p>
                    <h4>{'Where do I see historical answers?'}</h4>
                    <p>
                      {'Open Insights (bar chart icon). Quiz Answers summarises the latest profile; the activity log prefixes rows as Profile vs Targets vs Campaign so timestamps stay easy to scan.'}
                    </p>
                    <h4>{'How are Stage 2 KPIs used?'}</h4>
                    <p>
                      {'Targets appear beside your latest metrics and feed the status chips (on track / close / behind). Mention them when asking for tactical fixes in Stage 3.'}
                    </p>
                    <h4>{'The sidebar animation looks odd on slow devices.'}</h4>
                    <p>
                      {'We animate the outer rail width while keeping the interior layout fixed width, then clip overflow. If you still notice hitches, try closing the sidebar before resizing the browser drastically.'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campaign Insights Modal */}
      <AnimatePresence>
        {insightsOpen && currentCampaign && (
          <motion.div
            className="modal-overlay insights-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInsightsOpen(false)}
            style={{ zIndex: 1100 }}
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
                  {'Send this panel’s quiz answers, targets, and latest snapshots to the strategist in one message.'}
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

              <div className="insights-modal-body" data-lenis-prevent="true">
                <div className="insights-grid">
                  {/* Left Column - Quiz Progress */}
                  <div className="insights-card">
                    <div className="insights-card-header" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(236,72,153,0.08))' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ListChecks size={16} style={{ color: 'var(--accent)' }} />
                        <h3>{'Quiz Progress'}</h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                                <span style={{ fontSize: '0.72rem' }}>
                                  {new Date(currentCampaign.quizProgress.lastUpdated).toLocaleDateString('en-US')}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="insights-stage-compare insights-stage-compare--tight">
                          <div className="insights-section-head">
                            <button
                              type="button"
                              className="insights-section-toggle"
                              aria-expanded={insightSections.quizAnswers}
                              onClick={() => setInsightSections((s) => ({ ...s, quizAnswers: !s.quizAnswers }))}
                            >
                              {insightSections.quizAnswers ? <Minus size={14} /> : <Plus size={14} />}
                              <BookOpen size={14} style={{ color: 'var(--accent)' }} />
                              <span>{'Quiz Answers'}</span>
                            </button>
                          </div>
                          {insightSections.quizAnswers && (
                            <div className="insights-stage-list">
                              {fullQuizProfile.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                  {'No data yet.'}
                                </p>
                              ) : (
                                fullQuizProfile.slice(0, 14).map((item, idx) => {
                                  const qh = INSIGHT_QUIZ_HINTS[item.key];
                                  return (
                                    <div key={idx} className="insights-stage-item">
                                      <span className="insights-stage-key" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                                        {item.icon}
                                        <span>
                                          {item.label}
                                          {qh && <span className="insights-field-hint">{` (${qh})`}</span>}
                                        </span>
                                      </span>
                                      <span className="insights-stage-value">{item.value}</span>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>

                      {(targetCtr > 0 || targetCvr > 0 || targetRoas > 0 || currentCampaign.quizData?.deadline) && (
                        <div className="insights-stage-compare" style={{ borderTop: '1px solid rgba(16,185,129,0.2)' }}>
                          <div className="insights-section-head">
                            <button
                              type="button"
                              className="insights-section-toggle"
                              aria-expanded={insightSections.stage2Targets}
                              onClick={() => setInsightSections((s) => ({ ...s, stage2Targets: !s.stage2Targets }))}
                            >
                              {insightSections.stage2Targets ? <Minus size={14} /> : <Plus size={14} />}
                              <Target size={14} style={{ color: '#34d399' }} />
                              <span>{'Stage 2 targets vs latest'}</span>
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
                              {targetCtr > 0 && (
                                <div className="insights-kpi-row">
                                  <div className="insights-kpi-head">
                                    <span className="insights-stage-key">
                                      {'CTR'}
                                      <span className="insights-field-hint">{' (Click-through rate %)'}</span>
                                    </span>
                                    <span className={`insights-kpi-status insights-kpi-status--${ctrStatus.tone}`}>{ctrStatus.label}</span>
                                  </div>
                                  <div className="insights-kpi-track">
                                    <div className={`insights-kpi-fill insights-kpi-fill--${ctrStatus.tone}`} style={{ width: `${Math.min(100, ctrStatus.pct)}%` }} />
                                  </div>
                                  <span className="insights-stage-value">{`${actualCtr.toFixed(2)}% / ${targetCtr.toFixed(2)}%`}</span>
                                </div>
                              )}
                              {targetCvr > 0 && (
                                <div className="insights-kpi-row">
                                  <div className="insights-kpi-head">
                                    <span className="insights-stage-key">
                                      {'Conversion rate'}
                                      <span className="insights-field-hint">{' (% of sessions that convert)'}</span>
                                    </span>
                                    <span className={`insights-kpi-status insights-kpi-status--${cvrStatus.tone}`}>{cvrStatus.label}</span>
                                  </div>
                                  <div className="insights-kpi-track">
                                    <div className={`insights-kpi-fill insights-kpi-fill--${cvrStatus.tone}`} style={{ width: `${Math.min(100, cvrStatus.pct)}%` }} />
                                  </div>
                                  <span className="insights-stage-value">{`${actualCvr.toFixed(2)}% / ${targetCvr.toFixed(2)}%`}</span>
                                </div>
                              )}
                              {targetRoas > 0 && (
                                <div className="insights-kpi-row">
                                  <div className="insights-kpi-head">
                                    <span className="insights-stage-key">
                                      {'ROAS'}
                                      <span className="insights-field-hint">{' (Return on ad spend)'}</span>
                                    </span>
                                    <span className={`insights-kpi-status insights-kpi-status--${roasStatus.tone}`}>{roasStatus.label}</span>
                                  </div>
                                  <div className="insights-kpi-track">
                                    <div className={`insights-kpi-fill insights-kpi-fill--${roasStatus.tone}`} style={{ width: `${Math.min(100, roasStatus.pct)}%` }} />
                                  </div>
                                  <span className="insights-stage-value">{`${actualRoas.toFixed(2)} / ${targetRoas.toFixed(2)}`}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Metrics */}
                  <div className="insights-card">
                    <div className="insights-card-header" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.08))' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart3 size={16} style={{ color: '#34d399' }} />
                        <h3>{'Metrics Snapshots'}</h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="insights-pill" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>{metricsSnapshots.length}</span>
                        <input
                          ref={csvInputRef}
                          type="file"
                          accept=".csv"
                          style={{ display: 'none' }}
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
                        <BarChart3 size={14} style={{ color: '#34d399' }} />
                        <span>{'Snapshot chart & entry form'}</span>
                      </button>
                      {insightSections.metricsSnapshot && (
                        <>
                          {metricsSnapshots.length > 0 && (
                            <div className="insights-chart-panel" style={{ padding: '0.5rem 0' }}>
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
                                      {targetVal && <span style={{ color: '#60a5fa', marginLeft: '6px', fontSize: '0.75rem' }}>(Target: {targetVal})</span>}
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
                          <TrendingUp size={14} style={{ color: '#34d399' }} />
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
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.35rem 0 0' }}>
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
                      <BookOpen size={16} style={{ color: 'var(--accent)' }} />
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
                          <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }} onClick={handleOpenFullQuiz}>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmationModal 
        isOpen={showConfirmModal} 
        data={confirmModalData} 
        onClose={() => setShowConfirmModal(false)} 
        />

      {/* Phase 2 Quiz Popup */}
      <AnimatePresence>
        {phase2PopupOpen && (
          <motion.div
            className="modal-overlay quiz-popup-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPhase2PopupOpen(false)}
          >
            <motion.div
              className="quiz-popup"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="quiz-popup-header">
                <div className="quiz-popup-header-left">
                  <div className="quiz-popup-icon" style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}>
                    <Check size={20} />
                  </div>
                  <div>
                    <h3>{'Finalize Plan'}</h3>
                    <p>{`Phase 2 - Question ${phase2Step + 1} of ${phase2Questions.length}`}</p>
                  </div>
                </div>
                <div className="quiz-popup-header-right">
                  <button className="quiz-popup-close" onClick={() => setPhase2PopupOpen(false)}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="quiz-popup-progress">
                <motion.div
                  className="quiz-popup-progress-fill"
                  style={{ background: 'linear-gradient(90deg, #10b981, #3b82f6)' }}
                  animate={{ width: `${((phase2Step + 1) / phase2Questions.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={phase2Step}
                  className="quiz-popup-body"
                  data-lenis-prevent="true"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {(() => {
                    const q = phase2Questions[phase2Step];
                    const QIcon = q.icon;
                    const isTextQuestion = q.type === 'text';
                    return (
                      <>
                        <div className="quiz-popup-question" style={{ color: '#10b981' }}>
                          <QIcon size={22} />
                          <span>{q.question}</span>
                        </div>

                        <div className="quiz-popup-options">
                          {isTextQuestion ? (
                            <div className="quiz-popup-text-area">
                              <input
                                type="text"
                                placeholder={q.placeholder || 'Type your answer...'}
                                value={phase2TextInput}
                                onChange={(e) => setPhase2TextInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && phase2TextInput.trim() && handlePhase2Answer(phase2TextInput.trim())}
                                className="quiz-popup-input"
                                autoFocus
                              />
                              <div className="quiz-popup-text-actions">
                                <button
                                  className="quiz-popup-submit"
                                  onClick={() => phase2TextInput.trim() && handlePhase2Answer(phase2TextInput.trim())}
                                  disabled={!phase2TextInput.trim()}
                                >
                                  {'Continue'}
                                  <ChevronRight size={16} />
                                </button>
                              </div>
                            </div>
                          ) : q.options?.map((opt, idx) => (
                            <motion.button
                              key={opt.value}
                              className={`quiz-popup-option ${phase2Answers[q.id] === opt.value ? 'selected' : ''}`}
                              onClick={() => { handlePhase2Answer(opt.value); setPhase2CustomOpen(false); setPhase2TextInput(''); }}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.04 }}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {opt.label}
                            </motion.button>
                          ))}

                          <button
                            className={`quiz-popup-skip-inline ${phase2CustomOpen ? 'active' : ''}`}
                            onClick={() => { setPhase2CustomOpen(!phase2CustomOpen); setPhase2CustomInput(''); }}
                          >
                            <Pencil size={14} />
                            {'Type my own answer'}
                          </button>

                          <AnimatePresence>
                            {phase2CustomOpen && (
                              <motion.div
                                className="quiz-popup-custom-input"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ gridColumn: '1 / -1' }}
                              >
                                <input
                                  type="text"
                                  placeholder={'Type your answer...'}
                                  value={phase2CustomInput}
                                  onChange={(e) => setPhase2CustomInput(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handlePhase2CustomSubmit()}
                                  autoFocus
                                  className="quiz-popup-input"
                                />
                                <div className="quiz-popup-text-actions">
                                  <button className="quiz-popup-submit" onClick={handlePhase2CustomSubmit}>
                                    {'Submit'}
                                    <ChevronRight size={16} />
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <button className="quiz-popup-skip-inline" onClick={() => { handlePhase2SkipQuestion(); setPhase2TextInput(''); }}>
                            <HelpCircle size={14} />
                            {'Skip this question'}
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              </AnimatePresence>
              <div className="quiz-popup-footer">
                <button className="quiz-popup-skip-all" onClick={handleSkipToStage3}>
                  {'Skip Stage 2 and continue to Stage 3'}
                </button>
                <span className="quiz-popup-hint">
                  {'Tip: Targets in Stage 2 are used in Insights for KPI comparison.'}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glossary Panel */}
      <AnimatePresence>
        {glossaryOpen && (
          <motion.aside
            className="quiz-summary-panel glossary-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 1000, background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)', width: '320px', display: 'flex', flexDirection: 'column' }}
          >
            <div className="summary-header" style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{'Marketing Glossary'}</h3>
                <p className="summary-subtitle" style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{'Key terms used by marketers'}</p>
              </div>
              <button className="summary-close" onClick={() => setGlossaryOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div className="summary-list" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }} data-lenis-prevent="true">
              {glossaryMatches.length > 0 && (
                <div className="glossary-section" style={{ marginBottom: '1.5rem' }}>
                  <span className="glossary-section-title" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>{'Suggested for you'}</span>
                  {glossaryMatches.map((entry) => (
                    <div key={entry.id} className="glossary-item" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.875rem', marginBottom: '0.75rem' }}>
                      <div className="glossary-term" style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>{entry.term}</div>
                      <div className="glossary-name" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{entry.name}</div>
                      <p className="glossary-definition" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{entry.definition}</p>
                    </div>
                  ))}
                </div>
              )}
              {glossaryGroups.map((group) => (
                <div key={group.id} className="glossary-section" style={{ marginBottom: '1.5rem' }}>
                  <span className="glossary-section-title" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>{group.label}</span>
                  {getGlossaryByGroup(group.id).map((entry) => (
                    <div key={entry.id} className="glossary-item" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.875rem', marginBottom: '0.75rem' }}>
                      <div className="glossary-term" style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>{entry.term}</div>
                      <div className="glossary-name" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{entry.name}</div>
                      <p className="glossary-definition" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{entry.definition}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

// Campaign item component with actions
interface CampaignItemProps {
  campaign: Campaign;
  isActive: boolean;
  isEditing: boolean;
  editingName: string;
  menuOpen: boolean;
  onNavigate: () => void;
  onMenuToggle: () => void;
  onStartEdit: () => void;
  onEditChange: (name: string) => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

function CampaignItem({
  campaign, isActive, isEditing, editingName, menuOpen,
  onNavigate, onMenuToggle, onStartEdit, onEditChange, onEditSubmit, onEditCancel, onDelete, onToggleFavorite
}: CampaignItemProps) {
  if (isEditing) {
    return (
      <div className="campaign-item editing">
        <input
          type="text"
          value={editingName}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEditSubmit();
            if (e.key === 'Escape') onEditCancel();
          }}
          autoFocus
        />
      </div>
    );
  }

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`campaign-item ${isActive ? 'active' : ''} ${campaign.isFavorite ? 'favorited' : ''}`}
    >
      <button className="campaign-link" onClick={onNavigate}>
        <motion.div whileHover={{ rotate: 15 }}>
          <MessageSquare size={16} className={campaign.isFavorite ? 'favorite-icon' : ''} />
        </motion.div>
        <span>{campaign.name}</span>
      </button>

      <div className="campaign-actions">
        <motion.button 
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className="campaign-action-btn" 
          onClick={onMenuToggle}
        >
          <MoreHorizontal size={14} />
        </motion.button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="campaign-menu"
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.1 }}
            >
              <button onClick={onStartEdit}>
                <Pencil size={14} />
                {'Rename'}
              </button>
              <button onClick={onToggleFavorite}>
                <Star size={14} fill={campaign.isFavorite ? 'currentColor' : 'none'} />
                {campaign.isFavorite
                  ? ('Unfavorite')
                  : ('Favorite')}
              </button>
              <button className="danger" onClick={onDelete}>
                <Trash2 size={14} />
                {'Delete'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
