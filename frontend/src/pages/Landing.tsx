import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, BarChart3, FileText, Zap, Shield, TrendingUp, Play, CheckCircle2, MessageSquare, LogOut, Settings, ListChecks, Target, Wand2, LineChart, GraduationCap, BookOpen, MessageCircle, ShoppingBag, Briefcase, Building2, Github, ArrowUp, ArrowDown } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useState, useRef, useEffect } from 'react';
import SplitText from '../components/SplitText';
import './Landing.css';

export default function Landing() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 300]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -250]);
  const y3 = useTransform(scrollY, [0, 1000], [0, 150]);
  
  // Advanced Scroll Tracking for the Hero section
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.85]);
  const heroY = useTransform(scrollY, [0, 400], [0, 100]);

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(true);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
      setShowScrollDown(window.scrollY < document.body.scrollHeight - window.innerHeight - 300);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    const appLenis = (window as any).appLenis;
    if (appLenis) {
      appLenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const scrollToBottom = () => {
    const appLenis = (window as any).appLenis;
    if (appLenis) {
      appLenis.scrollTo(document.body.scrollHeight, { duration: 1.2 });
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
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
    'Quick setup, no hassle',
    'Built for academic demos',
    'Friendly guidance included'
  ];

  // Step-by-step explanation that mirrors the in-app stage indicator. Keeps
  // the marketing copy honest about how the product actually works.
  const howItWorks: Array<{ icon: typeof ListChecks; title: string; desc: string }> = [
    {
      icon: ListChecks,
      title: 'Discovery quiz',
      desc: 'Answer the full questionnaire about your product, audience, goal, and budget.'
    },
    {
      icon: Target,
      title: 'AI proposes 3 plans',
      desc: 'The AI returns three tailored strategy options. You pick the one that fits.'
    },
    {
      icon: Wand2,
      title: 'Refine and write',
      desc: 'Phase 2 quiz tightens the plan. The Content Writer pane drafts emails, ads, and social posts.'
    },
    {
      icon: LineChart,
      title: 'Track and optimize',
      desc: 'Submit metrics snapshots; AdVisor compares them and suggests adjustments.'
    }
  ];

  const useCases: Array<{ icon: typeof ShoppingBag; title: string; desc: string }> = [
    {
      icon: ShoppingBag,
      title: 'E-commerce launch',
      desc: 'Plan a Shopee or Lazada drop with channel mix and ad copies ready to go.'
    },
    {
      icon: Briefcase,
      title: 'Agency client onboarding',
      desc: 'Use the activity log as a deliverable summary for client check-ins.'
    },
    {
      icon: Building2,
      title: 'Internal SME marketing',
      desc: 'A non-marketer can run quick experiments without hiring an agency.'
    },
    {
      icon: GraduationCap,
      title: 'Marketing classroom',
      desc: 'Built for students and instructors running case studies and live demos.'
    }
  ];

  const faqs: Array<{ q: string; a: string }> = [
    {
      q: 'Is AdVisor free to use?',
      a: 'Yes. AdVisor is an academic prototype and free for personal and classroom use. No credit card, no usage caps.'
    },
    {
      q: 'Which AI model do you use?',
      a: 'AdVisor uses Google Gemini for strategy generation and content writing. The model name is configurable in the deployment.'
    },
    {
      q: 'Where is my data stored?',
      a: 'Campaigns and chat history live in a Postgres database. You can export or delete a campaign at any time.'
    },
    {
      q: 'Can I run this on my own server?',
      a: 'Yes. The repo is open source. Backend is Node + Prisma; frontend is Vite + React. See the README to self-host.'
    }
  ];

  return (
    <div className="landing">
      {/* Animated Background */}
      <div className="animated-bg">
        <motion.div className="gradient-orb orb-1" style={{ y: y1 }} />
        <motion.div className="gradient-orb orb-2" style={{ y: y2 }} />
        <motion.div className="gradient-orb orb-3" style={{ y: y3 }} />
      </div>

      {/* Navigation */}
      <motion.nav 
        className="nav glass-panel"
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
            {isAuthenticated() ? (
              <>
                {/* Chatbot shortcut */}
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                  <Link to="/chat" className="btn-icon" title="Chatbot" aria-label="Open chat">
                    <MessageSquare size={18} />
                  </Link>
                </motion.div>

                {/* User avatar with dropdown - right */}
                <div className="nav-user-menu" ref={userMenuRef}>
                  <button
                    className="nav-avatar-btn"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    type="button"
                    aria-label="Open user menu"
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
                        Settings
                      </button>
                      <div className="nav-dropdown-divider" />
                      <button className="nav-dropdown-item logout" onClick={logout}>
                        <LogOut size={16} />
                        Logout
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
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.span 
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.8, delay: 0.2 }}
          >
            <Sparkles size={14} className="badge-icon" />
            {t('hero.badge')}
            <span className="badge-new">NEW</span>
          </motion.span>

          <h1 className="hero-title">
            <SplitText text={t('hero.title')} delay={0.1} />
            <br />
            <SplitText 
              text={t('hero.titleHighlight')} 
              delay={0.2} 
              wordClassName="gradient-text" 
            />
            <br />
            <SplitText text={t('hero.titleEnd')} delay={0.3} />
          </h1>

          <motion.p 
            className="hero-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.8, delay: 0.4 }}
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.div 
            className="hero-cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.8, delay: 0.5 }}
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
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.8, delay: 0.6 }}
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
            viewport={{ once: true, margin: "-50px" }}
          >
            <span className="section-badge">Features</span>
            <h2>{t('features.title')}</h2>
            <p>{t('features.subtitle')}</p>
          </motion.div>

          <div className="features-grid">
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                className="feature-card glass-panel"
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.8, delay: i * 0.1 }}
                whileHover={{ y: -8, scale: 1.02, borderColor: feature.color, boxShadow: `0 10px 30px -10px ${feature.color}` }}
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
            viewport={{ once: true, margin: "-50px" }}
          >
            <span className="section-badge">How it works</span>
            <h2>Four stages, no surprises</h2>
            <p>AdVisor walks every campaign through the same four stages so you always know what to do next.</p>
          </motion.div>

          <div className="how-grid">
            {howItWorks.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  className="how-step glass-panel"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.8, delay: i * 0.15 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="how-step-num">{i}</div>
                  <div className="how-step-icon"><Icon size={22} /></div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
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
            viewport={{ once: true, margin: "-50px" }}
          >
            <span className="section-badge">Use cases</span>
            <h2>Built for marketers, students, and small teams</h2>
          </motion.div>

          <div className="use-cases-grid">
            {useCases.map((uc, i) => {
              const Icon = uc.icon;
              return (
                <motion.div
                  key={i}
                  className="use-case-card glass-panel"
                  initial={{ opacity: 0, y: 30, rotateX: 15 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.8, delay: i * 0.1 }}
                  whileHover={{ y: -8, scale: 1.03, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                >
                  <div className="use-case-icon"><Icon size={20} /></div>
                  <h3>{uc.title}</h3>
                  <p>{uc.desc}</p>
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
            viewport={{ once: true, margin: "-50px" }}
          >
            <span className="section-badge">Pricing</span>
            <h2>Free, forever</h2>
            <p>AdVisor is an academic prototype. Use it for class, freelancing, or your own SME marketing without paying a dime.</p>
          </motion.div>

          <motion.div
            className="pricing-card glass-panel"
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            whileHover={{ boxShadow: '0 0 50px rgba(168, 85, 247, 0.2)' }}
          >
            <div className="pricing-tier">Free tier</div>
            <div className="pricing-price">
              <span className="pricing-price-num">$0</span>
              <span className="pricing-price-meta">/ forever</span>
            </div>
            <ul className="pricing-list">
              <li><CheckCircle2 size={16} /> Unlimited campaigns</li>
              <li><CheckCircle2 size={16} /> Strategy and content generation</li>
              <li><CheckCircle2 size={16} /> Metrics tracking and trend analysis</li>
              <li><CheckCircle2 size={16} /> English-only interface</li>
              <li><CheckCircle2 size={16} /> Self-host friendly (open source)</li>
            </ul>
            <button
              className="btn btn-primary btn-lg"
              type="button"
              onClick={() => navigate(isAuthenticated() ? '/quiz' : '/register')}
            >
              Get started
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
            viewport={{ once: true, margin: "-50px" }}
          >
            <span className="section-badge">FAQ</span>
            <h2>Frequently asked questions</h2>
          </motion.div>

          <div className="faq-list">
            {faqs.map((qa, i) => {
              return (
                <motion.details
                  key={i}
                  className="faq-item"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.8, delay: i * 0.05 }}
                >
                  <summary>{qa.q}</summary>
                  <p>{qa.a}</p>
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
              <h3>Academic project</h3>
              <p>AdVisor is a graduation thesis on AI-assisted marketing tooling. The codebase is open and any feedback is welcome.</p>
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
              AI-assisted marketing tooling, free for everyone.
            </p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <a href="https://github.com/FIRaci/GR1" target="_blank" rel="noreferrer noopener">
              <Github size={14} /> GitHub
            </a>
            <a href="https://github.com/FIRaci/GR1/issues" target="_blank" rel="noreferrer noopener">
              <BookOpen size={14} /> Issues and feedback
            </a>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <a href="mailto:thanh.bq235830@sis.hust.edu.vn">
              <MessageCircle size={14} /> thanh.bq235830@sis.hust.edu.vn
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>AdVisor - Academic prototype</p>
          <p style={{ marginTop: '0.5rem', opacity: 0.8 }}>Made by FIRaci</p>
        </div>
      </footer>

      {/* Landing Scroll Buttons */}
      <AnimatePresence>
        {(showBackToTop || showScrollDown) && (
          <div className="landing-scroll-btns">
            <AnimatePresence>
              {showBackToTop && (
                <motion.button
                  key="back-to-top"
                  className="landing-scroll-btn"
                  onClick={scrollToTop}
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Back to top"
                >
                  <ArrowUp size={20} />
                </motion.button>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {showScrollDown && (
                <motion.button
                  key="scroll-down"
                  className="landing-scroll-btn"
                  onClick={scrollToBottom}
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Scroll to bottom"
                >
                  <ArrowDown size={20} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>

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
