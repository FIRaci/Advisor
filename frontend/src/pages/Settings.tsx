import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { ArrowLeft, User, Lock, Globe, Moon, Camera, Check } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api } from '../hooks/useApi';
import './Settings.css';

export default function Settings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setAuth } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (
    localStorage.getItem('advisor-theme') === 'light' ? 'light' : 'dark'
  ));

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setAvatar(user?.avatar || null);
  }, [user]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('advisor-theme', theme);
  }, [theme]);

  if (!user) {
    return null;
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }
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
      alert('Name and email are required');
      return;
    }

    setProfileSaving(true);

    const res = await api.updateMe({ name: nextName, email: nextEmail, avatar: avatar || undefined });
    if (res.success && res.data) {
      setAuth(res.data);
      setSavedMessage(t('settings.saveChanges') + '!');
      setTimeout(() => setSavedMessage(''), 3000);
      setProfileSaving(false);
      return;
    }

    if (res.error === 'Session expired. Please log in again.') {
      navigate('/login');
      setProfileSaving(false);
      return;
    }

    alert(res.error || 'Failed to save profile');
    setProfileSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters');
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

      alert(res.error || 'Failed to change password');
      setPasswordSaving(false);
      return;
    }

    setSavedMessage('Password changed!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSavedMessage(''), 3000);
    setPasswordSaving(false);
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <header className="settings-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1>{t('settings.title')}</h1>
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
            <span>{t('settings.profile')}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Lock size={18} />
            <span>{t('settings.security')}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <Globe size={18} />
            <span>{t('settings.preferences')}</span>
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
              <h2>{t('settings.profileInfo')}</h2>
              
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
                <p className="avatar-hint">Click to change avatar</p>
              </div>

              {/* Name */}
              <div className="form-group">
                <label>{t('settings.fullName')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label>{t('settings.email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              <button className="save-btn" onClick={handleSaveProfile} disabled={profileSaving}>
                {profileSaving
                  ? t('settings.saving')
                  : t('settings.saveChanges')}
              </button>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="tab-content">
              <h2>{t('settings.changePassword')}</h2>

              <div className="form-group">
                <label>{t('settings.currentPassword')}</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="form-group">
                <label>{t('settings.newPassword')}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="form-group">
                <label>{t('settings.confirmPassword')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <button className="save-btn" onClick={handleChangePassword} disabled={passwordSaving}>
                {passwordSaving
                  ? t('settings.saving')
                  : t('settings.changePassword')}
              </button>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="tab-content">
              <h2>{t('settings.appPreferences')}</h2>

              {/* Theme */}
              <div className="preference-item">
                <div className="preference-info">
                  <Moon size={20} />
                  <div>
                    <h3>{t('settings.theme')}</h3>
                    <p>App color scheme</p>
                  </div>
                </div>
                <button 
                  className={`toggle-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? t('settings.dark') : t('settings.light')}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
