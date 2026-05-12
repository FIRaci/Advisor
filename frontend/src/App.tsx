import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Quiz = lazy(() => import('./pages/Quiz'));
const Chat = lazy(() => import('./pages/Chat'));
const Settings = lazy(() => import('./pages/Settings'));

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

function App() {
  useEffect(() => {
    const storedTheme = localStorage.getItem('advisor-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', storedTheme);
    document.documentElement.classList.toggle('dark', storedTheme === 'dark');
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<AppLoader />}>
        <AppMeta />
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <main id="main-content">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:campaignId" element={<Chat />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
