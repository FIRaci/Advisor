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
  question: { en: string; vi: string };
  shortLabel: { en: string; vi: string };
  type: 'select' | 'text';
  options?: { value: string; label: { en: string; vi: string } }[];
  placeholder?: { en: string; vi: string };
}

interface QuizStage {
  id: string;
  title: { en: string; vi: string };
  description: { en: string; vi: string };
  questions: Question[];
}

const questions: Question[] = [
  // 1. Product/Service Name (text input)
  {
    id: 'productName',
    icon: Package,
    question: { en: 'What is your product or service name?', vi: 'Tên sản phẩm hoặc dịch vụ của bạn là gì?' },
    shortLabel: { en: 'Product Name', vi: 'Tên sản phẩm' },
    type: 'text',
    placeholder: { en: 'Enter product/service name (or skip if unsure)', vi: 'Nhập tên sản phẩm/dịch vụ (hoặc bỏ qua nếu chưa biết)' }
  },
  // 2. Business Type
  {
    id: 'business',
    icon: Building,
    question: { en: 'What type of business do you have?', vi: 'Doanh nghiệp của bạn thuộc loại nào?' },
    shortLabel: { en: 'Business Type', vi: 'Loại hình' },
    type: 'select',
    options: [
      { value: 'ecommerce', label: { en: 'E-commerce / Online Store', vi: 'Thương mại điện tử' } },
      { value: 'saas', label: { en: 'SaaS / Software', vi: 'SaaS / Phần mềm' } },
      { value: 'service', label: { en: 'Professional Services', vi: 'Dịch vụ chuyên nghiệp' } },
      { value: 'local', label: { en: 'Local Business / Retail', vi: 'Kinh doanh địa phương' } },
      { value: 'agency', label: { en: 'Marketing Agency', vi: 'Công ty Marketing' } },
      { value: 'education', label: { en: 'Education / Courses', vi: 'Giáo dục / Khóa học' } },
      { value: 'healthcare', label: { en: 'Healthcare / Wellness', vi: 'Y tế / Sức khỏe' } },
      { value: 'fintech', label: { en: 'Fintech / Finance', vi: 'Fintech / Tài chính' } },
      { value: 'food', label: { en: 'Food & Beverage', vi: 'Thực phẩm & Đồ uống' } },
      { value: 'travel', label: { en: 'Travel / Hospitality', vi: 'Du lịch / Khách sạn' } },
      { value: 'realestate', label: { en: 'Real Estate', vi: 'Bất động sản' } },
      { value: 'entertainment', label: { en: 'Entertainment / Media', vi: 'Giải trí / Truyền thông' } }
    ]
  },
  // 3. Business Stage
  {
    id: 'stage',
    icon: Zap,
    question: { en: 'What stage is your business at?', vi: 'Doanh nghiệp của bạn đang ở giai đoạn nào?' },
    shortLabel: { en: 'Stage', vi: 'Giai đoạn' },
    type: 'select',
    options: [
      { value: 'idea', label: { en: 'Idea / Pre-launch', vi: 'Ý tưởng / Trước ra mắt' } },
      { value: 'startup', label: { en: 'Startup (< 1 year)', vi: 'Khởi nghiệp (< 1 năm)' } },
      { value: 'growing', label: { en: 'Growing (1-3 years)', vi: 'Đang phát triển (1-3 năm)' } },
      { value: 'established', label: { en: 'Established (3-5 years)', vi: 'Ổn định (3-5 năm)' } },
      { value: 'mature', label: { en: 'Mature (5+ years)', vi: 'Trưởng thành (5+ năm)' } },
      { value: 'scaling', label: { en: 'Scaling / Expanding', vi: 'Mở rộng quy mô' } }
    ]
  },
  // 4. Target Audience
  {
    id: 'audience',
    icon: Users,
    question: { en: 'Who is your target audience?', vi: 'Đối tượng khách hàng mục tiêu?' },
    shortLabel: { en: 'Audience', vi: 'Đối tượng' },
    type: 'select',
    options: [
      { value: 'b2b', label: { en: 'B2B (Businesses)', vi: 'B2B (Doanh nghiệp)' } },
      { value: 'b2c', label: { en: 'B2C (Consumers)', vi: 'B2C (Người tiêu dùng)' } },
      { value: 'both', label: { en: 'Both B2B and B2C', vi: 'Cả B2B và B2C' } },
      { value: 'genz', label: { en: 'Gen Z (18-25)', vi: 'Gen Z (18-25)' } },
      { value: 'millennials', label: { en: 'Millennials (26-40)', vi: 'Millennials (26-40)' } },
      { value: 'genx', label: { en: 'Gen X & Older (40+)', vi: 'Gen X trở lên (40+)' } },
      { value: 'enterprise', label: { en: 'Enterprise Companies', vi: 'Doanh nghiệp lớn' } },
      { value: 'startups', label: { en: 'Startups & SMBs', vi: 'Startup & SMB' } },
      { value: 'women', label: { en: 'Women-focused', vi: 'Phụ nữ' } },
      { value: 'men', label: { en: 'Men-focused', vi: 'Nam giới' } },
      { value: 'parents', label: { en: 'Parents / Families', vi: 'Phụ huynh / Gia đình' } },
      { value: 'students', label: { en: 'Students', vi: 'Sinh viên' } }
    ]
  },
  // 5. Marketing Goal
  {
    id: 'goal',
    icon: Target,
    question: { en: 'What is your main marketing goal?', vi: 'Mục tiêu marketing chính của bạn?' },
    shortLabel: { en: 'Goal', vi: 'Mục tiêu' },
    type: 'select',
    options: [
      { value: 'awareness', label: { en: 'Brand Awareness', vi: 'Nhận diện thương hiệu' } },
      { value: 'leads', label: { en: 'Generate Leads', vi: 'Tạo khách hàng tiềm năng' } },
      { value: 'sales', label: { en: 'Increase Sales', vi: 'Tăng doanh số' } },
      { value: 'retention', label: { en: 'Customer Retention', vi: 'Giữ chân khách hàng' } },
      { value: 'traffic', label: { en: 'Website Traffic', vi: 'Lưu lượng website' } },
      { value: 'engagement', label: { en: 'Social Engagement', vi: 'Tương tác mạng xã hội' } },
      { value: 'launch', label: { en: 'Product Launch', vi: 'Ra mắt sản phẩm' } },
      { value: 'reputation', label: { en: 'Reputation Management', vi: 'Quản lý danh tiếng' } },
      { value: 'appinstalls', label: { en: 'App Installs', vi: 'Cài đặt ứng dụng' } },
      { value: 'community', label: { en: 'Community Building', vi: 'Xây dựng cộng đồng' } }
    ]
  },
  // 6. USP / Unique Selling Point (text input)
  {
    id: 'usp',
    icon: Heart,
    question: { en: 'What makes your product/service unique?', vi: 'Điều gì khiến sản phẩm/dịch vụ của bạn độc đáo?' },
    shortLabel: { en: 'USP', vi: 'Điểm nổi bật' },
    type: 'text',
    placeholder: { en: 'Describe your unique selling point...', vi: 'Mô tả điểm bán hàng độc đáo của bạn...' }
  },
  // 7. Marketing Channels
  {
    id: 'channels',
    icon: Megaphone,
    question: { en: 'Which marketing channels interest you most?', vi: 'Kênh marketing nào bạn quan tâm nhất?' },
    shortLabel: { en: 'Channels', vi: 'Kênh' },
    type: 'select',
    options: [
      { value: 'social', label: { en: 'Social Media (FB, IG, X)', vi: 'Mạng xã hội (FB, IG, X)' } },
      { value: 'search', label: { en: 'Google Ads & SEO', vi: 'Google Ads & SEO' } },
      { value: 'email', label: { en: 'Email Marketing', vi: 'Email Marketing' } },
      { value: 'content', label: { en: 'Content / Blog', vi: 'Content / Blog' } },
      { value: 'video', label: { en: 'YouTube / TikTok', vi: 'YouTube / TikTok' } },
      { value: 'influencer', label: { en: 'Influencer / KOL', vi: 'Influencer / KOL' } },
      { value: 'affiliate', label: { en: 'Affiliate Marketing', vi: 'Affiliate Marketing' } },
      { value: 'podcast', label: { en: 'Podcast / Audio', vi: 'Podcast / Audio' } },
      { value: 'offline', label: { en: 'Offline / Events', vi: 'Offline / Sự kiện' } },
      { value: 'all', label: { en: 'Multi-channel', vi: 'Đa kênh' } }
    ]
  },
  // 8. Current Situation
  {
    id: 'currentMarketing',
    icon: BarChart3,
    question: { en: 'What is your current marketing situation?', vi: 'Tình hình marketing hiện tại của bạn?' },
    shortLabel: { en: 'Current', vi: 'Hiện tại' },
    type: 'select',
    options: [
      { value: 'none', label: { en: 'No marketing yet', vi: 'Chưa có marketing' } },
      { value: 'basic', label: { en: 'Basic social media', vi: 'Mạng xã hội cơ bản' } },
      { value: 'active', label: { en: 'Active on multiple channels', vi: 'Hoạt động nhiều kênh' } },
      { value: 'paid', label: { en: 'Running paid ads', vi: 'Đang chạy quảng cáo trả phí' } },
      { value: 'team', label: { en: 'Have marketing team', vi: 'Có đội ngũ marketing' } },
      { value: 'agency', label: { en: 'Working with agency', vi: 'Làm việc với agency' } }
    ]
  },
  // 9. Experience Level
  {
    id: 'experience',
    icon: TrendingUp,
    question: { en: 'Your marketing experience level?', vi: 'Kinh nghiệm marketing của bạn?' },
    shortLabel: { en: 'Experience', vi: 'Kinh nghiệm' },
    type: 'select',
    options: [
      { value: 'beginner', label: { en: 'Beginner', vi: 'Người mới bắt đầu' } },
      { value: 'intermediate', label: { en: 'Intermediate', vi: 'Trung bình' } },
      { value: 'advanced', label: { en: 'Advanced', vi: 'Nâng cao' } },
      { value: 'expert', label: { en: 'Expert', vi: 'Chuyên gia' } }
    ]
  },
  // 10. Competitors (text input)
  {
    id: 'competitors',
    icon: Briefcase,
    question: { en: 'Who are your main competitors?', vi: 'Đối thủ cạnh tranh chính của bạn là ai?' },
    shortLabel: { en: 'Competitors', vi: 'Đối thủ' },
    type: 'text',
    placeholder: { en: 'List 1-3 competitors (or skip)', vi: 'Liệt kê 1-3 đối thủ (hoặc bỏ qua)' }
  },
  // 11. Timeline
  {
    id: 'timeline',
    icon: Clock,
    question: { en: 'Expected timeline for results?', vi: 'Bạn mong đợi kết quả trong bao lâu?' },
    shortLabel: { en: 'Timeline', vi: 'Thời gian' },
    type: 'select',
    options: [
      { value: 'immediate', label: { en: '1-2 weeks', vi: '1-2 tuần' } },
      { value: 'short', label: { en: '1-3 months', vi: '1-3 tháng' } },
      { value: 'medium', label: { en: '3-6 months', vi: '3-6 tháng' } },
      { value: 'long', label: { en: '6-12 months', vi: '6-12 tháng' } },
      { value: 'longterm', label: { en: '1+ year', vi: '1+ năm' } }
    ]
  },
  // 12. Target Region
  {
    id: 'region',
    icon: Globe,
    question: { en: 'Target market region?', vi: 'Khu vực thị trường mục tiêu?' },
    shortLabel: { en: 'Region', vi: 'Khu vực' },
    type: 'select',
    options: [
      { value: 'local', label: { en: 'Local / City', vi: 'Địa phương' } },
      { value: 'national', label: { en: 'National (Vietnam)', vi: 'Toàn quốc (Việt Nam)' } },
      { value: 'regional', label: { en: 'Southeast Asia', vi: 'Đông Nam Á' } },
      { value: 'asia', label: { en: 'Asia Pacific', vi: 'Châu Á TBD' } },
      { value: 'us', label: { en: 'United States', vi: 'Hoa Kỳ' } },
      { value: 'europe', label: { en: 'Europe', vi: 'Châu Âu' } },
      { value: 'global', label: { en: 'Global', vi: 'Toàn cầu' } }
    ]
  },
  // 13. Platform Focus
  {
    id: 'platform',
    icon: Smartphone,
    question: { en: 'Where do customers interact with you?', vi: 'Khách hàng tương tác với bạn ở đâu?' },
    shortLabel: { en: 'Platform', vi: 'Nền tảng' },
    type: 'select',
    options: [
      { value: 'website', label: { en: 'Website', vi: 'Website' } },
      { value: 'app', label: { en: 'Mobile App', vi: 'Ứng dụng di động' } },
      { value: 'social', label: { en: 'Social Media', vi: 'Mạng xã hội' } },
      { value: 'marketplace', label: { en: 'Marketplace (Shopee, Lazada)', vi: 'Sàn TMĐT (Shopee, Lazada)' } },
      { value: 'store', label: { en: 'Physical Store', vi: 'Cửa hàng' } },
      { value: 'multiple', label: { en: 'Multiple platforms', vi: 'Nhiều nền tảng' } }
    ]
  },
  // 14. Price Range
  {
    id: 'priceRange',
    icon: ShoppingBag,
    question: { en: 'What is your product/service price range?', vi: 'Mức giá sản phẩm/dịch vụ của bạn?' },
    shortLabel: { en: 'Price', vi: 'Giá' },
    type: 'select',
    options: [
      { value: 'free', label: { en: 'Free / Freemium', vi: 'Miễn phí / Freemium' } },
      { value: 'low', label: { en: 'Low-cost (< $50)', vi: 'Giá thấp (< $50)' } },
      { value: 'mid', label: { en: 'Mid-range ($50-$500)', vi: 'Trung bình ($50-$500)' } },
      { value: 'premium', label: { en: 'Premium ($500-$5,000)', vi: 'Cao cấp ($500-$5,000)' } },
      { value: 'luxury', label: { en: 'Luxury ($5,000+)', vi: 'Xa xỉ ($5,000+)' } },
      { value: 'varies', label: { en: 'Varies by product', vi: 'Tùy sản phẩm' } }
    ]
  },
  // 15. Budget
  {
    id: 'budget',
    icon: DollarSign,
    question: { en: 'Monthly marketing budget?', vi: 'Ngân sách marketing hàng tháng?' },
    shortLabel: { en: 'Budget', vi: 'Ngân sách' },
    type: 'select',
    options: [
      { value: 'minimal', label: { en: 'Under $500', vi: 'Dưới $500' } },
      { value: 'small', label: { en: '$500 - $1,000', vi: '$500 - $1,000' } },
      { value: 'medium', label: { en: '$1,000 - $5,000', vi: '$1,000 - $5,000' } },
      { value: 'large', label: { en: '$5,000 - $20,000', vi: '$5,000 - $20,000' } },
      { value: 'enterprise', label: { en: '$20,000 - $100,000', vi: '$20,000 - $100,000' } },
      { value: 'unlimited', label: { en: '$100,000+', vi: '$100,000+' } }
    ]
  },
  // 16. Seasonal impact
  {
    id: 'seasonality',
    icon: Clock,
    question: { en: 'Does your business have seasonal peaks?', vi: 'Doanh nghiệp của bạn có mùa cao điểm không?' },
    shortLabel: { en: 'Seasonality', vi: 'Mùa vụ' },
    type: 'select',
    options: [
      { value: 'none', label: { en: 'No major seasonality', vi: 'Không có mùa vụ rõ ràng' } },
      { value: 'holiday', label: { en: 'Holiday-driven', vi: 'Theo dip le tet' } },
      { value: 'summer', label: { en: 'Summer peak', vi: 'Cao diem mua he' } },
      { value: 'yearend', label: { en: 'Year-end peak', vi: 'Cao diem cuoi nam' } },
      { value: 'event', label: { en: 'Event/campaign driven', vi: 'Theo su kien/chien dich' } },
      { value: 'always', label: { en: 'Always-on demand', vi: 'Nhu cau on dinh quanh nam' } }
    ]
  },
  // 17. Preferred content format
  {
    id: 'contentFormat',
    icon: Megaphone,
    question: { en: 'What content format fits your brand best?', vi: 'Định dạng nội dung nào phù hợp với thương hiệu nhất?' },
    shortLabel: { en: 'Content', vi: 'Noi dung' },
    type: 'select',
    options: [
      { value: 'short_video', label: { en: 'Short videos (Reels/TikTok)', vi: 'Video ngan (Reels/TikTok)' } },
      { value: 'long_video', label: { en: 'Long-form video', vi: 'Video dai' } },
      { value: 'static_visual', label: { en: 'Static visuals/carousels', vi: 'Hinh anh/carousel' } },
      { value: 'article', label: { en: 'Articles/blog posts', vi: 'Bai viet/blog' } },
      { value: 'email', label: { en: 'Email/newsletter', vi: 'Email/newsletter' } },
      { value: 'mixed', label: { en: 'Mixed format', vi: 'Kết hợp nhiều định dạng' } }
    ]
  },
  // 18. Offer type
  {
    id: 'offerType',
    icon: Target,
    question: { en: 'What offer do you usually run?', vi: 'Loai uu dai ban thuong chay la gi?' },
    shortLabel: { en: 'Offer', vi: 'Uu dai' },
    type: 'select',
    options: [
      { value: 'discount', label: { en: 'Discount / flash sale', vi: 'Giảm giá / flash sale' } },
      { value: 'bundle', label: { en: 'Bundle package', vi: 'Goi combo' } },
      { value: 'trial', label: { en: 'Free trial / freemium', vi: 'Dùng thử miễn phí / freemium' } },
      { value: 'gift', label: { en: 'Gift with purchase', vi: 'Tặng quà kèm' } },
      { value: 'consultation', label: { en: 'Free consultation/demo', vi: 'Tư vấn/demo miễn phí' } },
      { value: 'custom_offer', label: { en: 'Custom by customer segment', vi: 'Cá nhân hóa theo nhóm khách hàng' } }
    ]
  }
];

const stageBlueprints = [
  {
    id: 'basics',
    title: { en: 'Business Basics', vi: 'Tổng quan doanh nghiệp' },
    description: { en: 'Core business profile and audience', vi: 'Thông tin cơ bản và đối tượng' },
    questionIds: ['productName', 'business', 'stage', 'audience', 'region', 'platform', 'priceRange']
  },
  {
    id: 'goals',
    title: { en: 'Goals & Channels', vi: 'Mục tiêu & Kênh' },
    description: { en: 'Objectives and current marketing setup', vi: 'Mục tiêu và tình hình marketing' },
    questionIds: ['goal', 'usp', 'channels', 'currentMarketing', 'experience', 'competitors', 'timeline']
  },
  {
    id: 'execution',
    title: { en: 'Budget & Execution', vi: 'Ngan sach & Thuc thi' },
    description: { en: 'Budget, seasonality, content, offers', vi: 'Ngan sach, mua vu, noi dung, uu dai' },
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
  const { token } = useAuthStore();

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

  let lang: 'en' | 'vi' = 'en';
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
    if (!resumeCampaignId || !token) {
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
  }, [resumeCampaignId, token]);

  // Get display value for an answer
  const getAnswerDisplay = (questionId: string, value: string): string => {
    if (!value || value === 'not_sure') return lang === 'en' ? 'Skipped' : 'Bỏ qua';
    if (value.startsWith('custom: ')) return value.replace('custom: ', '');

    const question = questions.find(q => q.id === questionId);
    if (!question) return value;

    if (question.type === 'text') return value;

    const option = question.options?.find(o => o.value === value);
    return option ? option.label[lang] : value;
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
          stageLabel: stage.title[lang],
          completedAt: nowIso,
          answers: stageAnswers
        }
      ]
    };
  };

  const ensureCampaign = async (payload: Record<string, string>, stage: QuizStage, index: number) => {
    if (campaignId) return campaignId;
    if (!token) {
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
      (lang === 'en'
        ? 'Failed to create campaign. Please try again.'
        : 'Không thể tạo chiến dịch. Vui lòng thử lại.')
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
      stageLabel: stage.title[lang],
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
    if (!token) {
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
      quizData: finalAnswers,
      status: 'ACTIVE'
    });

    if (res.success && res.data) {
      navigate(`/chat/${existingCampaignId}?autostart=true`);
      return;
    }

    alert(
      res.error ||
      (lang === 'en'
        ? 'Failed to finalize campaign. Please try again.'
        : 'Không thể hoàn tất chiến dịch. Vui lòng thử lại.')
    );
    setLoading(false);
  };

  // Count answered questions
  const answeredCount = Object.keys(answers).filter(k => answers[k] && answers[k] !== 'not_sure').length;
  const glossaryMatches = findGlossaryMatches(
    `${currentQuestion.question[lang]} ${Object.values(answers).join(' ')}`,
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
          <h2>{lang === 'en' ? 'Loading your progress...' : 'Dang tai tien do...'}</h2>
          <p>{lang === 'en' ? 'Preparing the next stage' : 'Dang chuan bi buoc tiep theo'}</p>
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
          aria-label={lang === 'en' ? 'Go back' : 'Quay lại'}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="header-progress">
          <div className="stage-indicator">
            <span className="stage-title">{currentStage.title[lang]}</span>
            <span className="stage-subtitle">{currentStage.description[lang]}</span>
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
          title={lang === 'en' ? 'Open glossary' : 'Mở từ điển thuật ngữ'}
          aria-label={lang === 'en' ? 'Open glossary' : 'Mở từ điển thuật ngữ'}
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
          title={lang === 'en' ? 'View summary' : 'Xem tóm tắt'}
          aria-label={lang === 'en' ? 'View summary' : 'Xem tóm tắt'}
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
                <h3>{lang === 'en' ? 'Marketing Glossary' : 'Tu dien marketing'}</h3>
                <p className="summary-subtitle">{lang === 'en' ? 'Key terms used by marketers' : 'Thuat ngu hay gap trong marketing'}</p>
              </div>
              <button className="summary-close" onClick={() => setGlossaryOpen(false)}>
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="summary-list">
              {glossaryMatches.length > 0 && (
                <div className="glossary-section">
                  <span className="glossary-section-title">{lang === 'en' ? 'Suggested for you' : 'Goi y lien quan'}</span>
                  {glossaryMatches.map((entry) => (
                    <div key={entry.id} className="glossary-item">
                      <div className="glossary-term">{entry.term}</div>
                      <div className="glossary-name">{entry.name[lang]}</div>
                      <p className="glossary-definition">{entry.definition[lang]}</p>
                    </div>
                  ))}
                </div>
              )}
              {glossaryGroups.map((group) => (
                <div key={group.id} className="glossary-section">
                  <span className="glossary-section-title">{group.label[lang]}</span>
                  {getGlossaryByGroup(group.id).map((entry) => (
                    <div key={entry.id} className="glossary-item">
                      <div className="glossary-term">{entry.term}</div>
                      <div className="glossary-name">{entry.name[lang]}</div>
                      <p className="glossary-definition">{entry.definition[lang]}</p>
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
                <h3>{lang === 'en' ? 'Your Answers' : 'Câu trả lời của bạn'}</h3>
                <p className="summary-subtitle">{lang === 'en' ? 'Jump to any question' : 'Chuyen den bat ky cau nao'}</p>
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
                const stageLabel = stages[questionStageLookup[q.id]]?.title[lang];

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
                        <span className="summary-item-label">{q.shortLabel[lang]}</span>
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
            <h1 className="question-title">{currentQuestion.question[lang]}</h1>

            {/* Text Input Type */}
            {currentQuestion.type === 'text' ? (
              <>
                <div className="text-input-box">
                  <input
                    type="text"
                    placeholder={currentQuestion.placeholder?.[lang] || ''}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                    autoFocus
                  />
                </div>
                <div className="text-input-actions">
                  <button className="skip-text-btn" onClick={handleSkip}>
                    <HelpCircle size={16} />
                    {lang === 'en' ? 'Skip' : 'Bỏ qua'}
                  </button>
                  <button className="submit-text-btn" onClick={handleTextSubmit}>
                    {savingStage ? (lang === 'en' ? 'Saving...' : 'Dang luu...') : (lang === 'en' ? 'Continue' : 'Tiếp tục')}
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
                    <span>{lang === 'en' ? "Skip" : 'Bỏ qua'}</span>
                  </button>
                  <button
                    className={`special-btn ${customInputOpen ? 'active' : ''}`}
                    onClick={() => { setCustomInputOpen(!customInputOpen); setCustomInput(''); }}
                  >
                    <Pencil size={16} />
                    <span>{lang === 'en' ? 'Other' : 'Tự điền'}</span>
                  </button>
                </div>

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
                        placeholder={lang === 'en' ? 'Type your own answer...' : 'Nhập câu trả lời của bạn...'}
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
                        autoFocus
                      />
                      <button onClick={handleCustomSubmit}>
                        {lang === 'en' ? 'Submit' : 'Gửi'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Options Grid */}
                <div className={`options-grid cols-${(currentQuestion.options?.length || 0) <= 4 ? '2' : '2'}`}>
                  {currentQuestion.options?.map((option, index) => (
                    <motion.button
                      key={option.value}
                      className={`option-btn ${answers[currentQuestion.id] === option.value ? 'selected' : ''}`}
                      onClick={() => { handleSelect(option.value); setCustomInputOpen(false); }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {option.label[lang]}
                    </motion.button>
                  ))}
                </div>
              </>
            )}

            {/* Previous Button */}
            {(stageIndex > 0 || questionIndex > 0) && (
              <button className="prev-step-btn" onClick={handlePrevStep}>
                <ChevronLeft size={18} />
                <span>{lang === 'en' ? 'Previous' : 'Quay lại'}</span>
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
