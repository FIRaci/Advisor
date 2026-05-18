import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

import './Auth.css';

import { api } from '../hooks/useApi';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login(email, password);
      if (res.success && res.data) {
        setAuth({
          id: res.data.id,
          email: res.data.email,
          name: res.data.name
        }, res.data.token);
        navigate('/', { replace: true });
      } else {
        setError(res.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <motion.div 
          className="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to="/" className="auth-logo">
            <Sparkles size={24} />
            <span>AdVisor</span>
          </Link>

          <div className="auth-header">
            <h1>{t('auth.loginTitle')}</h1>
            <p>{t('auth.loginSubtitle')}</p>
          </div>

          {error && <div className="auth-error">{error}</div>}



          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>{t('auth.email')}</label>
              <div className="auth-input-shell">
                <Mail size={18} className="auth-input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="auth-input-field"
                />
              </div>
            </div>

            <div className="form-group">
              <label>{t('auth.password')}</label>
              <div className="auth-input-shell">
                <Lock size={18} className="auth-input-icon" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="auth-input-field"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? <div className="spinner" /> : (
                <>
                  {t('auth.login')}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="auth-footer">
            {t('auth.noAccount')} <Link to="/register">{t('nav.signup')}</Link>
          </p>
        </motion.div>
      </div>

      <div className="auth-bg" />
    </div>
  );
}
