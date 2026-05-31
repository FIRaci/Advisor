import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Quiz = lazy(() => import('./pages/Quiz'));
const Chat = lazy(() => import('./pages/Chat'));
const Settings = lazy(() => import('./pages/Settings'));
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import useAuthStore from './store/authStore';
import { api } from './hooks/useApi'; // Will verify this import below

function AppLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      color: 'var(--text-secondary)'
    }}>
      Loading...
    </div>
  );
}

function AppMeta() {
  const location = useLocation();

  useEffect(() => {
    document.documentElement.lang = 'en';
    document.documentElement.setAttribute('data-lang', 'en');
  }, []);

  useEffect(() => {
    const path = location.pathname;
    const titles: Record<string, string> = {
      '/': 'AdVisor - AI Marketing Platform',
      '/login': 'Login - AdVisor',
      '/register': 'Register - AdVisor',
      '/quiz': 'Quiz - AdVisor',
      '/chat': 'Chat - AdVisor',
      '/settings': 'Settings - AdVisor'
    };

    const descriptions: Record<string, string> = {
      '/': 'AI marketing platform for generating strategy, content, and campaign planning faster.',
      '/login': 'Sign in to your AdVisor account.',
      '/register': 'Create an AdVisor account and start your marketing workflow.',
      '/quiz': 'Answer the quiz to generate a personalized marketing strategy.',
      '/chat': 'Chat with the AI marketing advisor and refine your strategy.',
      '/settings': 'Manage your AdVisor account settings and preferences.'
    };

    const matchedPath = Object.prototype.hasOwnProperty.call(titles, path) ? path : '/';
    const nextTitle = titles[matchedPath];
    const nextDescription = descriptions[matchedPath];
    const canonicalUrl = new URL(matchedPath, window.location.origin).toString();

    document.title = nextTitle;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', nextDescription);
    }

    const canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonicalLink) {
      canonicalLink.href = canonicalUrl;
    }

    const setMeta = (selector: string, content: string) => {
      const meta = document.querySelector(selector);
      if (meta) {
        meta.setAttribute('content', content);
      }
    };

    setMeta('meta[property="og:title"]', nextTitle);
    setMeta('meta[property="og:description"]', nextDescription);
    setMeta('meta[property="og:url"]', canonicalUrl);
    setMeta('meta[name="twitter:title"]', nextTitle);
    setMeta('meta[name="twitter:description"]', nextDescription);
  }, [location.pathname]);

  return null;
}

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
  >
    {children}
  </motion.div>
);

function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      textAlign: 'center' as const,
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '0.5rem', background: 'linear-gradient(135deg, #a78bfa, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>404</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem' }}>Page not found</p>
      <a href="/" style={{ color: '#a78bfa', textDecoration: 'none', fontSize: '1rem' }}>← Back to Home</a>
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Landing /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/quiz" element={<PageWrapper><Quiz /></PageWrapper>} />
          <Route path="/chat" element={<PageWrapper><Chat /></PageWrapper>} />
          <Route path="/chat/:campaignId" element={<PageWrapper><Chat /></PageWrapper>} />
          <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
        </Route>
        <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}
import SmoothScroll from './components/SmoothScroll';
import { Toaster } from 'react-hot-toast';

function App() {
  const { setAuth, setInitializing } = useAuthStore();

  useEffect(() => {
    const storedTheme = localStorage.getItem('advisor-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', storedTheme);
    document.documentElement.classList.toggle('dark', storedTheme === 'dark');

    // Hydrate auth state
    api.me()
      .then((res) => {
        if (res.success && res.data) {
          setAuth(res.data);
        } else {
          setAuth(null);
        }
      })
      .catch(() => setAuth(null))
      .finally(() => setInitializing(false));
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <SmoothScroll>
          <Suspense fallback={<AppLoader />}>
            <AppMeta />
            <a className="skip-link" href="#main-content">Skip to main content</a>
            <main id="main-content">
              <AppRoutes />
            </main>
          </Suspense>
        </SmoothScroll>
        <Toaster position="bottom-right" />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
