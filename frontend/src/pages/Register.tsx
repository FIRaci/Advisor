import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

import './Auth.css';

import { api } from '../hooks/useApi';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.register(email, password, name);
      
      if (res.success && res.data) {
        setAuth({ id: res.data.id, email: res.data.email, name: res.data.name });
        navigate('/', { replace: true });
      } else {
        setError(res.error || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
            <h1>{t('auth.registerTitle')}</h1>
            <p>{t('auth.registerSubtitle')}</p>
          </div>

          {error && <div className="auth-error">{error}</div>}



          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>{t('auth.name')}</label>
              <div className="auth-input-shell">
                <User size={18} className="auth-input-icon" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="auth-input-field"
                />
              </div>
            </div>

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
                  minLength={8}
                  className="auth-input-field"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? <div className="spinner" /> : (
                <>
                  {t('auth.register')}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="auth-footer">
            {t('auth.hasAccount')} <Link to="/login">{t('nav.login')}</Link>
          </p>
        </motion.div>
      </div>

      <div className="auth-bg" />
    </div>
  );
}
