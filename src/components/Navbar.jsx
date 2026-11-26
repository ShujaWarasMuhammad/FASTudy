import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import AuthModal from './AuthModal';
import {
  Sun,
  Moon,
  LogIn,
  LogOut,
  Terminal,
} from 'lucide-react';

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated, signOut, userDetails } = useAuth();
  const { profile } = useProfile();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const location = useLocation();

  const displayName = profile.username || userDetails?.fullName || userDetails?.username || user?.email?.split('@')[0] || 'FASTian';
  const avatarUrl = profile.avatar_url || userDetails?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=Fastian_2024';

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          {/* Brand Identity */}
          <div className="header-brand-group">
            <Link to="/" className="brand-terminal-link" aria-label="FASTudy Home">
              <span className="brand-glyph">
                <Terminal size={14} />
              </span>
              <span className="brand-title-text">
                FAST<span className="brand-dim">udy</span>
              </span>
            </Link>

          </div>

          {/* Core Navigation Links */}
          <nav className="header-nav-menu" aria-label="Main Navigation">
            <Link
              to="/"
              className={`nav-tab-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Dashboard
            </Link>
            <Link
              to="/practice"
              className={`nav-tab-link ${
                location.pathname.startsWith('/practice') ? 'active' : ''
              }`}
            >
              Practice
            </Link>
            <Link
              to="/profile"
              className={`nav-tab-link ${
                location.pathname === '/profile' ? 'active' : ''
              }`}
            >
              Progress
            </Link>
            <Link
              to="/cms"
              className={`nav-tab-link ${
                location.pathname === '/cms' ? 'active' : ''
              }`}
            >
              CMS
            </Link>
          </nav>

          {/* Right Utilities */}
          <div className="header-utility-group">
            <button
              className="btn-theme-toggle"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle visual theme"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {isAuthenticated ? (
              <div className="authenticated-user-chip">
                <Link to="/profile" className="user-id-anchor" title="View profile record">
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="avatar-tiny"
                  />
                  <span className="username-display">{displayName}</span>
                </Link>
                <button
                  className="btn-disconnect"
                  onClick={signOut}
                  title="Sign out of FASTudy"
                  aria-label="Sign out"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <button
                className="btn-session-signin"
                onClick={() => setIsAuthOpen(true)}
              >
                <LogIn size={13} />
                <span>Sign in</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}

