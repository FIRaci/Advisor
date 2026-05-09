import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Quiz = lazy(() => import('./pages/Quiz'))
const Chat = lazy(() => import('./pages/Chat'))
const Settings = lazy(() => import('./pages/Settings'))

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
  )
}

function AppMeta() {
  const location = useLocation()
  const { i18n } = useTranslation()

  useEffect(() => {
    const lang = i18n.language === 'vi' ? 'vi' : 'en'
    document.documentElement.lang = lang
    document.documentElement.setAttribute('data-lang', lang)
  }, [i18n.language])

  useEffect(() => {
    const path = location.pathname
    const isVi = i18n.language === 'vi'

    const titles: Record<string, { en: string; vi: string }> = {
      '/': { en: 'AdVisor - AI Marketing Platform', vi: 'AdVisor - Nền tảng AI Marketing' },
      '/login': { en: 'Login - AdVisor', vi: 'Đăng nhập - AdVisor' },
      '/register': { en: 'Register - AdVisor', vi: 'Đăng ký - AdVisor' },
      '/quiz': { en: 'Quiz - AdVisor', vi: 'Bảng câu hỏi - AdVisor' },
      '/chat': { en: 'Chat - AdVisor', vi: 'Trò chuyện - AdVisor' },
      '/settings': { en: 'Settings - AdVisor', vi: 'Cài đặt - AdVisor' }
    }

    const descriptions: Record<string, { en: string; vi: string }> = {
      '/': {
        en: 'AI marketing platform for generating strategy, content, and campaign planning faster.',
        vi: 'Nền tảng AI marketing để tạo chiến lược, nội dung và kế hoạch chiến dịch nhanh hơn.'
      },
      '/login': {
        en: 'Sign in to your AdVisor account.',
        vi: 'Đăng nhập vào tài khoản AdVisor của bạn.'
      },
      '/register': {
        en: 'Create an AdVisor account and start your marketing workflow.',
        vi: 'Tạo tài khoản AdVisor và bắt đầu quy trình marketing của bạn.'
      },
      '/quiz': {
        en: 'Answer the quiz to generate a personalized marketing strategy.',
        vi: 'Trả lời bảng câu hỏi để tạo chiến lược marketing cá nhân hóa.'
      },
      '/chat': {
        en: 'Chat with the AI marketing advisor and refine your strategy.',
        vi: 'Trò chuyện với cố vấn marketing AI và tinh chỉnh chiến lược.'
      },
      '/settings': {
        en: 'Manage your AdVisor account settings and preferences.',
        vi: 'Quản lý cài đặt và tùy chọn tài khoản AdVisor.'
      }
    }

    const matchedPath = Object.prototype.hasOwnProperty.call(titles, path) ? path : '/'
    const nextTitle = titles[matchedPath][isVi ? 'vi' : 'en']
    const nextDescription = descriptions[matchedPath][isVi ? 'vi' : 'en']
    const canonicalUrl = new URL(matchedPath, window.location.origin).toString()

    document.title = nextTitle

    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', nextDescription)
    }

    const canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (canonicalLink) {
      canonicalLink.href = canonicalUrl
    }

    const setMeta = (selector: string, content: string) => {
      const meta = document.querySelector(selector)
      if (meta) {
        meta.setAttribute('content', content)
      }
    }

    setMeta('meta[property="og:title"]', nextTitle)
    setMeta('meta[property="og:description"]', nextDescription)
    setMeta('meta[property="og:url"]', canonicalUrl)
    setMeta('meta[name="twitter:title"]', nextTitle)
    setMeta('meta[name="twitter:description"]', nextDescription)
  }, [location.pathname, i18n.language])

  return null
}

function App() {
  useEffect(() => {
    const storedTheme = localStorage.getItem('advisor-theme') || 'dark'
    document.documentElement.setAttribute('data-theme', storedTheme)
    document.documentElement.classList.toggle('dark', storedTheme === 'dark')
  }, [])

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
  )
}

export default App
