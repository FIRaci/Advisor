import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Sparkles, Trash2, Plus, MessageSquare, ChevronLeft, ChevronRight, 
  Settings, LogOut, MoreHorizontal, Pencil, Star, Copy, Check, ListChecks,
  BarChart3, BookOpen, Package, Building, Users, RefreshCw, Zap, ArrowRight, Award,
  Target, Megaphone, DollarSign, Globe, Clock, Briefcase, X, HelpCircle,
  Mail, FileText, Palette, Upload, TrendingUp, TrendingDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuthStore } from '../store/authStore';
import { api, Campaign as ApiCampaign, ChatMessage, MetricsSnapshot, QuizProgress } from '../hooks/useApi';
import { findGlossaryMatches, summarizeGlossary, glossaryGroups, getGlossaryByGroup } from '../utils/marketingGlossary';
import './Chat.css';

type Message = ChatMessage;

const metricsFields = [
  { key: 'cpc', label: { en: 'CPC', vi: 'CPC' } },
  { key: 'cpm', label: { en: 'CPM', vi: 'CPM' } },
  { key: 'cpa', label: { en: 'CPA', vi: 'CPA' } },
  { key: 'cpl', label: { en: 'CPL', vi: 'CPL' } },
  { key: 'cac', label: { en: 'CAC', vi: 'CAC' } },
  { key: 'ltv', label: { en: 'LTV', vi: 'LTV' } },
  { key: 'retentionRate', label: { en: 'Retention Rate (%)', vi: 'Ty le giu chan (%)' } },
  { key: 'churnRate', label: { en: 'Churn Rate (%)', vi: 'Ty le roi bo (%)' } },
  { key: 'engagementRate', label: { en: 'Engagement Rate (%)', vi: 'Ty le tuong tac (%)' } },
  { key: 'bounceRate', label: { en: 'Bounce Rate (%)', vi: 'Ty le thoat (%)' } },
  { key: 'sessionDuration', label: { en: 'Session Duration (sec)', vi: 'Thoi gian phien (giay)' } },
  { key: 'roas', label: { en: 'ROAS', vi: 'ROAS' } }
];

interface Campaign extends Pick<ApiCampaign, 'id' | 'name' | 'createdAt' | 'isFavorite'> {
  status?: ApiCampaign['status'];
  quizData?: Record<string, string>;
  quizProgress?: QuizProgress;
  strategy?: Record<string, unknown>;
}

// Quick quiz questions for the inline popup (subset of full quiz)
const quickQuizQuestions = [
  {
    id: 'productName',
    icon: Package,
    question: { en: 'What is your product or service name?', vi: 'Tên sản phẩm hoặc dịch vụ của bạn?' },
    type: 'text' as const,
    placeholder: { en: 'Enter product/service name...', vi: 'Nhập tên sản phẩm/dịch vụ...' }
  },
  {
    id: 'business',
    icon: Building,
    question: { en: 'What type of business?', vi: 'Loại hình doanh nghiệp?' },
    type: 'select' as const,
    options: [
      { value: 'ecommerce', label: { en: 'E-commerce', vi: 'Thương mại điện tử' } },
      { value: 'saas', label: { en: 'SaaS / Software', vi: 'SaaS / Phần mềm' } },
      { value: 'service', label: { en: 'Professional Services', vi: 'Dịch vụ chuyên nghiệp' } },
      { value: 'local', label: { en: 'Local Business', vi: 'Kinh doanh địa phương' } },
      { value: 'education', label: { en: 'Education', vi: 'Giáo dục' } },
      { value: 'food', label: { en: 'Food & Beverage', vi: 'Thực phẩm & Đồ uống' } },
    ]
  },
  {
    id: 'audience',
    icon: Users,
    question: { en: 'Target audience?', vi: 'Đối tượng khách hàng?' },
    type: 'select' as const,
    options: [
      { value: 'b2b', label: { en: 'B2B (Businesses)', vi: 'B2B (Doanh nghiệp)' } },
      { value: 'b2c', label: { en: 'B2C (Consumers)', vi: 'B2C (Người tiêu dùng)' } },
      { value: 'both', label: { en: 'Both B2B and B2C', vi: 'Cả B2B và B2C' } },
      { value: 'genz', label: { en: 'Gen Z (18-25)', vi: 'Gen Z (18-25)' } },
      { value: 'millennials', label: { en: 'Millennials (26-40)', vi: 'Millennials (26-40)' } },
    ]
  },
  {
    id: 'goal',
    icon: Target,
    question: { en: 'Main marketing goal?', vi: 'Mục tiêu marketing chính?' },
    type: 'select' as const,
    options: [
      { value: 'awareness', label: { en: 'Brand Awareness', vi: 'Nhận diện thương hiệu' } },
      { value: 'leads', label: { en: 'Generate Leads', vi: 'Tạo khách hàng tiềm năng' } },
      { value: 'sales', label: { en: 'Increase Sales', vi: 'Tăng doanh số' } },
      { value: 'traffic', label: { en: 'Website Traffic', vi: 'Lưu lượng website' } },
      { value: 'engagement', label: { en: 'Social Engagement', vi: 'Tương tác MXH' } },
    ]
  },
  {
    id: 'budget',
    icon: DollarSign,
    question: { en: 'Monthly budget?', vi: 'Ngân sách hàng tháng?' },
    type: 'select' as const,
    options: [
      { value: 'minimal', label: { en: 'Under $500', vi: 'Dưới $500' } },
      { value: 'small', label: { en: '$500 - $1,000', vi: '$500 - $1,000' } },
      { value: 'medium', label: { en: '$1,000 - $5,000', vi: '$1,000 - $5,000' } },
      { value: 'large', label: { en: '$5,000+', vi: '$5,000+' } },
    ]
  }
];

const phase2Questions = [
  {
    id: 'channels',
    icon: Globe,
    question: { en: 'Which channels to focus on?', vi: 'Tập trung vào kênh nào?' },
    type: 'select' as const,
    options: [
      { value: 'social', label: { en: 'Social Media', vi: 'Mạng xã hội' } },
      { value: 'search', label: { en: 'Search (SEO/SEM)', vi: 'Tìm kiếm' } },
      { value: 'email', label: { en: 'Email Marketing', vi: 'Email' } },
      { value: 'offline', label: { en: 'Offline / OOH', vi: 'Offline / OOH' } }
    ]
  },
  {
    id: 'budget_alloc',
    icon: DollarSign,
    question: { en: 'Primary budget allocation?', vi: 'Ngân sách chủ yếu cho?' },
    type: 'select' as const,
    options: [
      { value: 'ads', label: { en: 'Paid Ads', vi: 'Quảng cáo trả phí' } },
      { value: 'content', label: { en: 'Content Production', vi: 'Sản xuất nội dung' } },
      { value: 'influencer', label: { en: 'Influencer Booking', vi: 'KOLs/Influencers' } }
    ]
  },
  {
    id: 'timeline',
    icon: Clock,
    question: { en: 'Expected campaign duration?', vi: 'Thời gian chạy dự kiến?' },
    type: 'select' as const,
    options: [
      { value: 'short', label: { en: '1-3 months', vi: '1-3 tháng' } },
      { value: 'medium', label: { en: '3-6 months', vi: '3-6 tháng' } },
      { value: 'long', label: { en: '6+ months', vi: 'Hơn 6 tháng' } }
    ]
  }
];

export default function Chat() {
  const { campaignId } = useParams();
  const [searchParams] = useSearchParams();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { token, user, logout } = useAuthStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [activeCampaignMenu, setActiveCampaignMenu] = useState<string | null>(null);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingCampaignId, setDeletingCampaignId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [guidePopupOpen, setGuidePopupOpen] = useState(false);
  const [selectedPlanInChat, setSelectedPlanInChat] = useState<string | null>(null);
  const [assistLoading, setAssistLoading] = useState(false);
  const [contentInput, setContentInput] = useState('');
  const [strategyWidth, setStrategyWidth] = useState(60);
  const [isDraggingPane, setIsDraggingPane] = useState(false);
  const [metricsSnapshots, setMetricsSnapshots] = useState<MetricsSnapshot[]>([]);
  const [metricsLabel, setMetricsLabel] = useState('');
  const [metricsPeriodStart, setMetricsPeriodStart] = useState('');
  const [metricsPeriodEnd, setMetricsPeriodEnd] = useState('');
  const [metricsInputs, setMetricsInputs] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Inline quiz popup state
  const [quizPopupOpen, setQuizPopupOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizTextInput, setQuizTextInput] = useState('');
  const [quizCustomOpen, setQuizCustomOpen] = useState(false);
  const [quizCustomInput, setQuizCustomInput] = useState('');

  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [phase2PopupOpen, setPhase2PopupOpen] = useState(false);
  const [phase2Step, setPhase2Step] = useState(0);
  const [phase2Answers, setPhase2Answers] = useState<Record<string, string>>({});
  const [phase2CustomOpen, setPhase2CustomOpen] = useState(false);
  const [phase2CustomInput, setPhase2CustomInput] = useState('');

  const glossaryMatches = useMemo(() => {
    if (!currentCampaign) return [];
    return findGlossaryMatches(JSON.stringify(currentCampaign) + JSON.stringify(messages));
  }, [currentCampaign, messages]);

  const lang = i18n.language as 'en' | 'vi';
  const isLoggedIn = Boolean(token);

  // Compute current stage from quizData
  const currentStage = useMemo(() => {
    if (!currentCampaign?.quizData) return 0; // No quiz done
    const qd = currentCampaign.quizData;
    if (qd.phase === '3') return 3;
    if (qd.phase === '2') return 2;
    if (Object.keys(qd).length > 0) return 1;
    return 0;
  }, [currentCampaign]);

  // Parse plan options from AI response
  const parsePlanOptions = (content: string) => {
    const planRegex = /\[PLAN_(A|B|C)\]([\s\S]*?)\[\/PLAN_\1\]/g;
    const plans: { id: string; content: string }[] = [];
    let match;
    while ((match = planRegex.exec(content)) !== null) {
      plans.push({ id: match[1], content: match[2].trim() });
    }
    return plans;
  };

  // Check if content has stage transition marker
  const hasStageTransition = (content: string) => content.includes('[STAGE_TRANSITION]');

  // Clean content for display (remove markers)
  const cleanContent = (content: string) => {
    return content
      .replace(/\*\*\[PLAN_OPTIONS\]\*\*/g, '')
      .replace(/\[PLAN_(A|B|C)\][\s\S]*?\[\/PLAN_\1\]/g, '')
      .replace(/\[\/PLAN_OPTIONS\]/g, '')
      .replace(/\*\*\[STAGE_TRANSITION\]\*\*/g, '')
      .replace(/\[STAGE_TRANSITION\]/g, '')
      .trim();
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
  }, [metricsInputs]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    fetchCampaigns();
    fetchHistory();
    if (campaignId) {
      fetchCurrentCampaign();
      fetchMetricsSnapshots();
    } else {
      setCurrentCampaign(null);
      setMetricsSnapshots([]);
    }
  }, [campaignId, isLoggedIn, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  }, [input]);

  useEffect(() => {
    if (searchParams.get('autostart') === 'true' && messages.length === 0 && !loading && !initialLoading) {
      generateInitialStrategy();
    }
  }, [searchParams, initialLoading, messages.length]);

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
      content,
      createdAt: new Date().toISOString()
    }]);
  };

  const getGenericAiErrorMessage = () =>
    lang === 'en'
      ? 'Sorry, I encountered an error. Please try again.'
      : 'Xin loi, da xay ra loi. Vui long thu lai.';

  const buildCampaignNameFromMessage = (message: string) => {
    const normalized = message.trim().replace(/\s+/g, ' ');
    const short = normalized.slice(0, 72);

    if (short.length > 0) {
      return short;
    }

    const now = new Date();
    const month = now.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { month: 'short' });
    return lang === 'vi' ? `Chiến dịch ${month} ${now.getDate()}` : `Campaign ${month} ${now.getDate()}`;
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

  const generateInitialStrategy = async () => {
    setLoading(true);
    
    const initialPrompt = lang === 'en' 
      ? "Based on the quiz answers I provided, please create a comprehensive marketing strategy for my business. Include specific recommendations for channels, content, budget allocation, and timeline."
      : "Dựa trên các câu trả lời quiz tôi đã cung cấp, hãy tạo một chiến lược marketing toàn diện cho doanh nghiệp của tôi. Bao gồm các khuyến nghị cụ thể về kênh, nội dung, phân bổ ngân sách và thời gian.";

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'USER',
      content: initialPrompt,
      createdAt: new Date().toISOString()
    };

    setMessages([userMessage]);

    const glossaryMatches = findGlossaryMatches(
      `${initialPrompt} ${Object.values(currentCampaign?.quizData || {}).join(' ')}`,
      6
    );
    const glossaryContext = summarizeGlossary(glossaryMatches, lang);
    const context = glossaryContext.length > 0 ? { glossary: glossaryContext } : undefined;

    const res = await api.sendMessage(initialPrompt, campaignId, context);
    const assistantMessage = res.data;

    if (res.success && assistantMessage) {
      setMessages((prev) => [...prev, assistantMessage]);
    } else {
      appendAssistantMessage(
        lang === 'en'
          ? 'Sorry, I encountered an error generating your strategy. Please try sending a message.'
          : 'Xin lỗi, đã xảy ra lỗi khi tạo chiến lược. Vui lòng thử gửi tin nhắn.'
      );
    }
    
    setLoading(false);
    navigate(`/chat/${campaignId}`, { replace: true });
  };

  const handleSend = async () => {
    const nextInput = input.trim();
    if (!nextInput || loading) return;
    const isStartingFromBlank = !campaignId && !currentCampaign?.id;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'USER',
      content: nextInput,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const targetCampaignId = await ensureCampaignForMessage(nextInput);
    if (!targetCampaignId) {
      if (!useAuthStore.getState().token) {
        setLoading(false);
        navigate('/login');
        return;
      }

      appendAssistantMessage(
        lang === 'en'
          ? 'Unable to initialize a new conversation. Please try again.'
          : 'Không thể khởi tạo cuộc trò chuyện mới. Vui lòng thử lại.'
      );
      setLoading(false);
      return;
    }

    const glossaryMatches = findGlossaryMatches(
      `${nextInput} ${Object.values(currentCampaign?.quizData || {}).join(' ')}`,
      6
    );
    const glossaryContext = summarizeGlossary(glossaryMatches, lang);
    const context = glossaryContext.length > 0 ? { glossary: glossaryContext } : undefined;

    const res = await api.sendMessage(nextInput, targetCampaignId, context);
    
    if (res.success && res.data) {
      const { userMessage: savedUserMsg, assistantMessage } = res.data as any;
      
      setMessages((prev) => {
        // Remove the temporary message and add the saved ones
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
      setClearModalOpen(false);
      return;
    }

    const res = await api.clearChatHistory(campaignId);
    if (res.success) {
      setMessages([]);
      setClearModalOpen(false);
    }
  };

  const formatMessageTime = (time: string) =>
    new Date(time).toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

  const handleNewChat = () => {
    navigate('/chat');
  };

  const handleOpenQuiz = () => {
    setQuizPopupOpen(true);
    setQuizStep(0);
    setQuizTextInput('');
  };

  const handleOpenFullQuiz = () => {
    const query = campaignId ? `?campaignId=${campaignId}` : '';
    navigate(`/quiz${query}`, { state: { from: campaignId ? `/chat/${campaignId}` : '/chat' } });
  };

  const handleQuizSkipAll = async () => {
    setQuizPopupOpen(false);
    // Let AI work automatically with whatever answers we have
    if (Object.keys(quizAnswers).length > 0 && campaignId) {
      await api.updateCampaign(campaignId, { quizData: quizAnswers });
      fetchCurrentCampaign();
    }
    focusComposer();
  };

  const handleQuizAnswer = async (value: string) => {
    const currentQ = quickQuizQuestions[quizStep];
    const newAnswers = { ...quizAnswers, [currentQ.id]: value };
    setQuizAnswers(newAnswers);

    if (quizStep < quickQuizQuestions.length - 1) {
      setTimeout(() => {
        setQuizStep(quizStep + 1);
        setQuizTextInput(newAnswers[quickQuizQuestions[quizStep + 1]?.id] || '');
      }, 200);
    } else {
      // All quick questions done - save and close
      setQuizPopupOpen(false);
      
      if (campaignId) {
        await api.updateCampaign(campaignId, { quizData: newAnswers, status: 'ACTIVE' });
        fetchCurrentCampaign();
        // Auto-generate strategy
        generateInitialStrategy();
      }
    }
  };

  const handleQuizTextSubmit = () => {
    const value = quizTextInput.trim() || 'not_sure';
    handleQuizAnswer(value);
  };

  const handleQuizSkipQuestion = () => {
    handleQuizAnswer('not_sure');
    setQuizCustomOpen(false);
    setQuizCustomInput('');
  };

  const handleQuizCustomSubmit = () => {
    const value = quizCustomInput.trim();
    if (!value) return;
    handleQuizAnswer(`custom: ${value}`);
    setQuizCustomOpen(false);
    setQuizCustomInput('');
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
    await api.updateCampaign(campaignId, { quizData: updatedQuizData });
    fetchCurrentCampaign();

    const planText = Object.entries(answers)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    
    const messageContent = lang === 'en' 
      ? `I have selected my plan details: ${planText}. Let's proceed with execution and tracking setup.`
      : `Tôi đã chốt chi tiết kế hoạch: ${planText}. Hãy tiến hành bước triển khai và thiết lập.`;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'USER',
      content: messageContent,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    const res = await api.sendMessage(messageContent, campaignId);
    if (res.success && res.data) {
      const { userMessage: savedUserMsg, assistantMessage } = res.data as any;
      setMessages((prev) => {
        const filtered = prev.filter(m => m.id !== userMessage.id);
        return [...filtered, savedUserMsg, assistantMessage];
      });
      fetchCurrentCampaign();
    }
    setLoading(false);
  };

  const focusComposer = () => {
    textareaRef.current?.focus();
  };

  const handleSelectPlan = async (planId: string, _planContent: string) => {
    if (!campaignId || loading) return;
    setSelectedPlanInChat(planId);
    const updatedQuizData = { ...currentCampaign?.quizData, selectedPlan: planId };
    await api.updateCampaign(campaignId, { quizData: updatedQuizData });
    fetchCurrentCampaign();

    // Send message to AI about selection
    const messageContent = lang === 'en'
      ? `I have selected Plan ${planId}. Let's proceed to Stage 2 to refine the details.`
      : `Tôi đã chọn Plan ${planId}. Hãy chuyển sang Giai đoạn 2 để chi tiết hóa kế hoạch.`;
    setInput('');
    setLoading(true);
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'USER',
      content: messageContent,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await api.sendMessage(messageContent, campaignId);
      if (res.success && res.data) {
        const { userMessage: savedUserMsg, assistantMessage } = res.data as any;
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== userMsg.id);
          return [...filtered, savedUserMsg, assistantMessage];
        });
      }
    } catch (e) { /* handled by fallback */ }
    setLoading(false);
  };

  const handleAdvanceStage = async (targetStage: number) => {
    if (!campaignId) return;
    if (targetStage === 2) {
      // Open Phase 2 quiz
      setPhase2PopupOpen(true);
      setPhase2Step(0);
    } else if (targetStage === 3) {
      const updatedQuizData = { ...currentCampaign?.quizData, phase: '3' };
      await api.updateCampaign(campaignId, { quizData: updatedQuizData });
      fetchCurrentCampaign();
      // Send transition message
      const msg = lang === 'en'
        ? 'Moving to Stage 3: Ongoing Optimization. I will submit periodic reports for AI analysis.'
        : 'Chuyển sang Giai đoạn 3: Tối ưu hóa liên tục. Tôi sẽ gửi báo cáo định kỳ để AI phân tích.';
      setLoading(true);
      const userMsg: Message = { id: Date.now().toString(), role: 'USER', content: msg, createdAt: new Date().toISOString() };
      setMessages(prev => [...prev, userMsg]);
      try {
        const res = await api.sendMessage(msg, campaignId);
        if (res.success && res.data) {
          const { userMessage: savedUserMsg, assistantMessage } = res.data as any;
          setMessages(prev => {
            const filtered = prev.filter(m => m.id !== userMsg.id);
            return [...filtered, savedUserMsg, assistantMessage];
          });
        }
      } catch (e) { /* handled */ }
      setLoading(false);
    }
  };

  const handleAssistContent = async (type: 'email' | 'ad_copy' | 'social_post') => {
    if (!campaignId || assistLoading) return;
    setAssistLoading(true);
    try {
      const res = await api.assistContent(type, campaignId);
      if (res.success && res.data) {
        // Add to chat messages for context
        const assistMsg: Message = {
          id: `assist-${Date.now()}`,
          role: 'ASSISTANT',
          content: (res.data as any).content,
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistMsg]);
      }
    } catch (e) {
      console.error('Failed to generate content', e);
    }
    setAssistLoading(false);
  };

  const handleSendContent = async () => {
    if (!contentInput.trim() || !campaignId || assistLoading) return;
    const prompt = contentInput;
    setContentInput('');
    setAssistLoading(true);

    // Optimistically add user message to right pane
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'USER',
      content: `[Content Prompt] ${prompt}`,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await api.assistContent('custom', campaignId, prompt);
      if (res.success && res.data) {
        const assistMsg: Message = {
          id: `assist-${Date.now()}`,
          role: 'ASSISTANT',
          content: (res.data as any).content,
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistMsg]);
      }
    } catch (e) {
      console.error(e);
    }
    setAssistLoading(false);
  };

  const handleLogout = () => {
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
      const lines = text.trim().split('\n');
      if (lines.length < 2) return;
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const values = lines[1].split(',').map(v => v.trim());
      const newInputs: Record<string, string> = {};
      metricsFields.forEach(field => {
        const idx = headers.findIndex(h => 
          h === field.key.toLowerCase() || 
          h === field.label.en.toLowerCase() ||
          h === field.label.vi.toLowerCase()
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

  // SVG Mini Bar Chart for metrics visualization
  const MiniBarChart = ({ data, height = 80 }: { data: { label: string; value: number; color?: string }[]; height?: number }) => {
    if (!data.length || data.every(d => d.value === 0)) return null;
    const maxVal = Math.max(...data.map(d => d.value));
    const barWidth = Math.min(32, Math.floor(240 / data.length) - 4);
    const chartWidth = data.length * (barWidth + 4);
    return (
      <svg width={chartWidth} height={height + 20} viewBox={`0 0 ${chartWidth} ${height + 20}`} style={{ display: 'block', margin: '0.75rem auto 0' }}>
        {data.map((d, i) => {
          const barH = maxVal > 0 ? (d.value / maxVal) * height : 0;
          return (
            <g key={i}>
              <rect
                x={i * (barWidth + 4)}
                y={height - barH}
                width={barWidth}
                height={barH}
                rx={4}
                fill={d.color || 'url(#barGrad)'}
                opacity={0.85}
              />
              <text
                x={i * (barWidth + 4) + barWidth / 2}
                y={height + 14}
                textAnchor="middle"
                fill="var(--text-muted)"
                fontSize="8"
              >
                {d.label.slice(0, 4)}
              </text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReanalyze = async () => {
    if (loading || !campaignId) return;
    const lastUserMsg = messages.slice().reverse().find(m => m.role === 'USER');
    const textToResend = lastUserMsg ? lastUserMsg.content : (lang === 'en' ? 'Please reanalyze the strategy.' : 'Vui lòng phân tích lại chiến lược.');
    
    setLoading(true);
    const generatedId = `${Date.now()}-retry`;
    setMessages((prev) => [...prev, {
      id: generatedId,
      role: 'USER',
      content: textToResend,
      createdAt: new Date().toISOString()
    }]);

    try {
      const res = await api.sendMessage(textToResend, campaignId);
      if (res.success && res.data) {
        const { userMessage: savedUserMsg, assistantMessage } = res.data as any;
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
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
    if (!metricsPeriodStart || !metricsPeriodEnd) {
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

  const formatMetricValue = (value?: unknown) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') return value.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US');
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
  const getFullQuizProfile = () => {
    if (!currentCampaign?.quizData) return [];
    const quizData = currentCampaign.quizData;
    
    // Mapping values to display labels
    const businessLabels: Record<string, { en: string; vi: string }> = {
      ecommerce: { en: 'E-commerce', vi: 'Thương mại điện tử' },
      saas: { en: 'SaaS / Software', vi: 'SaaS / Phần mềm' },
      service: { en: 'Professional Services', vi: 'Dịch vụ chuyên nghiệp' },
      local: { en: 'Local Business', vi: 'Kinh doanh địa phương' },
      agency: { en: 'Marketing Agency', vi: 'Công ty Marketing' },
      education: { en: 'Education', vi: 'Giáo dục' },
      healthcare: { en: 'Healthcare', vi: 'Y tế' },
      fintech: { en: 'Fintech', vi: 'Fintech' },
      food: { en: 'Food & Beverage', vi: 'Thực phẩm & Đồ uống' },
      travel: { en: 'Travel', vi: 'Du lịch' },
      realestate: { en: 'Real Estate', vi: 'Bất động sản' },
      entertainment: { en: 'Entertainment', vi: 'Giải trí' }
    };
    
    const audienceLabels: Record<string, { en: string; vi: string }> = {
      b2b: { en: 'B2B', vi: 'B2B' },
      b2c: { en: 'B2C', vi: 'B2C' },
      both: { en: 'B2B & B2C', vi: 'B2B & B2C' },
      genz: { en: 'Gen Z (18-25)', vi: 'Gen Z (18-25)' },
      millennials: { en: 'Millennials (26-40)', vi: 'Millennials (26-40)' },
      genx: { en: 'Gen X+ (40+)', vi: 'Gen X+ (40+)' },
      enterprise: { en: 'Enterprise', vi: 'Doanh nghiệp lớn' },
      startups: { en: 'Startups & SMBs', vi: 'Startup & SMB' },
      women: { en: 'Women', vi: 'Phụ nữ' },
      men: { en: 'Men', vi: 'Nam giới' },
      parents: { en: 'Parents', vi: 'Phụ huynh' },
      students: { en: 'Students', vi: 'Sinh viên' }
    };
    
    const goalLabels: Record<string, { en: string; vi: string }> = {
      awareness: { en: 'Brand Awareness', vi: 'Nhận diện thương hiệu' },
      leads: { en: 'Lead Generation', vi: 'Tạo khách hàng tiềm năng' },
      sales: { en: 'Increase Sales', vi: 'Tăng doanh số' },
      retention: { en: 'Customer Retention', vi: 'Giữ chân khách hàng' },
      traffic: { en: 'Website Traffic', vi: 'Lưu lượng website' },
      engagement: { en: 'Social Engagement', vi: 'Tương tác MXH' },
      launch: { en: 'Product Launch', vi: 'Ra mắt sản phẩm' },
      reputation: { en: 'Reputation', vi: 'Danh tiếng' },
      appinstalls: { en: 'App Installs', vi: 'Cài đặt app' },
      community: { en: 'Community', vi: 'Cộng đồng' }
    };
    
    const channelLabels: Record<string, { en: string; vi: string }> = {
      social: { en: 'Social Media', vi: 'Mạng xã hội' },
      search: { en: 'Google Ads & SEO', vi: 'Google Ads & SEO' },
      email: { en: 'Email Marketing', vi: 'Email Marketing' },
      content: { en: 'Content / Blog', vi: 'Content / Blog' },
      video: { en: 'YouTube / TikTok', vi: 'YouTube / TikTok' },
      influencer: { en: 'Influencer', vi: 'Influencer' },
      affiliate: { en: 'Affiliate', vi: 'Affiliate' },
      podcast: { en: 'Podcast', vi: 'Podcast' },
      offline: { en: 'Offline / Events', vi: 'Offline / Sự kiện' },
      all: { en: 'Multi-channel', vi: 'Đa kênh' }
    };
    
    const budgetLabels: Record<string, { en: string; vi: string }> = {
      minimal: { en: '< $500', vi: '< $500' },
      small: { en: '$500 - $1,000', vi: '$500 - $1,000' },
      medium: { en: '$1,000 - $5,000', vi: '$1,000 - $5,000' },
      large: { en: '$5,000 - $20,000', vi: '$5,000 - $20,000' },
      enterprise: { en: '$20,000 - $100,000', vi: '$20,000 - $100,000' },
      unlimited: { en: '$100,000+', vi: '$100,000+' }
    };
    
    const regionLabels: Record<string, { en: string; vi: string }> = {
      local: { en: 'Local', vi: 'Địa phương' },
      national: { en: 'National', vi: 'Toàn quốc' },
      regional: { en: 'Southeast Asia', vi: 'Đông Nam Á' },
      asia: { en: 'Asia Pacific', vi: 'Châu Á TBD' },
      us: { en: 'United States', vi: 'Hoa Kỳ' },
      europe: { en: 'Europe', vi: 'Châu Âu' },
      global: { en: 'Global', vi: 'Toàn cầu' }
    };

    const seasonalityLabels: Record<string, { en: string; vi: string }> = {
      none: { en: 'No seasonality', vi: 'Không có mùa vụ rõ ràng' },
      holiday: { en: 'Holiday-driven', vi: 'Theo dịp lễ tết' },
      summer: { en: 'Summer peak', vi: 'Cao điểm mùa hè' },
      yearend: { en: 'Year-end peak', vi: 'Cao điểm cuối năm' },
      event: { en: 'Event-driven', vi: 'Theo sự kiện' },
      always: { en: 'Always-on demand', vi: 'Nhu cầu ổn định' }
    };

    const contentFormatLabels: Record<string, { en: string; vi: string }> = {
      short_video: { en: 'Short videos', vi: 'Video ngắn' },
      long_video: { en: 'Long-form video', vi: 'Video dài' },
      static_visual: { en: 'Static visuals', vi: 'Hình ảnh/carousel' },
      article: { en: 'Articles/blog', vi: 'Bài viết/blog' },
      email: { en: 'Email/newsletter', vi: 'Email/newsletter' },
      mixed: { en: 'Mixed format', vi: 'Kết hợp nhiều định dạng' }
    };

    const offerTypeLabels: Record<string, { en: string; vi: string }> = {
      discount: { en: 'Discount / flash sale', vi: 'Giảm giá / flash sale' },
      bundle: { en: 'Bundle package', vi: 'Gói combo' },
      trial: { en: 'Free trial / freemium', vi: 'Dùng thử / freemium' },
      gift: { en: 'Gift with purchase', vi: 'Tặng quà kèm' },
      consultation: { en: 'Free consultation/demo', vi: 'Tư vấn/demo miễn phí' },
      custom_offer: { en: 'Custom segment offers', vi: 'Ưu đãi theo nhóm khách' }
    };

    const getLabel = (value: string, labels: Record<string, { en: string; vi: string }>) => {
      if (!value || value === 'not_sure') return null;
      if (value.startsWith('custom: ')) return value.replace('custom: ', '');
      return labels[value]?.[lang] || value;
    };

    const items: { icon: ReactNode; label: string; value: string }[] = [];
    
    if (quizData.productName && quizData.productName !== 'not_sure') {
      items.push({ icon: <Package size={16} />, label: lang === 'en' ? 'Product' : 'Sản phẩm', value: quizData.productName });
    }
    
    const businessValue = getLabel(quizData.business, businessLabels);
    if (businessValue) {
      items.push({ icon: <Building size={16} />, label: lang === 'en' ? 'Business' : 'Loại hình', value: businessValue });
    }
    
    const audienceValue = getLabel(quizData.audience, audienceLabels);
    if (audienceValue) {
      items.push({ icon: <Users size={16} />, label: lang === 'en' ? 'Audience' : 'Đối tượng', value: audienceValue });
    }
    
    const goalValue = getLabel(quizData.goal, goalLabels);
    if (goalValue) {
      items.push({ icon: <Target size={16} />, label: lang === 'en' ? 'Goal' : 'Mục tiêu', value: goalValue });
    }
    
    const channelValue = getLabel(quizData.channels, channelLabels);
    if (channelValue) {
      items.push({ icon: <Megaphone size={16} />, label: lang === 'en' ? 'Channels' : 'Kênh', value: channelValue });
    }
    
    const budgetValue = getLabel(quizData.budget, budgetLabels);
    if (budgetValue) {
      items.push({ icon: <DollarSign size={16} />, label: lang === 'en' ? 'Budget' : 'Ngân sách', value: budgetValue });
    }
    
    const regionValue = getLabel(quizData.region, regionLabels);
    if (regionValue) {
      items.push({ icon: <Globe size={16} />, label: lang === 'en' ? 'Region' : 'Khu vực', value: regionValue });
    }

    const seasonalityValue = getLabel(quizData.seasonality, seasonalityLabels);
    if (seasonalityValue) {
      items.push({ icon: <Clock size={16} />, label: lang === 'en' ? 'Seasonality' : 'Mùa vụ', value: seasonalityValue });
    }

    const contentFormatValue = getLabel(quizData.contentFormat, contentFormatLabels);
    if (contentFormatValue) {
      items.push({ icon: <BookOpen size={16} />, label: lang === 'en' ? 'Content Format' : 'Định dạng nội dung', value: contentFormatValue });
    }

    const offerTypeValue = getLabel(quizData.offerType, offerTypeLabels);
    if (offerTypeValue) {
      items.push({ icon: <Star size={16} />, label: lang === 'en' ? 'Offer Type' : 'Loại ưu đãi', value: offerTypeValue });
    }
    
    if (quizData.usp && quizData.usp !== 'not_sure') {
      items.push({ icon: <Pencil size={16} />, label: lang === 'en' ? 'USP' : 'Điểm nổi bật', value: quizData.usp });
    }
    
    if (quizData.competitors && quizData.competitors !== 'not_sure') {
      items.push({ icon: <Briefcase size={16} />, label: lang === 'en' ? 'Competitors' : 'Đối thủ', value: quizData.competitors });
    }
    
    return items;
  };


  const latestSnapshot = metricsSnapshots[0];
  const previousSnapshot = metricsSnapshots[1];
  const completedStages = currentCampaign?.quizProgress?.completedStages?.length || 0;
  const totalStages = currentCampaign?.quizProgress?.totalStages || 0;
  const progressPercent = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

  // Sort campaigns: favorites first, then by date
  const sortedCampaigns = [...campaigns].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const analystMessages = messages.filter(m => !m.content.startsWith('[Content Assistant') && !m.content.startsWith('[Content Prompt]'));
  const contentMessages = messages.filter(m => m.content.startsWith('[Content Assistant') || m.content.startsWith('[Content Prompt]'));
  const showContentPane = currentStage > 0 || analystMessages.length > 0;

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside 
            className="chat-sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          >
            <div className="sidebar-header">
              <Link to="/" className="sidebar-logo">
                <Sparkles size={24} />
              </Link>
              <button
                className="sidebar-toggle"
                onClick={() => setSidebarOpen(false)}
                aria-label={lang === 'en' ? 'Hide sidebar' : 'Ẩn thanh bên'}
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            <button className="new-chat-btn" onClick={handleNewChat}>
              <Plus size={18} />
              {lang === 'en' ? 'New Chat' : 'Chat mới'}
            </button>

            {/* All campaigns (favorites sorted to top) */}
            <div className="sidebar-section">
              <span className="section-label">{lang === 'en' ? 'Saved Campaigns' : 'Chiến dịch đã lưu'}</span>
              <div className="campaigns-list">
                {sortedCampaigns.map((campaign) => (
                  <CampaignItem
                    key={campaign.id}
                    campaign={campaign}
                    isActive={campaign.id === campaignId}
                    isEditing={editingCampaignId === campaign.id}
                    editingName={editingName}
                    menuOpen={activeCampaignMenu === campaign.id}
                    lang={lang}
                    onNavigate={() => navigate(`/chat/${campaign.id}`)}
                    onMenuToggle={() => setActiveCampaignMenu(activeCampaignMenu === campaign.id ? null : campaign.id)}
                    onStartEdit={() => { setEditingCampaignId(campaign.id); setEditingName(campaign.name); }}
                    onEditChange={setEditingName}
                    onEditSubmit={() => handleRenameCampaign(campaign.id)}
                    onEditCancel={() => setEditingCampaignId(null)}
                    onDelete={() => openDeleteModal(campaign.id)}
                    onToggleFavorite={() => handleToggleFavorite(campaign.id)}
                  />
                ))}
                {sortedCampaigns.length === 0 && (
                  <p className="no-campaigns">{lang === 'en' ? 'No campaigns yet' : 'Chưa có chiến dịch'}</p>
                )}
              </div>
            </div>

            {/* Sidebar footer - User profile only */}
            <div className="sidebar-footer">
              <div className="user-menu-wrapper" ref={userMenuRef}>
                <button 
                  className="user-profile-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="user-avatar-small">{user?.name?.charAt(0) || 'U'}</div>
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
                        <div className="user-avatar-large">{user?.name?.charAt(0) || 'U'}</div>
                        <div className="user-dropdown-info">
                          <span className="user-dropdown-name">{user?.name || 'User'}</span>
                          <span className="user-dropdown-email">{user?.email}</span>
                        </div>
                      </div>
                      <div className="user-dropdown-divider" />
                      <button className="user-dropdown-item" onClick={() => navigate('/settings')}>
                        <Settings size={16} />
                        {lang === 'en' ? 'Settings' : 'Cài đặt'}
                      </button>
                      <div className="user-dropdown-divider" />
                      <button className="user-dropdown-item logout" onClick={handleLogout}>
                        <LogOut size={16} />
                        {lang === 'en' ? 'Logout' : 'Đăng xuất'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="chat-main">
        {/* Header */}
        <header className="chat-header">
          <div className="chat-header-left">
            {!sidebarOpen && (
              <button
                className="sidebar-toggle-open"
                onClick={() => setSidebarOpen(true)}
                aria-label={lang === 'en' ? 'Show sidebar' : 'Hiện thanh bên'}
              >
                <ChevronRight size={18} />
              </button>
            )}

            <div className="chat-title-wrap">
              <h1 className="chat-title">
                {currentCampaign?.name || (lang === 'en' ? 'General Marketing Chat' : 'Chat Marketing Tổng Quát')}
              </h1>
              <p className="chat-subtitle">
                {lang === 'en'
                  ? `${messages.length} message${messages.length === 1 ? '' : 's'}`
                  : `${messages.length} tin nhắn`}
              </p>
            </div>
          </div>

          <div className="chat-header-right">
            {currentCampaign && currentStage > 0 && (
              <div className="stage-indicator">
                {[1, 2, 3].map(stage => (
                  <div key={stage} className={`stage-step ${currentStage >= stage ? 'completed' : ''} ${currentStage === stage ? 'current' : ''}`}>
                    <div className="stage-dot">
                      {currentStage > stage ? <Check size={12} /> : stage}
                    </div>
                    <span className="stage-label">
                      {stage === 1 ? (lang === 'en' ? 'Discovery' : 'Khám phá') :
                       stage === 2 ? (lang === 'en' ? 'Refine' : 'Chi tiết') :
                       (lang === 'en' ? 'Optimize' : 'Tối ưu')}
                    </span>
                  </div>
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
                  <span>{lang === 'en' ? 'Insights' : 'Insight'}</span>
                </button>
              )}
              <button
                className={`chat-action-btn ${guidePopupOpen ? 'active' : ''}`}
                onClick={() => setGuidePopupOpen(true)}
              >
                <HelpCircle size={16} />
                <span>{lang === 'en' ? 'Guide' : 'HD'}</span>
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


        {/* Dual Pane Container */}
        <div className="chat-dual-pane-container">
          {/* Strategy Pane */}
          <div className="chat-pane strategy-pane" style={{ width: showContentPane ? `${strategyWidth}%` : '100%', flex: showContentPane ? 'none' : 1 }}>
            <div className="chat-pane-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} style={{color: 'var(--accent)'}} />
                <h3>{lang === 'en' ? 'Strategy Analyst' : 'Phân tích chiến lược'}</h3>
              </div>
            </div>
            {/* Messages */}
            <div className="chat-messages">
          {initialLoading ? (
            <div className="chat-loading">
              <div className="spinner" />
            </div>
          ) : analystMessages.length === 0 ? (
            <div className="chat-welcome">
              <div className="welcome-icon">
                <Sparkles size={40} />
              </div>
              <h2>{lang === 'en' ? 'Welcome to AdVisor' : 'Chào mừng đến với AdVisor'}</h2>
              <p>{lang === 'en' 
                ? 'Ask me anything about marketing strategy, ad copy, or campaign optimization.' 
                : 'Hỏi tôi bất cứ điều gì về chiến lược marketing, nội dung quảng cáo, hoặc tối ưu hóa chiến dịch.'}</p>
              
              {/* Full Quiz Profile Card */}
              {currentCampaign && getFullQuizProfile().length > 0 && (
                <div className="welcome-quiz-profile">
                  <div className="quiz-profile-header">
                    <h4>{lang === 'en' ? 'Your Campaign Profile' : 'Hồ sơ chiến dịch'}</h4>
                  </div>
                  <div className="quiz-profile-grid">
                    {getFullQuizProfile().map((item, i) => (
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
                  <button className="welcome-action primary" onClick={handleOpenQuiz}>
                    <div className="welcome-action-title">
                      <ListChecks size={16} />
                      <span>{lang === 'en' ? 'Start with Smart Quiz' : 'Bắt đầu với Quiz thông minh'}</span>
                    </div>
                    <p>
                      {lang === 'en'
                        ? 'Answer a few questions so AI creates a stronger campaign plan.'
                        : 'Trả lời vài câu hỏi để AI tạo chiến dịch sát thực tế hơn.'}
                    </p>
                  </button>

                  <button className="welcome-action secondary" onClick={focusComposer}>
                    <div className="welcome-action-title">
                      <MessageSquare size={16} />
                      <span>{lang === 'en' ? 'Skip Quiz, Chat Directly' : 'Bỏ qua Quiz, Chat trực tiếp'}</span>
                    </div>
                    <p>
                      {lang === 'en'
                        ? 'Type your first request below. A new campaign will be created automatically.'
                        : 'Nhập yêu cầu đầu tiên ở ô bên dưới. Hệ thống sẽ tự tạo campaign mới.'}
                    </p>
                  </button>
                </div>
              )}
            </div>
          ) : (
            analystMessages.map((msg, i) => (
              <motion.div
                key={msg.id}
                className={`message ${msg.role === 'USER' ? 'user' : 'assistant'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                {msg.role === 'ASSISTANT' && (
                  <div className="message-avatar assistant-avatar">
                    <Sparkles size={16} />
                  </div>
                )}

                <div className="message-main">
                  <div className="message-meta">
                    <span className="message-author">
                      {msg.role === 'USER' ? (user?.name || (lang === 'en' ? 'You' : 'Bạn')) : 'AdVisor AI'}
                    </span>
                    <span className="message-time">{formatMessageTime(msg.createdAt)}</span>
                  </div>

                  <div className="message-content">
                    {msg.role === 'ASSISTANT' ? (
                      <>
                        <ReactMarkdown>{cleanContent(msg.content)}</ReactMarkdown>
                        
                        {/* Plan selection cards */}
                        {parsePlanOptions(msg.content).length > 0 && (
                          <div className="plan-cards">
                            {parsePlanOptions(msg.content).map(plan => (
                              <motion.button
                                key={plan.id}
                                className={`plan-card ${selectedPlanInChat === plan.id || currentCampaign?.quizData?.selectedPlan === plan.id ? 'selected' : ''}`}
                                onClick={() => handleSelectPlan(plan.id, plan.content)}
                                disabled={loading || !!currentCampaign?.quizData?.selectedPlan}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div className="plan-card-badge">
                                  {plan.id === 'A' ? <Zap size={16} /> : plan.id === 'B' ? <Target size={16} /> : <Award size={16} />}
                                </div>
                                <ReactMarkdown>{plan.content}</ReactMarkdown>
                                {(selectedPlanInChat === plan.id || currentCampaign?.quizData?.selectedPlan === plan.id) && (
                                  <div className="plan-card-check"><Check size={16} /></div>
                                )}
                              </motion.button>
                            ))}
                          </div>
                        )}

                        {/* Content Assistant offer - after plan selected, before Stage 2 */}
                        {i === analystMessages.length - 1 && currentCampaign?.quizData?.selectedPlan && currentStage === 1 && !hasStageTransition(msg.content) && (
                          <div className="content-assist-offer">
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                              {lang === 'en' 
                                ? 'Want AI to draft some content for your campaign before moving on?' 
                                : 'B\u1ea1n mu\u1ed1n AI vi\u1ebft th\u1eed n\u1ed9i dung cho chi\u1ebfn d\u1ecbch tr\u01b0\u1edbc khi sang giai \u0111o\u1ea1n ti\u1ebfp?'}
                            </p>
                            <div className="content-assist-buttons">
                              <button 
                                className="content-assist-btn"
                                onClick={() => handleAssistContent('email')}
                                disabled={assistLoading}
                              >
                                <Mail size={14} />
                                <span>{lang === 'en' ? 'Draft Email' : 'Vi\u1ebft Email'}</span>
                              </button>
                              <button 
                                className="content-assist-btn"
                                onClick={() => handleAssistContent('ad_copy')}
                                disabled={assistLoading}
                              >
                                <FileText size={14} />
                                <span>{lang === 'en' ? 'Ad Copy' : 'N\u1ed9i dung qu\u1ea3ng c\u00e1o'}</span>
                              </button>
                              <button 
                                className="content-assist-btn"
                                onClick={() => handleAssistContent('social_post')}
                                disabled={assistLoading}
                              >
                                <Palette size={14} />
                                <span>{lang === 'en' ? 'Social Post' : 'B\u00e0i MXH'}</span>
                              </button>
                            </div>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleAdvanceStage(2)}
                              disabled={loading}
                              style={{ marginTop: '0.75rem' }}
                            >
                              <ArrowRight size={16} />
                              {lang === 'en' ? 'Skip to Stage 2' : 'Sang Giai \u0111o\u1ea1n 2'}
                            </button>
                          </div>
                        )}

                        {/* Stage transition prompt */}
                        {hasStageTransition(msg.content) && i === analystMessages.length - 1 && (
                          <div className="stage-transition-prompt">
                            <p>{lang === 'en' ? 'Ready to move to the next stage?' : 'Sẵn sàng chuyển sang giai đoạn tiếp theo?'}</p>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleAdvanceStage(currentStage + 1)}
                              disabled={loading}
                            >
                              <ArrowRight size={16} />
                              {currentStage < 3
                                ? (lang === 'en' ? `Go to Stage ${currentStage + 1}` : `Sang Giai đoạn ${currentStage + 1}`)
                                : (lang === 'en' ? 'Continue Optimizing' : 'Tiếp tục tối ưu')}
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>

                  <div className="message-tools">
                    {msg.role === 'ASSISTANT' && i === analystMessages.length - 1 && (
                      <button 
                        className="message-copy-btn"
                        onClick={handleReanalyze}
                        title={lang === 'en' ? 'Reanalyze Strategy' : 'Phân tích lại'}
                      >
                        <RefreshCw size={14} />
                      </button>
                    )}
                    {msg.role === 'ASSISTANT' && showContentPane && (
                      <button 
                        className="message-copy-btn"
                        onClick={() => {
                          setContentInput(lang === 'en' 
                            ? `Based on this strategy:\n\n"""\n${msg.content}\n"""\n\nPlease write:\n` 
                            : `Dựa vào chiến lược này:\n\n"""\n${msg.content}\n"""\n\nHãy viết:\n`);
                          setTimeout(() => {
                            const inputField = document.querySelector('.content-pane textarea') as HTMLTextAreaElement;
                            if (inputField) inputField.focus();
                          }, 100);
                        }}
                        title={lang === 'en' ? 'Send to Content Writer' : 'Chuyển sang AI Viết Nội dung'}
                        style={{ color: '#34d399' }}
                      >
                        <ArrowRight size={14} />
                      </button>
                    )}
                    <button 
                      className="message-copy-btn"
                      onClick={() => handleCopyMessage(msg.content, msg.id)}
                      title={lang === 'en' ? 'Copy' : 'Sao chép'}
                    >
                      {copiedId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {msg.role === 'USER' && (
                  <div className="message-avatar user-avatar">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </motion.div>
            ))
          )}

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
        </div>

        {/* Input */}
        <div className="chat-input-wrapper">
          <div className="chat-toolbar">
            {(!currentCampaign || Object.keys(currentCampaign.quizData || {}).length === 0) && (
              <button className="chat-quiz-cta" onClick={handleOpenQuiz}>
                <ListChecks size={14} />
                <span>{lang === 'en' ? 'Do Quiz for Better Strategy' : 'Làm Quiz để ra chiến lược tốt hơn'}</span>
              </button>
            )}
            <span className="chat-toolbar-hint">
              {lang === 'en' ? 'Enter to send, Shift + Enter for new line' : 'Enter để gửi, Shift + Enter xuống dòng'}
            </span>
          </div>
          <div className="chat-input">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                lang === 'en'
                  ? 'Ask me anything about marketing...'
                  : 'Hỏi tôi bất kỳ điều gì về marketing...'
              }
              rows={1}
              disabled={loading}
            />
            <button 
              className="send-btn" 
              onClick={handleSend}
              disabled={!input.trim() || loading}
            >
              <Send size={18} />
            </button>
            </div>
          </div>
        </div>

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
          <div className="chat-pane-header" style={{background: 'rgba(16, 185, 129, 0.05)'}}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={16} style={{color: '#34d399'}} />
            <h3 style={{color: '#34d399'}}>{lang === 'en' ? 'Content Assistant' : 'Trợ lý Nội dung'}</h3>
          </div>
        </div>
        <div className="chat-messages">
          {contentMessages.length === 0 ? (
            <div className="chat-welcome" style={{marginTop: '2rem'}}>
              <div className="welcome-icon" style={{background: 'rgba(16, 185, 129, 0.1)', color: '#34d399'}}>
                <FileText size={40} />
              </div>
              <h2 style={{ fontSize: '1.25rem' }}>{lang === 'en' ? 'AI Content Writer' : 'AI Viết Nội Dung'}</h2>
              <p style={{ fontSize: '0.85rem' }}>{lang === 'en' ? 'Request emails, ad copies, or social media posts for your campaign here.' : 'Yêu cầu viết email, bài quảng cáo, bài đăng MXH tại đây.'}</p>
            </div>
          ) : (
            contentMessages.map((msg, i) => (
              <motion.div
                key={msg.id}
                className={`message ${msg.role === 'USER' ? 'user' : 'assistant'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                {msg.role === 'ASSISTANT' && (
                  <div className="message-avatar assistant-avatar" style={{background: 'linear-gradient(135deg, #10b981, #3b82f6)'}}>
                    <FileText size={16} />
                  </div>
                )}
                <div className="message-main">
                  <div className="message-meta">
                    <span className="message-author">{msg.role === 'USER' ? (user?.name || 'You') : 'Content Assistant'}</span>
                  </div>
                  <div className="message-content">
                    <ReactMarkdown>{msg.content.replace(/^\[Content Prompt\] |^\[Content Assistant - [^\]]+\]\n\n/, '')}</ReactMarkdown>
                  </div>
                  {msg.role === 'ASSISTANT' && (
                    <div className="message-tools">
                      <button className="message-copy-btn" onClick={() => navigator.clipboard.writeText(msg.content.replace(/^\[Content Assistant - [^\]]+\]\n\n/, ''))}>
                        <Copy size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
          {assistLoading && (
            <div className="message assistant loading-message">
              <div className="message-avatar assistant-avatar" style={{background: 'linear-gradient(135deg, #10b981, #3b82f6)'}}><FileText size={16} /></div>
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
              placeholder={lang === 'en' ? 'Write an email about our new product...' : 'Viết bài đăng Facebook về...'}
              rows={1}
              disabled={assistLoading}
              style={{ padding: '0.8rem 1rem', fontSize: '0.85rem' }}
            />
            <button className="send-btn" onClick={handleSendContent} disabled={!contentInput.trim() || assistLoading}>
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
              <h3>{lang === 'en' ? 'Clear All Messages?' : 'Xóa tất cả tin nhắn?'}</h3>
              <p>{lang === 'en' 
                ? 'This will permanently delete all messages in this conversation. This action cannot be undone.' 
                : 'Hành động này sẽ xóa vĩnh viễn tất cả tin nhắn trong cuộc trò chuyện. Không thể hoàn tác.'}</p>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setClearModalOpen(false)}>
                  {lang === 'en' ? 'Cancel' : 'Hủy'}
                </button>
                <button className="btn btn-danger" onClick={handleClear}>
                  {lang === 'en' ? 'Clear All' : 'Xóa tất cả'}
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
              <h3>{lang === 'en' ? 'Delete Campaign?' : 'Xóa chiến dịch?'}</h3>
              <p>{lang === 'en' 
                ? 'This will permanently delete this campaign and all its messages. This action cannot be undone.' 
                : 'Hành động này sẽ xóa vĩnh viễn chiến dịch và tất cả tin nhắn. Không thể hoàn tác.'}</p>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setDeleteModalOpen(false)}>
                  {lang === 'en' ? 'Cancel' : 'Hủy'}
                </button>
                <button className="btn btn-danger" onClick={handleDeleteCampaign}>
                  {lang === 'en' ? 'Delete' : 'Xóa'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Quiz Popup */}
      <AnimatePresence>
        {quizPopupOpen && (
          <motion.div 
            className="modal-overlay quiz-popup-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQuizPopupOpen(false)}
          >
            <motion.div 
              className="quiz-popup"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Popup Header */}
              <div className="quiz-popup-header">
                <div className="quiz-popup-header-left">
                  <div className="quiz-popup-icon">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3>{lang === 'en' ? 'Quick Setup' : 'Thiết lập nhanh'}</h3>
                    <p>{lang === 'en' ? `Question ${quizStep + 1} of ${quickQuizQuestions.length}` : `Câu ${quizStep + 1} / ${quickQuizQuestions.length}`}</p>
                  </div>
                </div>
                <div className="quiz-popup-header-right">
                  <button className="quiz-popup-full-btn" onClick={handleOpenFullQuiz}>
                    {lang === 'en' ? 'Full Quiz' : 'Quiz đầy đủ'}
                  </button>
                  <button className="quiz-popup-close" onClick={() => setQuizPopupOpen(false)}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="quiz-popup-progress">
                <motion.div 
                  className="quiz-popup-progress-fill"
                  animate={{ width: `${((quizStep + 1) / quickQuizQuestions.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Question */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={quizStep}
                  className="quiz-popup-body"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {(() => {
                    const q = quickQuizQuestions[quizStep];
                    const QIcon = q.icon;
                    return (
                      <>
                        <div className="quiz-popup-question">
                          <QIcon size={22} />
                          <span>{q.question[lang]}</span>
                        </div>

                        {q.type === 'text' ? (
                          <div className="quiz-popup-text-area">
                            <input
                              type="text"
                              placeholder={q.placeholder?.[lang] || ''}
                              value={quizTextInput}
                              onChange={(e) => setQuizTextInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleQuizTextSubmit()}
                              autoFocus
                              className="quiz-popup-input"
                            />
                            <div className="quiz-popup-text-actions">
                              <button className="quiz-popup-skip" onClick={handleQuizSkipQuestion}>
                                <HelpCircle size={14} />
                                {lang === 'en' ? 'Skip' : 'Bỏ qua'}
                              </button>
                              <button className="quiz-popup-submit" onClick={handleQuizTextSubmit}>
                                {lang === 'en' ? 'Continue' : 'Tiếp tục'}
                                <ChevronRight size={16} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="quiz-popup-options">
                            {q.options?.map((opt, idx) => (
                              <motion.button
                                key={opt.value}
                                className={`quiz-popup-option ${quizAnswers[q.id] === opt.value ? 'selected' : ''}`}
                                onClick={() => { handleQuizAnswer(opt.value); setQuizCustomOpen(false); }}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                {opt.label[lang]}
                              </motion.button>
                            ))}

                            {/* Custom Input Toggle */}
                            <button 
                              className={`quiz-popup-skip-inline ${quizCustomOpen ? 'active' : ''}`} 
                              onClick={() => { setQuizCustomOpen(!quizCustomOpen); setQuizCustomInput(''); }}
                            >
                              <Pencil size={14} />
                              {lang === 'en' ? 'Type my own answer' : 'Tự điền câu trả lời'}
                            </button>

                            {/* Custom Input Field */}
                            <AnimatePresence>
                              {quizCustomOpen && (
                                <motion.div 
                                  className="quiz-popup-custom-input"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  style={{ gridColumn: '1 / -1' }}
                                >
                                  <input
                                    type="text"
                                    placeholder={lang === 'en' ? 'Type your answer...' : 'Nhập câu trả lời...'}
                                    value={quizCustomInput}
                                    onChange={(e) => setQuizCustomInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleQuizCustomSubmit()}
                                    autoFocus
                                    className="quiz-popup-input"
                                  />
                                  <div className="quiz-popup-text-actions">
                                    <button className="quiz-popup-submit" onClick={handleQuizCustomSubmit}>
                                      {lang === 'en' ? 'Submit' : 'Gửi'}
                                      <ChevronRight size={16} />
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <button className="quiz-popup-skip-inline" onClick={handleQuizSkipQuestion}>
                              <HelpCircle size={14} />
                              {lang === 'en' ? 'Skip this question' : 'Bỏ qua câu này'}
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </motion.div>
              </AnimatePresence>

              {/* Footer */}
              <div className="quiz-popup-footer">
                <button className="quiz-popup-skip-all" onClick={handleQuizSkipAll}>
                  {lang === 'en' ? 'Skip all — let AI decide' : 'Bỏ qua tất cả — để AI tự xử lý'}
                </button>
                <span className="quiz-popup-hint">
                  {lang === 'en' ? 'You can always update later' : 'Bạn luôn có thể cập nhật sau'}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Guide Popup Modal */}
      <AnimatePresence>
        {guidePopupOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setGuidePopupOpen(false)}
            style={{ zIndex: 1200 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(18, 18, 22, 0.97)',
                backdropFilter: 'blur(20px)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 0 40px rgba(124, 58, 237, 0.2), 0 0 80px rgba(0,0,0,0.8)',
                width: '94%',
                maxWidth: '720px',
                maxHeight: '85vh',
                overflow: 'auto',
                padding: '2rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.2))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent)'
                  }}>
                    <HelpCircle size={20} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                    {lang === 'en' ? 'How AdVisor Works' : 'Cách sử dụng AdVisor'}
                  </h3>
                </div>
                <button onClick={() => setGuidePopupOpen(false)} style={{
                  background: 'transparent', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem',
                  display: 'flex', alignItems: 'center'
                }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Stage 1 */}
                <div style={{
                  padding: '1.25rem', borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(124, 58, 237, 0.25)',
                  background: 'rgba(124, 58, 237, 0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '0.85rem', fontWeight: 700
                    }}>1</div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                        {lang === 'en' ? 'Stage 1: Discovery & Strategy' : 'Giai đoạn 1: Khám phá & Chiến lược'}
                      </h4>
                    </div>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.8 }}>
                    <li>{lang === 'en' ? 'Complete the Smart Quiz (product, business type, audience, goals, budget)' : 'Hoàn thành Quiz thông minh (sản phẩm, loại hình, đối tượng, mục tiêu, ngân sách)'}</li>
                    <li>{lang === 'en' ? 'AI analyzes your data and proposes 3 strategic plans' : 'AI phân tích dữ liệu và đề xuất 3 kế hoạch chiến lược'}</li>
                    <li>{lang === 'en' ? 'Select the plan that best fits your goals' : 'Chọn kế hoạch phù hợp nhất với mục tiêu của bạn'}</li>
                  </ul>
                </div>

                {/* Stage 2 */}
                <div style={{
                  padding: '1.25rem', borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  background: 'rgba(16, 185, 129, 0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '0.85rem', fontWeight: 700
                    }}>2</div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                        {lang === 'en' ? 'Stage 2: Refinement & Execution' : 'Giai đoạn 2: Chi tiết & Triển khai'}
                      </h4>
                    </div>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.8 }}>
                    <li>{lang === 'en' ? 'Answer deeper questions (channels, budget allocation, timeline)' : 'Trả lời câu hỏi chi tiết hơn (kênh, phân bổ ngân sách, timeline)'}</li>
                    <li>{lang === 'en' ? 'AI creates a detailed execution plan with milestones and KPIs' : 'AI tạo kế hoạch triển khai chi tiết với milestone và KPI'}</li>
                    <li>{lang === 'en' ? 'Review and confirm the refined strategy' : 'Xem xét và xác nhận chiến lược đã tinh chỉnh'}</li>
                  </ul>
                </div>

                {/* Stage 3 */}
                <div style={{
                  padding: '1.25rem', borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(251, 191, 36, 0.25)',
                  background: 'rgba(251, 191, 36, 0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '0.85rem', fontWeight: 700
                    }}>3</div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                        {lang === 'en' ? 'Stage 3: Ongoing Optimization' : 'Giai đoạn 3: Tối ưu liên tục'}
                      </h4>
                    </div>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.8 }}>
                    <li>{lang === 'en' ? 'Submit periodic metrics reports (CPC, CPA, ROI, etc.)' : 'Gửi báo cáo số liệu định kỳ (CPC, CPA, ROI, v.v.)'}</li>
                    <li>{lang === 'en' ? 'AI analyzes performance trends and suggests adjustments' : 'AI phân tích xu hướng hiệu suất và đề xuất điều chỉnh'}</li>
                    <li>{lang === 'en' ? 'Continuously improve your campaigns over time' : 'Liên tục cải thiện chiến dịch theo thời gian'}</li>
                  </ul>
                </div>
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
              style={{
                background: 'rgba(18, 18, 22, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 0 40px rgba(124, 58, 237, 0.2), 0 0 80px rgba(0,0,0,0.8)',
                width: '94%',
                maxWidth: '1100px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <div className="insights-modal-header" style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.2))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent)'
                  }}>
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                      {lang === 'en' ? 'Campaign Insights' : 'Dữ liệu chiến dịch'}
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => setInsightsOpen(false)}
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="insights-modal-body" style={{
                padding: '1.5rem',
                overflowY: 'auto',
                flex: 1
              }}>
                <div className="insights-grid">
                    {/* Left Column - Quiz Progress */}
                    <div className="insights-card">
                      <div className="insights-card-header" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(236,72,153,0.08))' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <ListChecks size={16} style={{ color: 'var(--accent)' }} />
                          <h3>{lang === 'en' ? 'Quiz Progress' : 'Tiến độ Quiz'}</h3>
                        </div>
                        <span className="insights-pill">{progressPercent}%</span>
                      </div>
                      <div className="insights-progress">
                        <div className="insights-progress-bar">
                          <div className="insights-progress-fill" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <div className="insights-progress-meta">
                          <span>
                            {lang === 'en'
                              ? `${completedStages} / ${totalStages || '-'} stages`
                              : `${completedStages} / ${totalStages || '-'} giai đoạn`}
                          </span>
                          {currentCampaign.quizProgress?.lastUpdated && (
                            <span style={{ fontSize: '0.72rem' }}>
                              {new Date(currentCampaign.quizProgress.lastUpdated).toLocaleDateString(
                                lang === 'vi' ? 'vi-VN' : 'en-US'
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quiz Summary */}
                      <div className="insights-stage-compare">
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <BookOpen size={14} style={{ color: 'var(--accent)' }} />
                          {lang === 'en' ? 'Quiz Answers' : 'Dữ liệu chiến dịch'}
                        </h4>
                        <div className="insights-stage-list">
                          {getFullQuizProfile().length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              {lang === 'en' ? 'No data yet.' : 'Chưa có dữ liệu.'}
                            </p>
                          ) : (
                            getFullQuizProfile().slice(0, 8).map((item, idx) => (
                              <div key={idx} className="insights-stage-item">
                                <span className="insights-stage-key" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  {item.icon}
                                  {item.label}
                                </span>
                                <span className="insights-stage-value">{item.value}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Metrics */}
                    <div className="insights-card">
                      <div className="insights-card-header" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.08))' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <BarChart3 size={16} style={{ color: '#34d399' }} />
                          <h3>{lang === 'en' ? 'Metrics Snapshots' : 'Dữ liệu hiệu suất'}</h3>
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
                            onClick={() => csvInputRef.current?.click()}
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

                      {/* Mini Chart - show when snapshots exist */}
                      {metricsSnapshots.length > 0 && (
                        <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                          <MiniBarChart
                            data={metricsFields.slice(0, 6).map(f => ({
                              label: f.key,
                              value: parseFloat(String((latestSnapshot?.metrics as Record<string, any>)?.[f.key] || '0')) || 0
                            }))}
                          />
                        </div>
                      )}

                      <div className="metrics-form">
                        <div className="metrics-row">
                          <label>
                            {lang === 'en' ? 'Label' : 'Nhãn'}
                            <input
                              type="text"
                              value={metricsLabel}
                              placeholder={lang === 'en' ? 'Baseline, Month 1...' : 'Baseline, tháng 1...'}
                              onChange={(e) => setMetricsLabel(e.target.value)}
                            />
                          </label>
                        </div>
                        <div className="metrics-row">
                          <label>
                            {lang === 'en' ? 'Start date' : 'Bắt đầu'}
                            <input
                              type="date"
                              value={metricsPeriodStart}
                              onChange={(e) => setMetricsPeriodStart(e.target.value)}
                            />
                          </label>
                          <label>
                            {lang === 'en' ? 'End date' : 'Kết thúc'}
                            <input
                              type="date"
                              value={metricsPeriodEnd}
                              onChange={(e) => setMetricsPeriodEnd(e.target.value)}
                            />
                          </label>
                        </div>
                        <div className="metrics-grid">
                          {metricsFields.map((field) => (
                            <label key={field.key}>
                              {field.label[lang]}
                              <input
                                type="text"
                                value={metricsInputs[field.key] || ''}
                                onChange={(e) => handleMetricsInputChange(field.key, e.target.value)}
                              />
                            </label>
                          ))}
                        </div>
                        <button className="metrics-save" onClick={handleSaveMetrics}>
                          <Check size={14} />
                          {lang === 'en' ? 'Save Snapshot' : 'Lưu dữ liệu'}
                        </button>
                      </div>

                      {/* Comparison with trend indicators */}
                      <div className="metrics-compare">
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <TrendingUp size={14} style={{ color: '#34d399' }} />
                          {lang === 'en' ? 'Performance Trends' : 'Xu hướng hiệu suất'}
                        </h4>
                        {latestSnapshot ? (
                          <div className="metrics-compare-list">
                            {metricsFields.map((field) => {
                              const current = latestSnapshot.metrics?.[field.key];
                              const previous = previousSnapshot?.metrics?.[field.key];
                              const delta = computeMetricDelta(current, previous);
                              const isPositive = delta && delta.diff >= 0;
                              return (
                                <div key={field.key} className="metrics-compare-item">
                                  <span className="metrics-compare-label">{field.label[lang]}</span>
                                  <span className="metrics-compare-value">{formatMetricValue(current)}</span>
                                  <span className={`metrics-compare-delta ${isPositive ? 'up' : 'down'}`}>
                                    {delta ? (
                                      <>
                                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        {delta.percent !== null ? `${delta.percent.toFixed(1)}%` : delta.diff.toFixed(2)}
                                      </>
                                    ) : '-'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{lang === 'en' ? 'Add a snapshot to see trends.' : 'Thêm dữ liệu để xem xu hướng.'}</p>
                        )}
                      </div>
                    </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    <h3>{lang === 'en' ? 'Finalize Plan' : 'Chốt Plan'}</h3>
                    <p>{lang === 'en' ? `Phase 2 - Question ${phase2Step + 1} of ${phase2Questions.length}` : `Giai đoạn 2 - Câu ${phase2Step + 1} / ${phase2Questions.length}`}</p>
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
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {(() => {
                    const q = phase2Questions[phase2Step];
                    const QIcon = q.icon;
                    return (
                      <>
                        <div className="quiz-popup-question" style={{ color: '#10b981' }}>
                          <QIcon size={22} />
                          <span>{q.question[lang]}</span>
                        </div>

                        <div className="quiz-popup-options">
                          {q.options?.map((opt, idx) => (
                            <motion.button
                              key={opt.value}
                              className={`quiz-popup-option ${phase2Answers[q.id] === opt.value ? 'selected' : ''}`}
                              onClick={() => { handlePhase2Answer(opt.value); setPhase2CustomOpen(false); }}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.04 }}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {opt.label[lang]}
                            </motion.button>
                          ))}

                          <button 
                            className={`quiz-popup-skip-inline ${phase2CustomOpen ? 'active' : ''}`} 
                            onClick={() => { setPhase2CustomOpen(!phase2CustomOpen); setPhase2CustomInput(''); }}
                          >
                            <Pencil size={14} />
                            {lang === 'en' ? 'Type my own answer' : 'Tự điền câu trả lời'}
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
                                  placeholder={lang === 'en' ? 'Type your answer...' : 'Nhập câu trả lời...'}
                                  value={phase2CustomInput}
                                  onChange={(e) => setPhase2CustomInput(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handlePhase2CustomSubmit()}
                                  autoFocus
                                  className="quiz-popup-input"
                                />
                                <div className="quiz-popup-text-actions">
                                  <button className="quiz-popup-submit" onClick={handlePhase2CustomSubmit}>
                                    {lang === 'en' ? 'Submit' : 'Gửi'}
                                    <ChevronRight size={16} />
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <button className="quiz-popup-skip-inline" onClick={handlePhase2SkipQuestion}>
                            <HelpCircle size={14} />
                            {lang === 'en' ? 'Skip this question' : 'Bỏ qua câu này'}
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              </AnimatePresence>
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
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{lang === 'en' ? 'Marketing Glossary' : 'Từ điển marketing'}</h3>
                <p className="summary-subtitle" style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lang === 'en' ? 'Key terms used by marketers' : 'Thuật ngữ hay gặp trong marketing'}</p>
              </div>
              <button className="summary-close" onClick={() => setGlossaryOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div className="summary-list" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
              {glossaryMatches.length > 0 && (
                <div className="glossary-section" style={{ marginBottom: '1.5rem' }}>
                  <span className="glossary-section-title" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>{lang === 'en' ? 'Suggested for you' : 'Gợi ý liên quan'}</span>
                  {glossaryMatches.map((entry) => (
                    <div key={entry.id} className="glossary-item" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.875rem', marginBottom: '0.75rem' }}>
                      <div className="glossary-term" style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>{entry.term}</div>
                      <div className="glossary-name" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{entry.name[lang]}</div>
                      <p className="glossary-definition" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{entry.definition[lang]}</p>
                    </div>
                  ))}
                </div>
              )}
              {glossaryGroups.map((group) => (
                <div key={group.id} className="glossary-section" style={{ marginBottom: '1.5rem' }}>
                  <span className="glossary-section-title" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>{group.label[lang]}</span>
                  {getGlossaryByGroup(group.id).map((entry) => (
                    <div key={entry.id} className="glossary-item" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.875rem', marginBottom: '0.75rem' }}>
                      <div className="glossary-term" style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>{entry.term}</div>
                      <div className="glossary-name" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{entry.name[lang]}</div>
                      <p className="glossary-definition" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{entry.definition[lang]}</p>
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
  lang: 'en' | 'vi';
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
  campaign, isActive, isEditing, editingName, menuOpen, lang,
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
    <div className={`campaign-item ${isActive ? 'active' : ''} ${campaign.isFavorite ? 'favorited' : ''}`}>
      <button className="campaign-link" onClick={onNavigate}>
        <MessageSquare size={16} className={campaign.isFavorite ? 'favorite-icon' : ''} />
        <span>{campaign.name}</span>
      </button>
      
      <div className="campaign-actions">
        <button className="campaign-action-btn" onClick={onMenuToggle}>
          <MoreHorizontal size={14} />
        </button>
        
        <AnimatePresence>
          {menuOpen && (
            <motion.div 
              className="campaign-menu"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <button onClick={onStartEdit}>
                <Pencil size={14} />
                {lang === 'en' ? 'Rename' : 'Đổi tên'}
              </button>
              <button onClick={onToggleFavorite}>
                <Star size={14} fill={campaign.isFavorite ? 'currentColor' : 'none'} />
                {campaign.isFavorite 
                  ? (lang === 'en' ? 'Unfavorite' : 'Bỏ yêu thích')
                  : (lang === 'en' ? 'Favorite' : 'Yêu thích')}
              </button>
              <button className="danger" onClick={onDelete}>
                <Trash2 size={14} />
                {lang === 'en' ? 'Delete' : 'Xóa'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
