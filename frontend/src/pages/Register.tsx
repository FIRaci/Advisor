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
        setAuth({
          id: res.data.id,
          email: res.data.email,
          name: res.data.name
        }, res.data.token);
        navigate('/', { replace: true });
      } else {
        setError(res.error || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('Google login is not supported in this version.');
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

          <button 
            type="button" 
            className="btn btn-outline w-full" 
            style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            onClick={handleGoogleLogin}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
              </g>
            </svg>
            Sign up with Google
          </button>
          
          <div style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            OR
          </div>

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
                  minLength={6}
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
