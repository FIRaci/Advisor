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
  },
  vi: {
    translation: {
      nav: {
        home: 'Trang Chủ',
        features: 'Tính Năng',
        login: 'Đăng Nhập',
        signup: 'Đăng Ký',
        logout: 'Đăng Xuất'
      },
      hero: {
        badge: 'Marketing AI',
        title: 'Tạo Chiến Dịch',
        titleHighlight: 'Marketing Thành Công',
        titleEnd: 'Trong Vài Phút',
        subtitle: 'AdVisor sử dụng AI để phân tích doanh nghiệp và tạo chiến lược marketing cá nhân hóa mang lại kết quả.',
        cta: 'Bắt Đầu Miễn Phí',
        ctaSecondary: 'Xem Cách Hoạt Động'
      },
      features: {
        title: 'Mọi Thứ Bạn Cần',
        subtitle: 'Công cụ mạnh mẽ để tăng hiệu quả marketing',
        ai: {
          title: 'Chiến Lược AI',
          desc: 'Nhận đề xuất marketing cá nhân hóa từ AI tiên tiến'
        },
        analytics: {
          title: 'Phân Tích Thông Minh',
          desc: 'Theo dõi hiệu suất và tối ưu hóa chiến dịch với thông tin thời gian thực'
        },
        content: {
          title: 'Tạo Nội Dung',
          desc: 'Tạo nội dung quảng cáo hấp dẫn và gợi ý ngay lập tức'
        },
        fast: {
          title: 'Siêu Nhanh',
          desc: 'Tạo chiến dịch hoàn chỉnh trong chưa đầy 30 giây'
        },
        enterprise: {
          title: 'Doanh Nghiệp',
          desc: 'Tuân thủ SOC2 với các tính năng bảo mật nâng cao'
        },
        roi: {
          title: 'Tập Trung ROI',
          desc: 'AI được tối ưu hóa để tối đa hóa lợi nhuận quảng cáo'
        }
      },
      auth: {
        loginTitle: 'Chào Mừng Trở Lại',
        loginSubtitle: 'Đăng nhập vào tài khoản của bạn',
        registerTitle: 'Tạo Tài Khoản',
        registerSubtitle: 'Bắt đầu hành trình marketing của bạn',
        email: 'Email',
        password: 'Mật Khẩu',
        name: 'Họ và Tên',
        login: 'Đăng Nhập',
        register: 'Tạo Tài Khoản',
        noAccount: 'Chưa có tài khoản?',
        hasAccount: 'Đã có tài khoản?',
        forgotPassword: 'Quên mật khẩu?'
      },
      quiz: {
        title: 'Kể Về Doanh Nghiệp Của Bạn',
        subtitle: 'Trả lời một vài câu hỏi để nhận đề xuất cá nhân hóa',
        next: 'Tiếp Theo',
        back: 'Quay Lại',
        submit: 'Nhận Đề Xuất'
      },
      chat: {
        title: 'Cố Vấn Marketing',
        placeholder: 'Hỏi tôi bất cứ điều gì về marketing...',
        send: 'Gửi'
      },
      settings: {
        title: 'Cài đặt',
        profile: 'Hồ sơ',
        security: 'Bảo mật',
        preferences: 'Tùy chọn',
        profileInfo: 'Thông tin hồ sơ',
        changePassword: 'Đổi mật khẩu',
        appPreferences: 'Tùy chọn ứng dụng',
        fullName: 'Họ và tên',
        email: 'Email',
        currentPassword: 'Mật khẩu hiện tại',
        newPassword: 'Mật khẩu mới',
        confirmPassword: 'Xác nhận mật khẩu mới',
        saveChanges: 'Lưu thay đổi',
        saving: 'Đang lưu...',
        language: 'Ngôn ngữ',
        theme: 'Giao diện',
        dark: 'Tối',
        light: 'Sáng'
      }
    }
  }
};

const savedLang = localStorage.getItem('advisor-lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
