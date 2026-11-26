import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, CheckCircle, ArrowRight, UserCheck, X, Shield, Sparkles } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { signInWithOAuth, signInWithEmail, signUpWithEmail, signInAsGuest, authError, setAuthError } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeError = errorMsg || authError;

  const handleOAuth = async (provider) => {
    setErrorMsg('');
    if (setAuthError) setAuthError(null);
    setOauthLoading(provider);

    try {
      const { error } = await signInWithOAuth(provider);
      if (error) {
        if (error.message?.includes('provider is not enabled') || error.message?.includes('validation_failed')) {
          setErrorMsg(`${provider === 'github' ? 'GitHub' : 'Google'} provider setup pending in your Supabase project. You can sign in instantly with Email or Guest demo below.`);
        } else {
          setErrorMsg(error.message);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'OAuth initialization failed.');
    } finally {
      setOauthLoading(null);
    }
  };

  const handleGuestSignIn = () => {
    signInAsGuest('FASTian_Student');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (setAuthError) setAuthError(null);
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUpWithEmail(email, password);
        if (error) throw error;
        setSuccessMsg('Account created successfully! Welcome to FASTudy.');
        setTimeout(() => onClose(), 1200);
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog auth-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="auth-brand-badge">
              <Shield size={13} />
              <span>FASTudy Account</span>
            </div>
            <h3 className="modal-title">{isSignUp ? 'Create your account' : 'Welcome back'}</h3>
            <p className="modal-subtitle">
              {isSignUp
                ? 'Track your solve streak, profile heatmap, and problem bookmarks'
                : 'Sign in to sync your progress across sessions and devices'}
            </p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {activeError && (
          <div className="auth-alert error" role="alert">
            <AlertCircle size={16} className="auth-alert-icon" />
            <div className="auth-alert-text">{activeError}</div>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert success" role="status">
            <CheckCircle size={16} className="auth-alert-icon" />
            <div className="auth-alert-text">{successMsg}</div>
          </div>
        )}

        <div className="oauth-buttons">
          <button
            type="button"
            className={`btn-oauth ${oauthLoading === 'github' ? 'loading' : ''}`}
            onClick={() => handleOAuth('github')}
            disabled={!!oauthLoading || isLoading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>{oauthLoading === 'github' ? 'Redirecting to GitHub...' : 'Continue with GitHub'}</span>
          </button>
          <button
            type="button"
            className={`btn-oauth ${oauthLoading === 'google' ? 'loading' : ''}`}
            onClick={() => handleOAuth('google')}
            disabled={!!oauthLoading || isLoading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{oauthLoading === 'google' ? 'Redirecting to Google...' : 'Continue with Google'}</span>
          </button>
        </div>

        <div className="auth-divider">
          <span>or continue with email</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-group">
            <label htmlFor="auth-email">Email address</label>
            <div className="input-with-icon">
              <Mail size={16} className="field-icon" />
              <input
                id="auth-email"
                type="email"
                placeholder="student@nu.edu.pk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="auth-password">Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="field-icon" />
              <input
                id="auth-password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-auth-submit" disabled={isLoading || !!oauthLoading}>
            <span>{isLoading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight size={15} />
          </button>
        </form>

        <div className="guest-action-divider">
          <button
            type="button"
            className="btn-guest-login"
            onClick={handleGuestSignIn}
          >
            <Sparkles size={14} className="guest-icon" />
            <span>Continue as Guest FASTian (Instant Demo)</span>
          </button>
        </div>

        <div className="modal-footer">
          <span>{isSignUp ? 'Already have an account?' : "Don't have an account yet?"}</span>
          <button
            type="button"
            className="btn-switch-mode"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
              setSuccessMsg('');
            }}
          >
            {isSignUp ? 'Sign in' : 'Create account'}
          </button>
        </div>
      </div>
    </div>
  );
}

