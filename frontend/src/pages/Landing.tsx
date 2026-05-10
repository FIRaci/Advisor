import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, BarChart3, FileText, Globe, Zap, Shield, TrendingUp, Play, CheckCircle2, MessageSquare, LogOut, Settings, ListChecks, Target, Wand2, LineChart, GraduationCap, BookOpen, MessageCircle, ShoppingBag, Briefcase, Building2, Github } from 'lucide-react';
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


  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'vi' : 'en';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('advisor-lang', nextLang);
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

  const features = [
    { icon: Sparkles, title: t('features.ai.title'), desc: t('features.ai.desc'), color: '#7c3aed' },
    { icon: BarChart3, title: t('features.analytics.title'), desc: t('features.analytics.desc'), color: '#22c55e' },
    { icon: FileText, title: t('features.content.title'), desc: t('features.content.desc'), color: '#f59e0b' },
    { icon: Zap, title: t('features.fast.title'), desc: t('features.fast.desc'), color: '#3b82f6' },
    { icon: Shield, title: t('features.enterprise.title'), desc: t('features.enterprise.desc'), color: '#ef4444' },
    { icon: TrendingUp, title: t('features.roi.title'), desc: t('features.roi.desc'), color: '#ec4899' },
  ];

  const benefits = [
    i18n.language === 'en' ? 'Quick setup, no hassle' : 'Thiet lap nhanh, khong ruom ra',
    i18n.language === 'en' ? 'Built for academic demos' : 'Toi uu cho demo do an',
    i18n.language === 'en' ? 'Friendly guidance included' : 'Huong dan than thien, de hieu',
  ];

  // Step-by-step explanation that mirrors the in-app stage indicator. Keeps
  // the marketing copy honest about how the product actually works.
  const howItWorks: Array<{ icon: typeof ListChecks; en: { t: string; d: string }; vi: { t: string; d: string } }> = [
    {
      icon: ListChecks,
      en: { t: 'Quick Setup quiz', d: 'Answer a short quiz about your product, audience, goal, and budget.' },
      vi: { t: 'Quick Setup quiz', d: 'Tra loi bai quiz ngan ve san pham, doi tuong, muc tieu va ngan sach.' }
    },
    {
      icon: Target,
      en: { t: 'AI proposes 3 plans', d: 'The AI returns three tailored strategy options. You pick the one that fits.' },
      vi: { t: 'AI de xuat 3 plan', d: 'AI tra ve ba plan chien luoc. Ban chon plan phu hop nhat.' }
    },
    {
      icon: Wand2,
      en: { t: 'Refine and write', d: 'Phase 2 quiz tightens the plan. The Content Writer pane drafts emails, ads, social posts.' },
      vi: { t: 'Tinh chinh & viet noi dung', d: 'Phase 2 tinh chinh plan. Content Writer giup soan email, quang cao, bai dang MXH.' }
    },
    {
      icon: LineChart,
      en: { t: 'Track and optimise', d: 'Submit metrics snapshots; AdVisor compares them and suggests adjustments.' },
      vi: { t: 'Theo doi & toi uu', d: 'Nhap snapshot du lieu; AdVisor so sanh va de xuat dieu chinh.' }
    }
  ];

  const useCases: Array<{ icon: typeof ShoppingBag; en: { t: string; d: string }; vi: { t: string; d: string } }> = [
    {
      icon: ShoppingBag,
      en: { t: 'E-commerce launch', d: 'Plan a Shopee or Lazada drop with channel mix and ad copies ready to go.' },
      vi: { t: 'Ra mat E-commerce', d: 'Len ke hoach drop Shopee, Lazada voi mix kenh va ad copy san sang.' }
    },
    {
      icon: Briefcase,
      en: { t: 'Agency client onboarding', d: 'Use the activity log as a deliverable summary for client check-ins.' },
      vi: { t: 'Onboarding khach hang agency', d: 'Dung activity log lam bao cao tom tat moi lan hop khach.' }
    },
    {
      icon: Building2,
      en: { t: 'Internal SME marketing', d: 'A non-marketer can run quick experiments without hiring an agency.' },
      vi: { t: 'Marketing noi bo SME', d: 'Nguoi khong chuyen marketing co the chay thu nghiem nhanh ma khong can thue agency.' }
    },
    {
      icon: GraduationCap,
      en: { t: 'Marketing classroom', d: 'Built for students and instructors running case studies and live demos.' },
      vi: { t: 'Lop hoc marketing', d: 'Phu hop cho sinh vien va giang vien chay case study, demo truc tiep.' }
    }
  ];

  const faqs: Array<{ en: { q: string; a: string }; vi: { q: string; a: string } }> = [
    {
      en: { q: 'Is AdVisor free to use?', a: 'Yes. AdVisor is an academic prototype and free for personal and classroom use. No credit card, no usage caps.' },
      vi: { q: 'AdVisor co mien phi khong?', a: 'Co. AdVisor la prototype hoc thuat, mien phi cho ca nhan va lop hoc. Khong can the, khong gioi han.' }
    },
    {
      en: { q: 'Which AI model do you use?', a: 'AdVisor uses Google Gemini for strategy generation and content writing. The model name is configurable in the deployment.' },
      vi: { q: 'AdVisor dung mo hinh AI nao?', a: 'AdVisor dung Google Gemini de tao chien luoc va noi dung. Ten model co the cau hinh khi trien khai.' }
    },
    {
      en: { q: 'Where is my data stored?', a: 'Campaigns and chat history live in a Postgres database. You can export or delete a campaign at any time.' },
      vi: { q: 'Du lieu cua toi luu o dau?', a: 'Chien dich va lich su chat luu trong Postgres. Ban co the xuat hoac xoa chien dich bat ky luc nao.' }
    },
    {
      en: { q: 'Can I run this on my own server?', a: 'Yes. The repo is open source. Backend is Node + Prisma; frontend is Vite + React. See the README to self-host.' },
      vi: { q: 'Co the tu deploy duoc khong?', a: 'Co. Repo la open source. Backend Node + Prisma, frontend Vite + React. Xem README de self-host.' }
    }
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
            <span><span className="logo-highlight">Ad</span>Visor</span>
          </Link>

          <div className="nav-actions">
            {/* Language toggle - always left */}
            <motion.button 
              onClick={toggleLanguage} 
              className="btn-icon" 
              title="Toggle Language"
              aria-label={i18n.language === 'en' ? 'Switch to Vietnamese' : 'Chuyển sang tiếng Anh'}
              type="button"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Globe size={18} />
              <span>{i18n.language.toUpperCase()}</span>
            </motion.button>

            {isAuthenticated() ? (
              <>

                {/* Chatbot shortcut */}
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                  <Link to="/chat" className="btn-icon" title="Chatbot" aria-label={i18n.language === 'en' ? 'Open chat' : 'Mở chat'}>
                    <MessageSquare size={18} />
                  </Link>
                </motion.div>

                {/* User avatar with dropdown - right */}
                <div className="nav-user-menu" ref={userMenuRef}>
                  <button 
                    className="nav-avatar-btn"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    type="button"
                    aria-label={i18n.language === 'en' ? 'Open user menu' : 'Mở menu người dùng'}
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name || 'User'} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      user?.name?.charAt(0) || 'U'
                    )}
                  </button>
                  
                  {userMenuOpen && (
                    <motion.div 
                      className="nav-dropdown"
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="nav-dropdown-header">
                        <div className="nav-dropdown-avatar">
                          {user?.avatar ? (
                            <img src={user.avatar} alt={user.name || 'User'} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            user?.name?.charAt(0) || 'U'
                          )}
                        </div>
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
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                  <Link to="/login" className="btn btn-secondary">{t('nav.login')}</Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
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

      {/* How it works -- 4 steps mirroring the in-app stage indicator. */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <motion.div
            className="features-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-badge">{i18n.language === 'en' ? 'How it works' : 'Cach hoat dong'}</span>
            <h2>{i18n.language === 'en' ? 'Four stages, no surprises' : 'Bon giai doan, ro rang'}</h2>
            <p>
              {i18n.language === 'en'
                ? 'AdVisor walks every campaign through the same four stages so you always know what to do next.'
                : 'AdVisor dan moi chien dich qua 4 giai doan giong nhau de ban luon biet buoc tiep theo.'}
            </p>
          </motion.div>

          <div className="how-grid">
            {howItWorks.map((step, i) => {
              const Icon = step.icon;
              const copy = i18n.language === 'en' ? step.en : step.vi;
              return (
                <motion.div
                  key={i}
                  className="how-step"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="how-step-num">{i}</div>
                  <div className="how-step-icon"><Icon size={22} /></div>
                  <h3>{copy.t}</h3>
                  <p>{copy.d}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="use-cases">
        <div className="container">
          <motion.div
            className="features-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-badge">{i18n.language === 'en' ? 'Use cases' : 'Truong hop su dung'}</span>
            <h2>{i18n.language === 'en' ? 'Built for marketers, students, and small teams' : 'Cho marketer, sinh vien, va doi nho'}</h2>
          </motion.div>

          <div className="use-cases-grid">
            {useCases.map((uc, i) => {
              const Icon = uc.icon;
              const copy = i18n.language === 'en' ? uc.en : uc.vi;
              return (
                <motion.div
                  key={i}
                  className="use-case-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="use-case-icon"><Icon size={20} /></div>
                  <h3>{copy.t}</h3>
                  <p>{copy.d}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing -- single free tier. */}
      <section className="pricing" id="pricing">
        <div className="container">
          <motion.div
            className="features-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-badge">{i18n.language === 'en' ? 'Pricing' : 'Gia'}</span>
            <h2>{i18n.language === 'en' ? 'Free, forever' : 'Mien phi, mai mai'}</h2>
            <p>
              {i18n.language === 'en'
                ? 'AdVisor is an academic prototype. Use it for class, freelancing, or your own SME marketing without paying a dime.'
                : 'AdVisor la prototype hoc thuat. Dung cho lop hoc, freelance, hoac marketing SME ma khong mat phi.'}
            </p>
          </motion.div>

          <motion.div
            className="pricing-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="pricing-tier">{i18n.language === 'en' ? 'Free tier' : 'Goi mien phi'}</div>
            <div className="pricing-price">
              <span className="pricing-price-num">0₫</span>
              <span className="pricing-price-meta">{i18n.language === 'en' ? '/ forever' : '/ mai mai'}</span>
            </div>
            <ul className="pricing-list">
              <li><CheckCircle2 size={16} /> {i18n.language === 'en' ? 'Unlimited campaigns' : 'Khong gioi han so chien dich'}</li>
              <li><CheckCircle2 size={16} /> {i18n.language === 'en' ? 'Strategy + content generation' : 'Tao chien luoc + noi dung'}</li>
              <li><CheckCircle2 size={16} /> {i18n.language === 'en' ? 'Metrics tracking and trend analysis' : 'Theo doi metrics & phan tich xu huong'}</li>
              <li><CheckCircle2 size={16} /> {i18n.language === 'en' ? 'EN / VI bilingual interface' : 'Giao dien song ngu EN / VI'}</li>
              <li><CheckCircle2 size={16} /> {i18n.language === 'en' ? 'Self-host friendly (open source)' : 'Co the self-host (open source)'}</li>
            </ul>
            <button
              className="btn btn-primary btn-lg"
              type="button"
              onClick={() => navigate(isAuthenticated() ? '/quiz' : '/register')}
            >
              {i18n.language === 'en' ? 'Get started' : 'Bat dau'}
              <ArrowRight size={18} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq" id="faq">
        <div className="container">
          <motion.div
            className="features-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-badge">FAQ</span>
            <h2>{i18n.language === 'en' ? 'Frequently asked questions' : 'Cau hoi thuong gap'}</h2>
          </motion.div>

          <div className="faq-list">
            {faqs.map((qa, i) => {
              const copy = i18n.language === 'en' ? qa.en : qa.vi;
              return (
                <motion.details
                  key={i}
                  className="faq-item"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <summary>{copy.q}</summary>
                  <p>{copy.a}</p>
                </motion.details>
              );
            })}
          </div>
        </div>
      </section>

      {/* Academic note -- shows the project context honestly. */}
      <section className="academic-note">
        <div className="container">
          <div className="academic-card">
            <div className="academic-icon"><GraduationCap size={28} /></div>
            <div>
              <h3>{i18n.language === 'en' ? 'Academic project' : 'Du an hoc thuat'}</h3>
              <p>
                {i18n.language === 'en'
                  ? 'AdVisor is a graduation thesis on AI-assisted marketing tooling. The codebase is open and any feedback is welcome.'
                  : 'AdVisor la do an tot nghiep ve cong cu marketing co tro giup tu AI. Ma nguon mo, moi gop y deu duoc don nhan.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer -- expanded with quick links and contact. */}
      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-col footer-brand-col">
            <div className="footer-brand">
              <Sparkles size={20} />
              <span><span className="logo-highlight">Ad</span>Visor</span>
            </div>
            <p className="footer-tagline">
              {i18n.language === 'en'
                ? 'AI-assisted marketing tooling, free for everyone.'
                : 'Cong cu marketing co AI ho tro, mien phi cho moi nguoi.'}
            </p>
          </div>
          <div className="footer-col">
            <h4>{i18n.language === 'en' ? 'Product' : 'San pham'}</h4>
            <a href="#features">{i18n.language === 'en' ? 'Features' : 'Tinh nang'}</a>
            <a href="#how-it-works">{i18n.language === 'en' ? 'How it works' : 'Cach hoat dong'}</a>
            <a href="#pricing">{i18n.language === 'en' ? 'Pricing' : 'Gia'}</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="footer-col">
            <h4>{i18n.language === 'en' ? 'Resources' : 'Tai nguyen'}</h4>
            <a href="https://github.com/FIRaci/GR1" target="_blank" rel="noreferrer noopener">
              <Github size={14} /> GitHub
            </a>
            <a href="https://github.com/FIRaci/GR1/issues" target="_blank" rel="noreferrer noopener">
              <BookOpen size={14} /> {i18n.language === 'en' ? 'Issues & feedback' : 'Issues & gop y'}
            </a>
          </div>
          <div className="footer-col">
            <h4>{i18n.language === 'en' ? 'Contact' : 'Lien he'}</h4>
            <a href="mailto:thanh.bq235830@sis.hust.edu.vn">
              <MessageCircle size={14} /> thanh.bq235830@sis.hust.edu.vn
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>{i18n.language === 'en'
            ? 'AdVisor - Academic prototype'
            : 'AdVisor - Prototype hoc thuat'}</p>
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
