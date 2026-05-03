import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Sparkles, Trash2, Plus, MessageSquare, ChevronLeft, ChevronRight, 
  Settings, LogOut, MoreHorizontal, Pencil, Star, Copy, Check, ListChecks
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuthStore } from '../store/authStore';
import { api, Campaign as ApiCampaign, ChatMessage } from '../hooks/useApi';
import './Chat.css';

type Message = ChatMessage;

interface Campaign extends Pick<ApiCampaign, 'id' | 'name' | 'createdAt' | 'isFavorite'> {
  status?: ApiCampaign['status'];
  quizData?: Record<string, string>;
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lang = i18n.language as 'en' | 'vi';
  const isLoggedIn = Boolean(token);

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
    document.documentElement.classList.add('chat-page-active');
    document.body.classList.add('chat-page-active');

    return () => {
      document.documentElement.classList.remove('chat-page-active');
      document.body.classList.remove('chat-page-active');
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    fetchCampaigns();
    fetchHistory();
    if (campaignId) {
      fetchCurrentCampaign();
    } else {
      setCurrentCampaign(null);
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

    const res = await api.sendMessage(initialPrompt, campaignId);
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

    const res = await api.sendMessage(nextInput, targetCampaignId);
    const assistantMessage = res.data;

    if (res.success && assistantMessage) {
      setMessages((prev) => [...prev, assistantMessage]);

      if (isStartingFromBlank) {
        const historyRes = await api.getChatHistory(targetCampaignId, 300);
        if (historyRes.success && historyRes.data) {
          setMessages(historyRes.data);
        }
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
    navigate('/quiz', { state: { from: campaignId ? `/chat/${campaignId}` : '/chat' } });
  };

  const focusComposer = () => {
    textareaRef.current?.focus();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyMessage = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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

  // Get quiz summary info for display
  const getQuizSummaryItems = () => {
    if (!currentCampaign?.quizData) return [];
    const quizData = currentCampaign.quizData;
    const items: { label: string; value: string }[] = [];
    
    if (quizData.productName && quizData.productName !== 'not_sure') {
      items.push({ label: lang === 'en' ? 'Product' : 'Sản phẩm', value: quizData.productName });
    }
    if (quizData.business && quizData.business !== 'not_sure') {
      items.push({ label: lang === 'en' ? 'Business' : 'Loại hình', value: quizData.business });
    }
    if (quizData.audience && quizData.audience !== 'not_sure') {
      items.push({ label: lang === 'en' ? 'Audience' : 'Đối tượng', value: quizData.audience });
    }
    if (quizData.goal && quizData.goal !== 'not_sure') {
      items.push({ label: lang === 'en' ? 'Goal' : 'Mục tiêu', value: quizData.goal });
    }
    if (quizData.budget && quizData.budget !== 'not_sure') {
      items.push({ label: lang === 'en' ? 'Budget' : 'Ngân sách', value: quizData.budget });
    }
    if (quizData.seasonality && quizData.seasonality !== 'not_sure') {
      items.push({ label: lang === 'en' ? 'Seasonality' : 'Mùa vụ', value: quizData.seasonality });
    }
    if (quizData.contentFormat && quizData.contentFormat !== 'not_sure') {
      items.push({ label: lang === 'en' ? 'Content' : 'Nội dung', value: quizData.contentFormat });
    }
    if (quizData.offerType && quizData.offerType !== 'not_sure') {
      items.push({ label: lang === 'en' ? 'Offer' : 'Ưu đãi', value: quizData.offerType });
    }
    
    return items.slice(0, 4); // Show max 4 items for header bar
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

    const items: { icon: string; label: string; value: string }[] = [];
    
    if (quizData.productName && quizData.productName !== 'not_sure') {
      items.push({ icon: '📦', label: lang === 'en' ? 'Product' : 'Sản phẩm', value: quizData.productName });
    }
    
    const businessValue = getLabel(quizData.business, businessLabels);
    if (businessValue) {
      items.push({ icon: '🏢', label: lang === 'en' ? 'Business' : 'Loại hình', value: businessValue });
    }
    
    const audienceValue = getLabel(quizData.audience, audienceLabels);
    if (audienceValue) {
      items.push({ icon: '👥', label: lang === 'en' ? 'Audience' : 'Đối tượng', value: audienceValue });
    }
    
    const goalValue = getLabel(quizData.goal, goalLabels);
    if (goalValue) {
      items.push({ icon: '🎯', label: lang === 'en' ? 'Goal' : 'Mục tiêu', value: goalValue });
    }
    
    const channelValue = getLabel(quizData.channels, channelLabels);
    if (channelValue) {
      items.push({ icon: '📢', label: lang === 'en' ? 'Channels' : 'Kênh', value: channelValue });
    }
    
    const budgetValue = getLabel(quizData.budget, budgetLabels);
    if (budgetValue) {
      items.push({ icon: '💰', label: lang === 'en' ? 'Budget' : 'Ngân sách', value: budgetValue });
    }
    
    const regionValue = getLabel(quizData.region, regionLabels);
    if (regionValue) {
      items.push({ icon: '🌍', label: lang === 'en' ? 'Region' : 'Khu vực', value: regionValue });
    }

    const seasonalityValue = getLabel(quizData.seasonality, seasonalityLabels);
    if (seasonalityValue) {
      items.push({ icon: '📅', label: lang === 'en' ? 'Seasonality' : 'Mùa vụ', value: seasonalityValue });
    }

    const contentFormatValue = getLabel(quizData.contentFormat, contentFormatLabels);
    if (contentFormatValue) {
      items.push({ icon: '🎬', label: lang === 'en' ? 'Content Format' : 'Định dạng nội dung', value: contentFormatValue });
    }

    const offerTypeValue = getLabel(quizData.offerType, offerTypeLabels);
    if (offerTypeValue) {
      items.push({ icon: '🏷️', label: lang === 'en' ? 'Offer Type' : 'Loại ưu đãi', value: offerTypeValue });
    }
    
    if (quizData.usp && quizData.usp !== 'not_sure') {
      items.push({ icon: '⭐', label: lang === 'en' ? 'USP' : 'Điểm nổi bật', value: quizData.usp });
    }
    
    if (quizData.competitors && quizData.competitors !== 'not_sure') {
      items.push({ icon: '🏆', label: lang === 'en' ? 'Competitors' : 'Đối thủ', value: quizData.competitors });
    }
    
    return items;
  };

  // Sort campaigns: favorites first, then by date
  const sortedCampaigns = [...campaigns].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

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
            transition={{ duration: 0.2 }}
          >
            <div className="sidebar-header">
              <Link to="/" className="sidebar-logo">
                <Sparkles size={24} />
              </Link>
              <button className="sidebar-toggle" onClick={() => setSidebarOpen(false)}>
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
              <button className="sidebar-toggle-open" onClick={() => setSidebarOpen(true)}>
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
            {currentCampaign && getQuizSummaryItems().length > 0 && (
              <div className="quiz-info-bar">
                {getQuizSummaryItems().map((item, i) => (
                  <span key={i} className="quiz-info-item">
                    <span className="quiz-info-label">{item.label}:</span>
                    <span className="quiz-info-value">{item.value}</span>
                  </span>
                ))}
              </div>
            )}

            <div className="chat-header-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setClearModalOpen(true)} title={lang === 'en' ? 'Clear chat' : 'Xóa chat'}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="chat-messages">
          {initialLoading ? (
            <div className="chat-loading">
              <div className="spinner" />
            </div>
          ) : messages.length === 0 ? (
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
                    <h4>{lang === 'en' ? '📋 Your Campaign Profile' : '📋 Hồ Sơ Chiến Dịch'}</h4>
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
            </div>
          ) : (
            messages.map((msg, i) => (
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
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>

                  <div className="message-tools">
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
            <button className="chat-quiz-cta" onClick={handleOpenQuiz}>
              <ListChecks size={14} />
              <span>{lang === 'en' ? 'Do Quiz for Better Strategy' : 'Làm Quiz để ra chiến lược tốt hơn'}</span>
            </button>
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
