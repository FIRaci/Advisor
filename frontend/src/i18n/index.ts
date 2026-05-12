import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: {
        home: 'Home',
        features: 'Features',
        login: 'Login',
        signup: 'Sign Up',
        logout: 'Logout'
      },
      hero: {
        badge: 'AI-Powered Marketing',
        title: 'Create Winning',
        titleHighlight: 'Marketing Campaigns',
        titleEnd: 'in Minutes',
        subtitle: 'AdVisor uses AI to analyze your business and generate personalized marketing strategies that drive results.',
        cta: 'Get Started Free',
        ctaSecondary: 'See How It Works'
      },
      features: {
        title: 'Everything You Need',
        subtitle: 'Powerful tools to supercharge your marketing',
        ai: {
          title: 'AI Strategy',
          desc: 'Get personalized marketing recommendations powered by advanced AI'
        },
        analytics: {
          title: 'Smart Analytics',
          desc: 'Track performance and optimize campaigns with real-time insights'
        },
        content: {
          title: 'Content Creation',
          desc: 'Generate compelling ad copy and content suggestions instantly'
        },
        fast: {
          title: 'Lightning Fast',
          desc: 'Generate complete campaigns in under 30 seconds'
        },
        enterprise: {
          title: 'Enterprise Ready',
          desc: 'SOC2 compliant with advanced security features'
        },
        roi: {
          title: 'ROI Focused',
          desc: 'AI optimized for maximum return on ad spend'
        }
      },
      auth: {
        loginTitle: 'Welcome Back',
        loginSubtitle: 'Sign in to your account',
        registerTitle: 'Create Account',
        registerSubtitle: 'Start your marketing journey',
        email: 'Email',
        password: 'Password',
        name: 'Full Name',
        login: 'Sign In',
        register: 'Create Account',
        noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?',
        forgotPassword: 'Forgot password?'
      },
      quiz: {
        title: 'Tell Us About Your Business',
        subtitle: 'Answer a few questions to get personalized recommendations',
        next: 'Next',
        back: 'Back',
        submit: 'Get Recommendations'
      },
      chat: {
        title: 'Marketing Advisor',
        placeholder: 'Ask me anything about marketing...',
        send: 'Send'
      },
      settings: {
        title: 'Settings',
        profile: 'Profile',
        security: 'Security',
        preferences: 'Preferences',
        profileInfo: 'Profile Information',
        changePassword: 'Change Password',
        appPreferences: 'App Preferences',
        fullName: 'Full Name',
        email: 'Email',
        currentPassword: 'Current Password',
        newPassword: 'New Password',
        confirmPassword: 'Confirm New Password',
        saveChanges: 'Save Changes',
        saving: 'Saving...',
        language: 'Language',
        theme: 'Theme',
        dark: 'Dark',
        light: 'Light'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
