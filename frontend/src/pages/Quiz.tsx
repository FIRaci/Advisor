import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Sparkles, Building, Users, Target, DollarSign, Globe, Clock,
  Megaphone, TrendingUp, HelpCircle, ChevronLeft, ChevronRight,
  Package, Briefcase, Zap, Heart, BarChart3, Smartphone, ShoppingBag,
  CheckCircle2, ListChecks, BookOpen, Pencil
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api } from '../hooks/useApi';
import {
  glossaryGroups,
  findGlossaryMatches,
  getGlossaryByGroup
} from '../utils/marketingGlossary';
import './Quiz.css';

// Question type: 'select' for multiple choice, 'text' for free text input
interface Question {
  id: string;
  icon: any;
  question: string;
  shortLabel: string;
  type: 'select' | 'text';
  options?: { value: string; label: string }[];
  placeholder?: string;
  allowMultiple?: boolean;
}

interface QuizStage {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

const questions: Question[] = [
  // 1. Product/Service Name (text input)
  {
    id: 'productName',
    icon: Package,
    question: 'What is your product or service name?',
    shortLabel: 'Product Name',
    type: 'text',
    placeholder: 'Enter product/service name (or skip if unsure)'
  },
  // 2. Business Type
  {
    id: 'business',
    icon: Building,
    question: 'What type of business do you have?',
    shortLabel: 'Business Type',
    type: 'select',
    options: [
      { value: 'ecommerce', label: 'E-commerce / Online Store' },
      { value: 'saas', label: 'SaaS / Software' },
      { value: 'service', label: 'Professional Services' },
      { value: 'local', label: 'Local Business / Retail' },
      { value: 'agency', label: 'Marketing Agency' },
      { value: 'education', label: 'Education / Courses' },
      { value: 'healthcare', label: 'Healthcare / Wellness' },
      { value: 'fintech', label: 'Fintech / Finance' },
      { value: 'food', label: 'Food & Beverage' },
      { value: 'travel', label: 'Travel / Hospitality' },
      { value: 'realestate', label: 'Real Estate' },
      { value: 'entertainment', label: 'Entertainment / Media' }
    ]
  },
  // 3. Business Stage
  {
    id: 'stage',
    icon: Zap,
    question: 'What stage is your business at?',
    shortLabel: 'Stage',
    type: 'select',
    options: [
      { value: 'idea', label: 'Idea / Pre-launch' },
      { value: 'startup', label: 'Startup (< 1 year)' },
      { value: 'growing', label: 'Growing (1-3 years)' },
      { value: 'established', label: 'Established (3-5 years)' },
      { value: 'mature', label: 'Mature (5+ years)' },
      { value: 'scaling', label: 'Scaling / Expanding' }
    ]
  },
  // 4. Target Audience
  {
    id: 'audience',
    icon: Users,
    question: 'Who is your target audience?',
    shortLabel: 'Audience',
    type: 'select',
    allowMultiple: true,
    options: [
      { value: 'b2b', label: 'B2B (Businesses)' },
      { value: 'b2c', label: 'B2C (Consumers)' },
      { value: 'both', label: 'Both B2B and B2C' },
      { value: 'genz', label: 'Gen Z (18-25)' },
      { value: 'millennials', label: 'Millennials (26-40)' },
      { value: 'genx', label: 'Gen X & Older (40+)' },
      { value: 'enterprise', label: 'Enterprise Companies' },
      { value: 'startups', label: 'Startups & SMBs' },
      { value: 'women', label: 'Women-focused' },
      { value: 'men', label: 'Men-focused' },
      { value: 'parents', label: 'Parents / Families' },
      { value: 'students', label: 'Students' }
    ]
  },
  // 5. Marketing Goal
  {
    id: 'goal',
    icon: Target,
    question: 'What is your main marketing goal?',
    shortLabel: 'Goal',
    type: 'select',
    allowMultiple: true,
    options: [
      { value: 'awareness', label: 'Brand Awareness' },
      { value: 'leads', label: 'Generate Leads' },
      { value: 'sales', label: 'Increase Sales' },
      { value: 'retention', label: 'Customer Retention' },
      { value: 'traffic', label: 'Website Traffic' },
      { value: 'engagement', label: 'Social Engagement' },
      { value: 'launch', label: 'Product Launch' },
      { value: 'reputation', label: 'Reputation Management' },
      { value: 'appinstalls', label: 'App Installs' },
      { value: 'community', label: 'Community Building' }
    ]
  },
  // 6. USP / Unique Selling Point (text input)
  {
    id: 'usp',
    icon: Heart,
    question: 'What makes your product/service unique?',
    shortLabel: 'USP',
    type: 'text',
    placeholder: 'Describe your unique selling point...'
  },
  // 7. Marketing Channels
  {
    id: 'channels',
    icon: Megaphone,
    question: 'Which marketing channels interest you most?',
    shortLabel: 'Channels',
    type: 'select',
    allowMultiple: true,
    options: [
      { value: 'social', label: 'Social Media (FB, IG, X)' },
      { value: 'search', label: 'Google Ads & SEO' },
      { value: 'email', label: 'Email Marketing' },
      { value: 'content', label: 'Content / Blog' },
      { value: 'video', label: 'YouTube / TikTok' },
      { value: 'influencer', label: 'Influencer / KOL' },
      { value: 'affiliate', label: 'Affiliate Marketing' },
      { value: 'podcast', label: 'Podcast / Audio' },
      { value: 'offline', label: 'Offline / Events' },
      { value: 'all', label: 'Multi-channel' }
    ]
  },
  // 8. Current Situation
  {
    id: 'currentMarketing',
    icon: BarChart3,
    question: 'What is your current marketing situation?',
    shortLabel: 'Current',
    type: 'select',
    options: [
      { value: 'none', label: 'No marketing yet' },
      { value: 'basic', label: 'Basic social media' },
      { value: 'active', label: 'Active on multiple channels' },
      { value: 'paid', label: 'Running paid ads' },
      { value: 'team', label: 'Have marketing team' },
      { value: 'agency', label: 'Working with agency' }
    ]
  },
  // 9. Experience Level
  {
    id: 'experience',
    icon: TrendingUp,
    question: 'Your marketing experience level?',
    shortLabel: 'Experience',
    type: 'select',
    options: [
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' },
      { value: 'expert', label: 'Expert' }
    ]
  },
  // 10. Competitors (text input)
  {
    id: 'competitors',
    icon: Briefcase,
    question: 'Who are your main competitors?',
    shortLabel: 'Competitors',
    type: 'text',
    placeholder: 'List 1-3 competitors (or skip)'
  },
  // 11. Timeline
  {
    id: 'timeline',
    icon: Clock,
    question: 'Expected timeline for results?',
    shortLabel: 'Timeline',
    type: 'select',
    options: [
      { value: 'immediate', label: '1-2 weeks' },
      { value: 'short', label: '1-3 months' },
      { value: 'medium', label: '3-6 months' },
      { value: 'long', label: '6-12 months' },
      { value: 'longterm', label: '1+ year' }
    ]
  },
  // 12. Target Region
  {
    id: 'region',
    icon: Globe,
    question: 'Target market region?',
    shortLabel: 'Region',
    type: 'select',
    options: [
      { value: 'local', label: 'Local / City' },
      { value: 'national', label: 'National (Vietnam)' },
      { value: 'regional', label: 'Southeast Asia' },
      { value: 'asia', label: 'Asia Pacific' },
      { value: 'us', label: 'United States' },
      { value: 'europe', label: 'Europe' },
      { value: 'global', label: 'Global' }
    ]
  },
  // 13. Platform Focus
  {
    id: 'platform',
    icon: Smartphone,
    question: 'Where do customers interact with you?',
    shortLabel: 'Platform',
    type: 'select',
    allowMultiple: true,
    options: [
      { value: 'website', label: 'Website' },
      { value: 'app', label: 'Mobile App' },
      { value: 'social', label: 'Social Media' },
      { value: 'marketplace', label: 'Marketplace (Shopee, Lazada)' },
      { value: 'store', label: 'Physical Store' },
      { value: 'multiple', label: 'Multiple platforms' }
    ]
  },
  // 14. Price Range
  {
    id: 'priceRange',
    icon: ShoppingBag,
    question: 'What is your product/service price range?',
    shortLabel: 'Price',
    type: 'select',
    options: [
      { value: 'free', label: 'Free / Freemium' },
      { value: 'low', label: 'Low-cost (< $50)' },
      { value: 'mid', label: 'Mid-range ($50-$500)' },
      { value: 'premium', label: 'Premium ($500-$5,000)' },
      { value: 'luxury', label: 'Luxury ($5,000+)' },
      { value: 'varies', label: 'Varies by product' }
    ]
  },
  // 15. Budget
  {
    id: 'budget',
    icon: DollarSign,
    question: 'Monthly marketing budget?',
    shortLabel: 'Budget',
    type: 'select',
    options: [
      { value: 'minimal', label: 'Under $500' },
      { value: 'small', label: '$500 - $1,000' },
      { value: 'medium', label: '$1,000 - $5,000' },
      { value: 'large', label: '$5,000 - $20,000' },
      { value: 'enterprise', label: '$20,000 - $100,000' },
      { value: 'unlimited', label: '$100,000+' }
    ]
  },
  // 16. Seasonal impact
  {
    id: 'seasonality',
    icon: Clock,
    question: 'Does your business have seasonal peaks?',
    shortLabel: 'Seasonality',
    type: 'select',
    options: [
      { value: 'none', label: 'No major seasonality' },
      { value: 'holiday', label: 'Holiday-driven' },
      { value: 'summer', label: 'Summer peak' },
      { value: 'yearend', label: 'Year-end peak' },
      { value: 'event', label: 'Event/campaign driven' },
      { value: 'always', label: 'Always-on demand' }
    ]
  },
  // 17. Preferred content format
  {
    id: 'contentFormat',
    icon: Megaphone,
    question: 'What content format fits your brand best?',
    shortLabel: 'Content',
    type: 'select',
    allowMultiple: true,
    options: [
      { value: 'short_video', label: 'Short videos (Reels/TikTok)' },
      { value: 'long_video', label: 'Long-form video' },
      { value: 'static_visual', label: 'Static visuals/carousels' },
      { value: 'article', label: 'Articles/blog posts' },
      { value: 'email', label: 'Email/newsletter' },
      { value: 'mixed', label: 'Mixed format' }
    ]
  },
  // 18. Offer type
  {
    id: 'offerType',
    icon: Target,
    question: 'What offer do you usually run?',
    shortLabel: 'Offer',
    type: 'select',
    options: [
      { value: 'discount', label: 'Discount / flash sale' },
      { value: 'bundle', label: 'Bundle package' },
      { value: 'trial', label: 'Free trial / freemium' },
      { value: 'gift', label: 'Gift with purchase' },
      { value: 'consultation', label: 'Free consultation/demo' },
      { value: 'custom_offer', label: 'Custom by customer segment' }
    ]
  }
];

const stageBlueprints = [
  {
    id: 'basics',
    title: 'Business Basics',
    description: 'Core business profile and audience',
    questionIds: ['productName', 'business', 'stage', 'audience', 'region', 'platform', 'priceRange']
  },
  {
    id: 'goals',
    title: 'Goals & Channels',
    description: 'Objectives and current marketing setup',
    questionIds: ['goal', 'usp', 'channels', 'currentMarketing', 'experience', 'competitors', 'timeline']
  },
  {
    id: 'execution',
    title: 'Budget & Execution',
    description: 'Budget, seasonality, content, offers',
    questionIds: ['budget', 'seasonality', 'contentFormat', 'offerType']
  }
];

const questionMap = new Map(questions.map((question) => [question.id, question]));

const stages: QuizStage[] = stageBlueprints.map((stage) => ({
  id: stage.id,
  title: stage.title,
  description: stage.description,
  questions: stage.questionIds
    .map((questionId) => questionMap.get(questionId))
    .filter((question): question is Question => Boolean(question))
}));

export default function Quiz() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();

  const [stageIndex, setStageIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [savingStage, setSavingStage] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [customInputOpen, setCustomInputOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [multiSelections, setMultiSelections] = useState<string[]>([]);

  const currentStage = stages[Math.min(stageIndex, stages.length - 1)];
  const currentQuestion = currentStage.questions[Math.min(questionIndex, currentStage.questions.length - 1)];
  const Icon = currentQuestion.icon;
  const totalQuestions = useMemo(
    () => stages.reduce((acc, stage) => acc + stage.questions.length, 0),
    []
  );
  const flatQuestionIndex = useMemo(() => {
    const previousCount = stages
      .slice(0, stageIndex)
      .reduce((acc, stage) => acc + stage.questions.length, 0);
    return previousCount + questionIndex;
  }, [stageIndex, questionIndex]);

  const allQuestions = useMemo(() => stages.flatMap((stage) => stage.questions), []);
  const questionStageLookup = useMemo(() => {
    const lookup: Record<string, number> = {};
    stages.forEach((stage, index) => {
      stage.questions.forEach((question) => {
        lookup[question.id] = index;
      });
    });
    return lookup;
  }, []);

  const resumeCampaignId = searchParams.get('campaignId');

  useEffect(() => {
    if (!resumeCampaignId || !user) {
      return;
    }

    const loadCampaign = async () => {
      setIsResuming(true);
      const res = await api.getCampaign(resumeCampaignId);
      if (res.success && res.data) {
        const quizData = res.data.quizData || {};
        const progress = res.data.quizProgress;
        const nextStageIndex = Math.min(progress?.currentStage ?? 0, stages.length - 1);

        setCampaignId(res.data.id);
        setAnswers(quizData);
        setStageIndex(nextStageIndex);

        const stageQuestions = stages[nextStageIndex].questions;
        const firstUnanswered = stageQuestions.findIndex(
          (question) => !quizData[question.id] || quizData[question.id] === 'not_sure'
        );
        const nextQuestionIndex = firstUnanswered === -1 ? 0 : firstUnanswered;
        setQuestionIndex(nextQuestionIndex);
        setTextInput(quizData[stageQuestions[nextQuestionIndex]?.id] || '');
      }
      setIsResuming(false);
    };

    loadCampaign();
  }, [resumeCampaignId, user]);

  const decodeMultiValue = (value?: string) => {
    if (!value || value === 'not_sure' || value.startsWith('custom: ')) return [];
    return value
      .split('||')
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const encodeMultiValue = (values: string[]) => values.join('||');

  useEffect(() => {
    if (currentQuestion.type !== 'select' || !currentQuestion.allowMultiple) {
      setMultiSelections([]);
      return;
    }
    setMultiSelections(decodeMultiValue(answers[currentQuestion.id]));
  }, [currentQuestion.id, currentQuestion.type, currentQuestion.allowMultiple, answers]);

  // Get display value for an answer
  const getAnswerDisplay = (questionId: string, value: string): string => {
    if (!value || value === 'not_sure') return 'Skipped';
    if (value.startsWith('custom: ')) return value.replace('custom: ', '');

    const question = questions.find(q => q.id === questionId);
    if (!question) return value;

    if (question.type === 'text') return value;

    if (question.allowMultiple) {
      const values = decodeMultiValue(value);
      if (values.length === 0) return value;
      return values
        .map((item) => question.options?.find(o => o.value === item)?.label || item)
        .join(', ');
    }

    const option = question.options?.find(o => o.value === value);
    return option ? option.label : value;
  };

  const handleBack = () => {
    const from = location.state?.from;
    if (from) {
      navigate(from);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handlePrevStep = () => {
    if (questionIndex > 0) {
      const nextIndex = questionIndex - 1;
      setQuestionIndex(nextIndex);
      setTextInput(answers[currentStage.questions[nextIndex].id] || '');
      return;
    }

    if (stageIndex > 0) {
      const previousStageIndex = stageIndex - 1;
      const previousStage = stages[previousStageIndex];
      const nextQuestionIndex = previousStage.questions.length - 1;
      setStageIndex(previousStageIndex);
      setQuestionIndex(nextQuestionIndex);
      setTextInput(answers[previousStage.questions[nextQuestionIndex].id] || '');
    }
  };

  const buildStageAnswers = (payload: Record<string, string>, stage: QuizStage) =>
    stage.questions.reduce((acc, question) => {
      const value = payload[question.id];
      if (value) {
        acc[question.id] = value;
      }
      return acc;
    }, {} as Record<string, string>);

  const buildInitialProgress = (payload: Record<string, string>, stage: QuizStage, index: number) => {
    const stageAnswers = buildStageAnswers(payload, stage);
    const nowIso = new Date().toISOString();
    return {
      currentStage: index + 1,
      totalStages: stages.length,
      completedStages: [index],
      lastUpdated: nowIso,
      stageSnapshots: [
        {
          stageIndex: index,
          stageLabel: stage.title,
          completedAt: nowIso,
          answers: stageAnswers
        }
      ]
    };
  };

  const ensureCampaign = async (payload: Record<string, string>, stage: QuizStage, index: number) => {
    if (campaignId) return campaignId;
    if (!user) {
      navigate('/login');
      return null;
    }

    const name = generateCampaignName(payload);
    const progress = buildInitialProgress(payload, stage, index);
    const res = await api.createCampaign({
      name: name.trim().replace(/\s+/g, ' ').slice(0, 120),
      quizData: payload,
      quizProgress: progress
    });

    if (res.success && res.data) {
      setCampaignId(res.data.id);
      return res.data.id;
    }

    alert(
      res.error ||
      'Failed to create campaign. Please try again.'
    );
    return null;
  };

  const saveStageProgress = async (payload: Record<string, string>, stage: QuizStage, index: number) => {
    setSavingStage(true);
    const targetCampaignId = await ensureCampaign(payload, stage, index);
    if (!targetCampaignId) {
      setSavingStage(false);
      return false;
    }

    const stageAnswers = buildStageAnswers(payload, stage);
    const updateRes = await api.updateQuizProgress(targetCampaignId, {
      stageIndex: index,
      stageLabel: stage.title,
      totalStages: stages.length,
      answers: stageAnswers,
      completed: true
    });

    setSavingStage(false);
    return updateRes.success;
  };

  const applyAnswer = async (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    const isLastQuestionInStage = questionIndex >= currentStage.questions.length - 1;
    const isLastStage = stageIndex >= stages.length - 1;

    if (!isLastQuestionInStage) {
      const nextIndex = questionIndex + 1;
      setTimeout(() => {
        setQuestionIndex(nextIndex);
        setTextInput(newAnswers[currentStage.questions[nextIndex]?.id] || '');
      }, 200);
      return;
    }

    if (!isLastStage) {
      const saved = await saveStageProgress(newAnswers, currentStage, stageIndex);
      if (!saved) {
        return;
      }
      const nextStageIndex = stageIndex + 1;
      setTimeout(() => {
        setStageIndex(nextStageIndex);
        setQuestionIndex(0);
        setTextInput(newAnswers[stages[nextStageIndex].questions[0]?.id] || '');
      }, 200);
      return;
    }

    await handleSubmit(newAnswers);
  };

  const handleSelect = async (value: string) => {
    if (currentQuestion.allowMultiple) {
      setMultiSelections((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
      return;
    }
    // Ensure campaign exists on first interaction
    if (!campaignId && !loading && !savingStage) {
      const initialAnswers = { ...answers, [currentQuestion.id]: value };
      const cid = await ensureCampaign(initialAnswers, currentStage, stageIndex);
      if (cid) {
        setCampaignId(cid);
      }
    }
    await applyAnswer(value);
  };

  const handleTextSubmit = async () => {
    const value = textInput.trim() || 'not_sure';
    // Ensure campaign exists on first interaction
    if (!campaignId && !loading && !savingStage) {
      const initialAnswers = { ...answers, [currentQuestion.id]: value };
      const cid = await ensureCampaign(initialAnswers, currentStage, stageIndex);
      if (cid) {
        setCampaignId(cid);
      }
    }
    await applyAnswer(value);
  };

  const handleSkip = async () => {
    await applyAnswer('not_sure');
  };

  const handleCustomSubmit = async () => {
    const value = customInput.trim();
    if (!value) return;
    await handleSelect(`custom: ${value}`);
    setCustomInputOpen(false);
    setCustomInput('');
  };

  const handleMultiContinue = async () => {
    if (!currentQuestion.allowMultiple) return;
    if (multiSelections.length === 0) return;
    await applyAnswer(encodeMultiValue(multiSelections));
  };

  const handleJumpToQuestion = (index: number) => {
    const question = allQuestions[index];
    if (!question) return;
    const targetStageIndex = questionStageLookup[question.id] ?? 0;
    const targetStage = stages[targetStageIndex];
    const targetQuestionIndex = targetStage.questions.findIndex((q) => q.id === question.id);
    setStageIndex(targetStageIndex);
    setQuestionIndex(targetQuestionIndex === -1 ? 0 : targetQuestionIndex);
    setTextInput(answers[question.id] || '');
    setSummaryOpen(false);
  };

  const generateCampaignName = (finalAnswers: Record<string, string>) => {
    const productName = finalAnswers.productName && finalAnswers.productName !== 'not_sure'
      ? finalAnswers.productName
      : null;

    const businessType = finalAnswers.business && finalAnswers.business !== 'not_sure'
      ? finalAnswers.business
      : null;

    const goal = finalAnswers.goal && finalAnswers.goal !== 'not_sure'
      ? finalAnswers.goal
      : null;

    if (productName) {
      return productName;
    }

    if (businessType && goal) {
      const businessLabels: Record<string, string> = {
        ecommerce: 'E-commerce', saas: 'SaaS', service: 'Services', local: 'Local Business',
        agency: 'Agency', education: 'Education', healthcare: 'Healthcare', fintech: 'Fintech',
        food: 'F&B', travel: 'Travel', realestate: 'Real Estate', entertainment: 'Entertainment'
      };
      const goalLabels: Record<string, string> = {
        awareness: 'Awareness', leads: 'Lead Gen', sales: 'Sales', retention: 'Retention',
        traffic: 'Traffic', engagement: 'Engagement', launch: 'Launch', reputation: 'Reputation',
        appinstalls: 'App Growth', community: 'Community'
      };
      const biz = businessLabels[businessType] || businessType;
      const g = goalLabels[goal] || goal;
      return `${biz} - ${g}`;
    }

    if (businessType) {
      const businessLabels: Record<string, string> = {
        ecommerce: 'E-commerce Campaign', saas: 'SaaS Campaign', service: 'Service Campaign',
        local: 'Local Business Campaign', agency: 'Agency Campaign', education: 'Education Campaign',
        healthcare: 'Healthcare Campaign', fintech: 'Fintech Campaign', food: 'F&B Campaign',
        travel: 'Travel Campaign', realestate: 'Real Estate Campaign', entertainment: 'Entertainment Campaign'
      };
      return businessLabels[businessType] || `${businessType} Campaign`;
    }

    if (goal) {
      const goalLabels: Record<string, string> = {
        awareness: 'Brand Awareness', leads: 'Lead Generation', sales: 'Sales Growth',
        retention: 'Customer Retention', traffic: 'Traffic Boost', engagement: 'Social Engagement',
        launch: 'Product Launch', reputation: 'Reputation Building', appinstalls: 'App Growth',
        community: 'Community Building'
      };
      return goalLabels[goal] || goal;
    }

    const now = new Date();
    const month = now.toLocaleDateString('en-US', { month: 'short' });
    return `Campaign ${month} ${now.getDate()}`;
  };

  const handleSubmit = async (finalAnswers: Record<string, string>) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);

    const name = generateCampaignName(finalAnswers);
    const existingCampaignId = campaignId || (await ensureCampaign(finalAnswers, currentStage, stageIndex));

    if (!existingCampaignId) {
      setLoading(false);
      return;
    }

    const res = await api.updateCampaign(existingCampaignId, {
      name: name.trim().replace(/\s+/g, ' ').slice(0, 120),
      quizData: { ...finalAnswers, phase: '1' },
      status: 'ACTIVE'
    });

    if (res.success && res.data) {
      navigate(`/chat/${existingCampaignId}?autostart=true`);
      return;
    }

    alert(
      res.error ||
      'Failed to finalize campaign. Please try again.'
    );
    setLoading(false);
  };

  // Count answered questions
  const answeredCount = Object.keys(answers).filter(k => answers[k] && answers[k] !== 'not_sure').length;
  const glossaryMatches = findGlossaryMatches(
    `${currentQuestion.question} ${Object.values(answers).join(' ')}`,
    6
  );

  if (loading || isResuming) {
    return (
      <div className="quiz-page">
        <div className="quiz-loading">
          <motion.div
            className="loading-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles size={48} />
          </motion.div>
          <h2>Loading your progress...</h2>
          <p>Preparing the next stage</p>
          <div className="loading-dots">
            <span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-page">
      {/* Header */}
      <header className="quiz-header">
        <button
          className="header-back-btn"
          onClick={handleBack}
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="header-progress">
          <div className="stage-indicator">
            <span className="stage-title">{currentStage.title}</span>
            <span className="stage-subtitle">{currentStage.description}</span>
          </div>
          <div className="progress-indicator">
            <span className="progress-current">{flatQuestionIndex + 1}</span>
            <span className="progress-divider">/</span>
            <span className="progress-total">{totalQuestions}</span>
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${((flatQuestionIndex + 1) / totalQuestions) * 100}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>
        <button
          className={`summary-toggle-btn ${glossaryOpen ? 'active' : ''}`}
          onClick={() => {
            const next = !glossaryOpen;
            setGlossaryOpen(next);
            if (next) setSummaryOpen(false);
          }}
          title="Open glossary"
          aria-label="Open glossary"
        >
          <BookOpen size={18} />
        </button>
        <button
          className={`summary-toggle-btn ${summaryOpen ? 'active' : ''}`}
          onClick={() => {
            const next = !summaryOpen;
            setSummaryOpen(next);
            if (next) setGlossaryOpen(false);
          }}
          title="View summary"
          aria-label="View summary"
        >
          <ListChecks size={18} />
          {answeredCount > 0 && <span className="answered-badge">{answeredCount}</span>}
        </button>
      </header>

      {/* Glossary Panel */}
      <AnimatePresence>
        {glossaryOpen && (
          <motion.aside
            className="quiz-summary-panel glossary-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="summary-header">
              <div>
                <h3>Marketing Glossary</h3>
                <p className="summary-subtitle">Key terms used by marketers</p>
              </div>
              <button className="summary-close" onClick={() => setGlossaryOpen(false)}>
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="summary-list">
              {glossaryMatches.length > 0 && (
                <div className="glossary-section">
                  <span className="glossary-section-title">Suggested for you</span>
                  {glossaryMatches.map((entry) => (
                    <div key={entry.id} className="glossary-item">
                      <div className="glossary-term">{entry.term}</div>
                      <div className="glossary-name">{entry.name}</div>
                      <p className="glossary-definition">{entry.definition}</p>
                    </div>
                  ))}
                </div>
              )}
              {glossaryGroups.map((group) => (
                <div key={group.id} className="glossary-section">
                  <span className="glossary-section-title">{group.label}</span>
                  {getGlossaryByGroup(group.id).map((entry) => (
                    <div key={entry.id} className="glossary-item">
                      <div className="glossary-term">{entry.term}</div>
                      <div className="glossary-name">{entry.name}</div>
                      <p className="glossary-definition">{entry.definition}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Summary Panel */}
      <AnimatePresence>
        {summaryOpen && (
          <motion.aside
            className="quiz-summary-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="summary-header">
              <div>
                <h3>Your Answers</h3>
                <p className="summary-subtitle">Jump to any question</p>
              </div>
              <button className="summary-close" onClick={() => setSummaryOpen(false)}>
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="summary-list">
              {allQuestions.map((q, index) => {
                const answer = answers[q.id];
                const hasAnswer = answer && answer !== 'not_sure';
                const QIcon = q.icon;
                const stageLabel = stages[questionStageLookup[q.id]]?.title;

                return (
                  <button
                    key={q.id}
                    className={`summary-item ${index === flatQuestionIndex ? 'current' : ''} ${hasAnswer ? 'answered' : ''}`}
                    onClick={() => handleJumpToQuestion(index)}
                  >
                    <div className="summary-item-left">
                      <div className="summary-item-status">
                        {hasAnswer ? (
                          <CheckCircle2 size={16} className="summary-check-icon" />
                        ) : (
                          <span className="summary-empty-dot" />
                        )}
                      </div>
                      <div className="summary-item-icon">
                        <QIcon size={14} />
                      </div>
                      <div className="summary-item-text">
                        <span className="summary-item-label">{q.shortLabel}</span>
                        <span className="summary-item-stage">{stageLabel}</span>
                      </div>
                    </div>
                    <span className="summary-item-answer">
                      {hasAnswer ? getAnswerDisplay(q.id, answer) : '—'}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`quiz-main ${summaryOpen || glossaryOpen ? 'with-summary' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${stageIndex}-${questionIndex}`}
            className="quiz-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Question Icon */}
            <div className="question-icon">
              <Icon size={28} />
            </div>

            {/* Question */}
            <h1 className="question-title">{currentQuestion.question}</h1>

            {/* Text Input Type */}
            {currentQuestion.type === 'text' ? (
              <>
                <div className="text-input-box">
                  <input
                    type="text"
                    placeholder={currentQuestion.placeholder || ''}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                    autoFocus
                  />
                </div>
                <div className="text-input-actions">
                  <button className="skip-text-btn" onClick={handleSkip}>
                    <HelpCircle size={16} />
                    Skip
                  </button>
                  <button className="submit-text-btn" onClick={handleTextSubmit}>
                    {savingStage ? 'Saving...' : 'Continue'}
                    <ChevronRight size={18} />
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Special Actions for select type */}
                <div className="special-actions">
                  <button
                    className={`special-btn ${answers[currentQuestion.id] === 'not_sure' ? 'active' : ''}`}
                    onClick={handleSkip}
                  >
                    <HelpCircle size={16} />
                    <span>Skip</span>
                  </button>
                  <button
                    className={`special-btn ${customInputOpen ? 'active' : ''}`}
                    onClick={() => { setCustomInputOpen(!customInputOpen); setCustomInput(''); }}
                  >
                    <Pencil size={16} />
                    <span>Other</span>
                  </button>
                </div>

                {currentQuestion.allowMultiple && (
                  <div className="multi-select-hint">
                    {'You can choose multiple options, then press Continue.'}
                  </div>
                )}

                {/* Custom Input */}
                <AnimatePresence>
                  {customInputOpen && (
                    <motion.div
                      className="custom-input-box"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <input
                        type="text"
                        placeholder="Type your own answer..."
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
                        autoFocus
                      />
                      <button onClick={handleCustomSubmit}>
                        Submit
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Options Grid */}
                <div className={`options-grid cols-${(currentQuestion.options?.length || 0) <= 4 ? '2' : '2'}`}>
                  {currentQuestion.options?.map((option, index) => (
                    <motion.button
                      key={option.value}
                      className={`option-btn ${currentQuestion.allowMultiple
                        ? (multiSelections.includes(option.value) ? 'selected' : '')
                        : (answers[currentQuestion.id] === option.value ? 'selected' : '')}`}
                      onClick={() => { handleSelect(option.value); setCustomInputOpen(false); }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {option.label}
                    </motion.button>
                  ))}
                </div>
                {currentQuestion.allowMultiple && (
                  <div className="multi-select-actions">
                    <button
                      className="submit-text-btn"
                      onClick={handleMultiContinue}
                      disabled={multiSelections.length === 0}
                    >
                      {'Continue'}
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Previous Button */}
            {(stageIndex > 0 || questionIndex > 0) && (
              <button className="prev-step-btn" onClick={handlePrevStep}>
                <ChevronLeft size={18} />
                <span>Previous</span>
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Background */}
      <div className="quiz-bg-gradient" />
    </div>
  );
}
