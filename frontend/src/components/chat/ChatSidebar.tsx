import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronLeft, Plus, ArrowUp, Settings, Briefcase, Plug, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import CampaignItem from './CampaignItem';

interface Campaign {
  id: string;
  name: string;
  createdAt: string;
  isFavorite: boolean;
  status?: string;
  updatedAt?: string;
  quizData?: Record<string, string>;
}

interface ChatSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
  sidebarPanelWidth: number;
  handleNewChat: () => void;
  sidebarScrollRef: React.RefObject<HTMLDivElement | null>;
  handleScrollToTopVisible: (e: React.UIEvent<HTMLDivElement>, setter: React.Dispatch<React.SetStateAction<boolean>>) => void;
  setShowSidebarBackToTop: React.Dispatch<React.SetStateAction<boolean>>;
  showSidebarBackToTop: boolean;
  sortedCampaigns: Campaign[];
  campaignId: string | undefined;
  editingCampaignId: string | null;
  editingName: string;
  activeCampaignMenu: string | null;
  navigate: (path: string) => void;
  setActiveCampaignMenu: (id: string | null) => void;
  setEditingCampaignId: (id: string | null) => void;
  setEditingName: (name: string) => void;
  handleRenameCampaign: (id: string) => void;
  openDeleteModal: (id: string) => void;
  handleToggleFavorite: (id: string) => void;
  scrollToTop: (ref: React.RefObject<HTMLDivElement | null>) => void;
  userMenuRef: React.RefObject<HTMLDivElement | null>;
  userMenuOpen: boolean;
  setUserMenuOpen: (val: boolean) => void;
  user: any;
  setBrandProfileModalOpen: (val: boolean) => void;
  setIntegrationsModalOpen: (val: boolean) => void;
  handleLogout: () => void;
}

export default function ChatSidebar({
  sidebarOpen, setSidebarOpen, sidebarPanelWidth, handleNewChat, sidebarScrollRef,
  handleScrollToTopVisible, setShowSidebarBackToTop, showSidebarBackToTop,
  sortedCampaigns, campaignId, editingCampaignId, editingName, activeCampaignMenu,
  navigate, setActiveCampaignMenu, setEditingCampaignId, setEditingName,
  handleRenameCampaign, openDeleteModal, handleToggleFavorite, scrollToTop,
  userMenuRef, userMenuOpen, setUserMenuOpen, user,
  setBrandProfileModalOpen, setIntegrationsModalOpen, handleLogout
}: ChatSidebarProps) {
  return (
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

        <div 
          className="sidebar-section" 
          data-lenis-prevent="true"
          ref={sidebarScrollRef}
          onScroll={(e) => handleScrollToTopVisible(e, setShowSidebarBackToTop)}
        >
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

        <AnimatePresence>
          {showSidebarBackToTop && (
            <motion.button
              className="btn-back-to-top"
              initial={{ opacity: 0, y: 10, scale: 0.9, x: "-50%" }}
              animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
              exit={{ opacity: 0, y: 10, scale: 0.9, x: "-50%" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollToTop(sidebarScrollRef)}
              aria-label="Back to top"
            >
              <ArrowUp size={20} />
            </motion.button>
          )}
        </AnimatePresence>

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
                  <button type="button" className="user-dropdown-item" onClick={() => { setUserMenuOpen(false); setBrandProfileModalOpen(true); }}>
                    <Briefcase size={16} />
                    {'Brand Profile'}
                  </button>
                  <button type="button" className="user-dropdown-item" onClick={() => { setUserMenuOpen(false); setIntegrationsModalOpen(true); }}>
                    <Plug size={16} />
                    {'Integrations'}
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
  );
}
