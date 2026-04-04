import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Sparkles, Trash2, Plus, MessageSquare, ChevronLeft, ChevronRight, 
  Settings, LogOut, MoreHorizontal, Pencil, Star, Copy, Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuthStore } from '../store/authStore';
import { api } from '../hooks/useApi';
import './Chat.css';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

interface Campaign {
  id: string;
  name: string;
  createdAt: string;
  isFavorite?: boolean;
  quizData?: Record<string, string>;
}

export default function Chat() {
  const { campaignId } = useParams();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  
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

  const lang = i18n.language as 'en' | 'vi';

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
    if (!isAuthenticated()) {
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
  }, [campaignId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (searchParams.get('autostart') === 'true' && messages.length === 0 && !loading && !initialLoading) {
      generateInitialStrategy();
    }
  }, [searchParams, initialLoading, messages.length]);

  const fetchCampaigns = async () => {
    const res = await api.getCampaigns();
    if (res.success && res.data) {
      setCampaigns(res.data as Campaign[]);
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
    const res = await api.getChatHistory(campaignId);
    if (res.success && res.data) {
      setMessages(res.data as Message[]);
    }
    setInitialLoading(false);
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
    
    if (res.success && res.data) {
      setMessages(prev => [...prev, res.data as Message]);
    } else {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ASSISTANT',
        content: lang === 'en' 
          ? 'Sorry, I encountered an error generating your strategy. Please try sending a message.'
          : 'Xin lỗi, đã xảy ra lỗi khi tạo chiến lược. Vui lòng thử gửi tin nhắn.',
        createdAt: new Date().toISOString()
      }]);
    }
    
    setLoading(false);
    navigate(`/chat/${campaignId}`, { replace: true });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'USER',
      content: input.trim(),
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const res = await api.sendMessage(input.trim(), campaignId);
    
    if (res.success && res.data) {
      setMessages(prev => [...prev, res.data as Message]);
    } else {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ASSISTANT',
        content: 'Sorry, I encountered an error. Please try again.',
        createdAt: new Date().toISOString()
      }]);
    }
    
    setLoading(false);
  };

  const handleClear = async () => {
    await api.clearChatHistory(campaignId);
    setMessages([]);
    setClearModalOpen(false);
  };

  const handleNewChat = () => {
    navigate('/quiz');
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
    if (!editingName.trim()) return;
    await api.updateCampaign(id, { name: editingName });
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, name: editingName } : c));
    setEditingCampaignId(null);
    setEditingName('');
  };

  const openDeleteModal = (id: string) => {
    setDeletingCampaignId(id);
    setDeleteModalOpen(true);
    setActiveCampaignMenu(null);
  };

  const handleDeleteCampaign = async () => {
    if (!deletingCampaignId) return;
    await api.deleteCampaign(deletingCampaignId);
    setCampaigns(prev => prev.filter(c => c.id !== deletingCampaignId));
    if (deletingCampaignId === campaignId) navigate('/chat');
    setDeleteModalOpen(false);
    setDeletingCampaignId(null);
  };

  const handleToggleFavorite = (id: string) => {
    setCampaigns(prev => prev.map(c => 
      c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
    ));
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
              {lang === 'en' ? 'New Campaign' : 'Chiến dịch mới'}
            </button>

            {/* All campaigns (favorites sorted to top) */}
            <div className="sidebar-section">
              <span className="section-label">{lang === 'en' ? 'Campaigns' : 'Chiến dịch'}</span>
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
        {/* Header - only sidebar toggle, no duplicate icons */}
        <header className="chat-header">
          {!sidebarOpen && (
            <button className="sidebar-toggle-open" onClick={() => setSidebarOpen(true)}>
              <ChevronRight size={18} />
            </button>
          )}
          
          {/* Quiz Summary Info Bar */}
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
          
          <div className="chat-header-spacer" />
          <div className="chat-header-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setClearModalOpen(true)} title={lang === 'en' ? 'Clear chat' : 'Xóa chat'}>
              <Trash2 size={18} />
            </button>
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
              
              <div className="welcome-suggestions">
                {[
                  lang === 'en' ? 'Create a social media strategy' : 'Tạo chiến lược mạng xã hội',
                  lang === 'en' ? 'Write ad copy for my product' : 'Viết nội dung quảng cáo cho sản phẩm',
                  lang === 'en' ? 'Analyze my target audience' : 'Phân tích đối tượng mục tiêu',
                  lang === 'en' ? 'Suggest marketing channels' : 'Đề xuất kênh marketing'
                ].map((suggestion, i) => (
                  <button 
                    key={i} 
                    className="suggestion-btn"
                    onClick={() => setInput(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                className={`message ${msg.role.toLowerCase()}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <div className="message-avatar">
                  {msg.role === 'USER' ? (user?.name?.charAt(0) || 'U') : <Sparkles size={16} />}
                </div>
                <div className="message-content">
                  {msg.role === 'ASSISTANT' ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
                <button 
                  className="message-copy-btn"
                  onClick={() => handleCopyMessage(msg.content, msg.id)}
                  title={lang === 'en' ? 'Copy' : 'Sao chép'}
                >
                  {copiedId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </motion.div>
            ))
          )}

          {loading && (
            <div className="message assistant">
              <div className="message-avatar"><Sparkles size={16} /></div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-input-wrapper">
          <div className="chat-input">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.placeholder')}
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
