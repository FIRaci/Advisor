import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, Sparkles, BarChart3, FileText, Globe, Zap, Shield, TrendingUp, Play, CheckCircle2, LayoutDashboard, LogOut, Settings, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useState, useRef, useEffect } from 'react';
import './Landing.css';

export default function Landing() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'vi' : 'en');
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const stats = [
    { value: '10K+', label: 'Active Users' },
    { value: '50M+', label: 'Ads Generated' },
    { value: '98%', label: 'Satisfaction' },
  ];

  const features = [
    { icon: Sparkles, title: t('features.ai.title'), desc: t('features.ai.desc'), color: '#7c3aed' },
    { icon: BarChart3, title: t('features.analytics.title'), desc: t('features.analytics.desc'), color: '#22c55e' },
    { icon: FileText, title: t('features.content.title'), desc: t('features.content.desc'), color: '#f59e0b' },
    { icon: Zap, title: t('features.fast.title'), desc: t('features.fast.desc'), color: '#3b82f6' },
    { icon: Shield, title: t('features.enterprise.title'), desc: t('features.enterprise.desc'), color: '#ef4444' },
    { icon: TrendingUp, title: t('features.roi.title'), desc: t('features.roi.desc'), color: '#ec4899' },
  ];

  const benefits = [
    i18n.language === 'en' ? 'No credit card required' : 'Không cần thẻ tín dụng',
    i18n.language === 'en' ? '14-day free trial' : 'Dùng thử 14 ngày',
    i18n.language === 'en' ? 'Cancel anytime' : 'Hủy bất cứ lúc nào',
  ];

  return (
    <div className="landing">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-orb orb-1" />
        <div className="gradient-orb orb-2" />
        <div className="gradient-orb orb-3" />
      </div>

      {/* Navigation */}
      <motion.nav 
        className="nav"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="nav-container">
          <Link to="/" className="logo">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles size={24} />
            </motion.div>
            <span>AdVisor</span>
          </Link>

          <div className="nav-actions">
            {/* Language toggle - always left */}
            <motion.button 
              onClick={toggleLanguage} 
              className="btn-icon" 
              title="Toggle Language"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Globe size={18} />
              <span>{i18n.language.toUpperCase()}</span>
            </motion.button>

            {isAuthenticated() ? (
              <>
                {/* Dashboard - middle */}
                <Link to="/dashboard" className="btn-icon" title="Dashboard">
                  <LayoutDashboard size={18} />
                </Link>
                
                {/* User avatar with dropdown - right */}
                <div className="nav-user-menu" ref={userMenuRef}>
                  <button 
                    className="nav-avatar-btn"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    {user?.name?.charAt(0) || 'U'}
                  </button>
                  
                  {userMenuOpen && (
                    <motion.div 
                      className="nav-dropdown"
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="nav-dropdown-header">
                        <div className="nav-dropdown-avatar">{user?.name?.charAt(0) || 'U'}</div>
                        <div className="nav-dropdown-info">
                          <span className="nav-dropdown-name">{user?.name}</span>
                          <span className="nav-dropdown-email">{user?.email}</span>
                        </div>
                      </div>
                      <div className="nav-dropdown-divider" />
                      <button className="nav-dropdown-item" onClick={() => navigate('/settings')}>
                        <Settings size={16} />
                        {i18n.language === 'en' ? 'Settings' : 'Cài đặt'}
                      </button>
                      <button className="nav-dropdown-item" onClick={() => navigate('/profile')}>
                        <User size={16} />
                        {i18n.language === 'en' ? 'Edit Profile' : 'Chỉnh sửa tài khoản'}
                      </button>
                      <div className="nav-dropdown-divider" />
                      <button className="nav-dropdown-item logout" onClick={logout}>
                        <LogOut size={16} />
                        {i18n.language === 'en' ? 'Logout' : 'Đăng xuất'}
                      </button>
                    </motion.div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">{t('nav.login')}</Link>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/register" className="btn btn-primary">{t('nav.signup')}</Link>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="hero">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.span 
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles size={14} className="badge-icon" />
            {t('hero.badge')}
            <span className="badge-new">NEW</span>
          </motion.span>

          <motion.h1 
            className="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {t('hero.title')}<br />
            <span className="gradient-text">{t('hero.titleHighlight')}</span><br />
            {t('hero.titleEnd')}
          </motion.h1>

          <motion.p 
            className="hero-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.div 
            className="hero-cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button 
              className="btn btn-primary btn-lg btn-glow"
              onClick={() => navigate(isAuthenticated() ? '/quiz' : '/register')}
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(124, 58, 237, 0.5)' }}
              whileTap={{ scale: 0.95 }}
            >
              {t('hero.cta')}
              <ArrowRight size={18} />
            </motion.button>
            <motion.button 
              className="btn btn-secondary btn-lg"
              onClick={() => setIsVideoOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play size={18} />
              {t('hero.ctaSecondary')}
            </motion.button>
          </motion.div>

          <motion.div 
            className="hero-benefits"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {benefits.map((benefit, i) => (
              <span key={i} className="benefit-item">
                <CheckCircle2 size={14} />
                {benefit}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="hero-stats"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {stats.map((stat, i) => (
            <motion.div 
              key={i} 
              className="stat-item"
              whileHover={{ scale: 1.1, y: -5 }}
            >
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div 
          className="scroll-indicator"
          style={{ opacity }}
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="scroll-mouse">
            <div className="scroll-wheel" />
          </div>
          <span>Scroll to explore</span>
        </motion.div>

        <div className="hero-glow" />
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="container">
          <motion.div 
            className="features-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-badge">Features</span>
            <h2>{t('features.title')}</h2>
            <p>{t('features.subtitle')}</p>
          </motion.div>

          <div className="features-grid">
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, borderColor: feature.color }}
              >
                <motion.div 
                  className="feature-icon"
                  style={{ background: `${feature.color}20`, color: feature.color }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <feature.icon size={24} />
                </motion.div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Sparkles size={20} />
            <span>AdVisor</span>
          </div>
          <p>© 2026 AdVisor. All rights reserved.</p>
        </div>
      </footer>

      {/* Video Modal */}
      {isVideoOpen && (
        <motion.div 
          className="video-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsVideoOpen(false)}
        >
          <motion.div 
            className="video-content"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="video-placeholder">
              <Play size={64} />
              <p>Demo Video Coming Soon</p>
            </div>
            <button className="video-close" onClick={() => setIsVideoOpen(false)}>×</button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
