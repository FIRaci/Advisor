import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Sparkles, MessageSquare, Trash2, LogOut, Star, ExternalLink, Settings, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api } from '../hooks/useApi';
import './Dashboard.css';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  isFavorite?: boolean;
  _count: { chats: number };
}

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  const lang = i18n.language as 'en' | 'vi';
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchCampaigns();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCampaigns = async () => {
    const res = await api.getCampaigns();
    if (res.success && res.data) {
      setCampaigns(res.data as Campaign[]);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await api.deleteCampaign(id);
    setCampaigns(campaigns.filter(c => c.id !== id));
    setDeleteModalOpen(null);
  };

  const handleToggleFavorite = (id: string) => {
    setCampaigns(prev => prev.map(c => 
      c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
    ));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/" className="logo">
            <Sparkles size={20} />
            <span>AdVisor</span>
          </Link>
        </div>

        <button className="new-campaign-btn" onClick={() => navigate('/quiz')}>
          <Plus size={18} />
          <span>{t('dashboard.newCampaign')}</span>
        </button>

        {/* Sidebar Footer - Only User Name */}
        <div className="sidebar-footer">
          <div className="user-menu-container" ref={userMenuRef}>
            <button 
              className="user-profile-btn"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="user-avatar">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className="user-name">{user?.name || 'User'}</span>
              <ChevronRight size={16} className={`chevron ${userMenuOpen ? 'open' : ''}`} />
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
                    <div className="user-dropdown-avatar">{user?.name?.charAt(0) || 'U'}</div>
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
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="main-header">
          <h1>{t('dashboard.welcome')}, {user?.name?.split(' ')[0]}!</h1>
        </div>

        <section className="campaigns-section">
          <h2>{t('dashboard.campaigns')}</h2>

          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <MessageSquare size={48} />
              </div>
              <h3>{t('dashboard.noCampaigns')}</h3>
              <p>{t('dashboard.startFirst')}</p>
              <button className="btn-primary" onClick={() => navigate('/quiz')}>
                <Plus size={18} />
                {t('dashboard.newCampaign')}
              </button>
            </div>
          ) : (
            <div className="campaigns-grid">
              {campaigns.map((campaign, i) => (
                <motion.div 
                  key={campaign.id}
                  className={`campaign-card ${campaign.isFavorite ? 'favorite' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {/* Card Header */}
                  <div className="card-header">
                    <h3 className="card-title">{campaign.name}</h3>
                    <div className="card-badges">
                      <button 
                        className={`favorite-btn ${campaign.isFavorite ? 'active' : ''}`}
                        onClick={() => handleToggleFavorite(campaign.id)}
                        title={campaign.isFavorite ? (lang === 'en' ? 'Remove from favorites' : 'Bỏ yêu thích') : (lang === 'en' ? 'Add to favorites' : 'Thêm yêu thích')}
                      >
                        <Star size={16} fill={campaign.isFavorite ? 'currentColor' : 'none'} />
                      </button>
                      <span className={`status-badge ${campaign.status.toLowerCase()}`}>
                        {lang === 'en' ? campaign.status : (campaign.status === 'DRAFT' ? 'Nháp' : campaign.status === 'ACTIVE' ? 'Hoạt động' : campaign.status)}
                      </span>
                    </div>
                  </div>

                  {/* Card Meta */}
                  <div className="card-meta">
                    <span className="meta-item">
                      <MessageSquare size={14} />
                      {campaign._count.chats} {lang === 'en' ? 'messages' : 'tin nhắn'}
                    </span>
                    <span className="meta-item">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Card Actions - Always Visible */}
                  <div className="card-actions">
                    <button 
                      className="action-btn primary"
                      onClick={() => navigate(`/chat/${campaign.id}`)}
                    >
                      <ExternalLink size={16} />
                      <span>{lang === 'en' ? 'Open Chat' : 'Mở Chat'}</span>
                    </button>
                    <button 
                      className="action-btn danger"
                      onClick={() => setDeleteModalOpen(campaign.id)}
                      title={lang === 'en' ? 'Delete' : 'Xóa'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteModalOpen(null)}
          >
            <motion.div 
              className="modal-box"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-icon danger">
                <Trash2 size={32} />
              </div>
              <h3>{lang === 'en' ? 'Delete Campaign?' : 'Xóa chiến dịch?'}</h3>
              <p>{lang === 'en' 
                ? 'This action cannot be undone. All messages and data will be permanently deleted.' 
                : 'Hành động này không thể hoàn tác. Tất cả tin nhắn và dữ liệu sẽ bị xóa vĩnh viễn.'}</p>
              <div className="modal-buttons">
                <button className="modal-btn secondary" onClick={() => setDeleteModalOpen(null)}>
                  {lang === 'en' ? 'Cancel' : 'Hủy'}
                </button>
                <button className="modal-btn danger" onClick={() => handleDelete(deleteModalOpen)}>
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
