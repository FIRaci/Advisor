import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { ArrowLeft, User, Lock, Globe, Moon, Camera, Check } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api } from '../hooks/useApi';
import './Settings.css';

export default function Settings() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, token, setAuth } = useAuthStore();
  const lang = i18n.language as 'en' | 'vi';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
  }, [user]);

  if (!token) {
    return null;
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    const nextName = name.trim();
    const nextEmail = email.trim().toLowerCase();

    if (!nextName || !nextEmail) {
      alert(lang === 'en' ? 'Name and email are required' : 'Vui lòng nhập tên và email');
      return;
    }

    setProfileSaving(true);

    const res = await api.updateMe({ name: nextName, email: nextEmail });
    if (res.success && res.data) {
      setAuth(
        { id: res.data.id, email: res.data.email, name: res.data.name },
        token
      );
      setSavedMessage(lang === 'en' ? 'Profile saved!' : 'Đã lưu hồ sơ!');
      setTimeout(() => setSavedMessage(''), 3000);
      setProfileSaving(false);
      return;
    }

    if (res.error === 'Session expired. Please log in again.') {
      navigate('/login');
      setProfileSaving(false);
      return;
    }

    alert(res.error || (lang === 'en' ? 'Failed to save profile' : 'Lưu hồ sơ thất bại'));
    setProfileSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert(lang === 'en' ? 'Passwords do not match' : 'Mật khẩu không khớp');
      return;
    }
    if (newPassword.length < 6) {
      alert(lang === 'en' ? 'Password must be at least 6 characters' : 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setPasswordSaving(true);

    const res = await api.changePassword({
      currentPassword,
      newPassword
    });

    if (!res.success) {
      if (res.error === 'Session expired. Please log in again.') {
        navigate('/login');
        setPasswordSaving(false);
        return;
      }

      alert(res.error || (lang === 'en' ? 'Failed to change password' : 'Đổi mật khẩu thất bại'));
      setPasswordSaving(false);
      return;
    }

    setSavedMessage(lang === 'en' ? 'Password changed!' : 'Đã đổi mật khẩu!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSavedMessage(''), 3000);
    setPasswordSaving(false);
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(lang === 'en' ? 'vi' : 'en');
    setSavedMessage(lang === 'en' ? 'Language changed!' : 'Đã đổi ngôn ngữ!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <header className="settings-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1>{lang === 'en' ? 'Settings' : 'Cài đặt'}</h1>
      </header>

      {/* Main */}
      <main className="settings-main">
        {/* Tabs */}
        <div className="settings-tabs">
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            <span>{lang === 'en' ? 'Profile' : 'Hồ sơ'}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Lock size={18} />
            <span>{lang === 'en' ? 'Security' : 'Bảo mật'}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <Globe size={18} />
            <span>{lang === 'en' ? 'Preferences' : 'Tùy chọn'}</span>
          </button>
        </div>

        {/* Content */}
        <div className="settings-content">
          {/* Success Message */}
          {savedMessage && (
            <motion.div 
              className="success-toast"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Check size={18} />
              <span>{savedMessage}</span>
            </motion.div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="tab-content">
              <h2>{lang === 'en' ? 'Profile Information' : 'Thông tin hồ sơ'}</h2>
              
              {/* Avatar */}
              <div className="avatar-section">
                <div className="avatar-preview" onClick={() => fileInputRef.current?.click()}>
                  {avatar ? (
                    <img src={avatar} alt="Avatar" />
                  ) : (
                    <span>{user?.name?.charAt(0) || 'U'}</span>
                  )}
                  <div className="avatar-overlay">
                    <Camera size={20} />
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleAvatarChange}
                  hidden
                />
                <p className="avatar-hint">{lang === 'en' ? 'Click to change avatar' : 'Nhấn để đổi ảnh đại diện'}</p>
              </div>

              {/* Name */}
              <div className="form-group">
                <label>{lang === 'en' ? 'Full Name' : 'Họ và tên'}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === 'en' ? 'Enter your name' : 'Nhập tên của bạn'}
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label>{lang === 'en' ? 'Email' : 'Email'}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={lang === 'en' ? 'Enter your email' : 'Nhập email của bạn'}
                />
              </div>

              <button className="save-btn" onClick={handleSaveProfile} disabled={profileSaving}>
                {profileSaving
                  ? (lang === 'en' ? 'Saving...' : 'Đang lưu...')
                  : (lang === 'en' ? 'Save Changes' : 'Lưu thay đổi')}
              </button>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="tab-content">
              <h2>{lang === 'en' ? 'Change Password' : 'Đổi mật khẩu'}</h2>

              <div className="form-group">
                <label>{lang === 'en' ? 'Current Password' : 'Mật khẩu hiện tại'}</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="form-group">
                <label>{lang === 'en' ? 'New Password' : 'Mật khẩu mới'}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="form-group">
                <label>{lang === 'en' ? 'Confirm New Password' : 'Xác nhận mật khẩu mới'}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <button className="save-btn" onClick={handleChangePassword} disabled={passwordSaving}>
                {passwordSaving
                  ? (lang === 'en' ? 'Updating...' : 'Đang cập nhật...')
                  : (lang === 'en' ? 'Change Password' : 'Đổi mật khẩu')}
              </button>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="tab-content">
              <h2>{lang === 'en' ? 'App Preferences' : 'Tùy chọn ứng dụng'}</h2>

              {/* Language */}
              <div className="preference-item">
                <div className="preference-info">
                  <Globe size={20} />
                  <div>
                    <h3>{lang === 'en' ? 'Language' : 'Ngôn ngữ'}</h3>
                    <p>{lang === 'en' ? 'Choose your preferred language' : 'Chọn ngôn ngữ hiển thị'}</p>
                  </div>
                </div>
                <button className="toggle-btn" onClick={toggleLanguage}>
                  {lang === 'en' ? 'English' : 'Tiếng Việt'}
                </button>
              </div>

              {/* Theme */}
              <div className="preference-item">
                <div className="preference-info">
                  <Moon size={20} />
                  <div>
                    <h3>{lang === 'en' ? 'Theme' : 'Giao diện'}</h3>
                    <p>{lang === 'en' ? 'App color scheme' : 'Chế độ màu ứng dụng'}</p>
                  </div>
                </div>
                <button className="toggle-btn active">
                  {lang === 'en' ? 'Dark' : 'Tối'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
