import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, LogIn, LogOut, Terminal, Search } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { NAV_ITEMS } from '../config/navigation';
import AuthModal from './AuthModal';
import CommandPalette from './CommandPalette';

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated, signOut, userDetails } = useAuth();
  const { profile } = useProfile();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const { pathname } = useLocation();

  const displayName = profile.username || userDetails?.fullName || userDetails?.username || user?.email?.split('@')[0] || 'FASTian';
  const avatarUrl = profile.avatar_url || userDetails?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.id || 'fastudy')}`;
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((v) => !v);
      } else if (e.key === '/' && !/input|textarea|select/i.test(e.target.tagName) && !e.target.isContentEditable) {
        e.preventDefault();
        setIsPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <div className="header-brand-group">
            <Link to="/" className="brand-terminal-link" aria-label="FASTudy home">
              <span className="brand-glyph"><Terminal size={14} /></span>
              <span className="brand-title-text">FAST<span className="brand-dim">udy</span></span>
            </Link>
          </div>

          <nav className="header-nav-menu" aria-label="Main navigation">
            {NAV_ITEMS.map(({ to, label, icon: Icon, hint, match }) => {
              const active = match(pathname);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`nav-tab-link ${active ? 'active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  data-tip={hint}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="header-utility-group">
            <button className="nav-search-btn" onClick={() => setIsPaletteOpen(true)} aria-label="Search (Ctrl+K)">
              <Search size={14} />
              <span className="nav-search-text">Search</span>
              <kbd>{isMac ? '⌘' : 'Ctrl'} K</kbd>
            </button>

            <button
              className="btn-theme-toggle"
              onClick={toggleTheme}
              title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {isAuthenticated ? (
              <div className="authenticated-user-chip">
                <Link to="/profile" className="user-id-anchor" title="Your progress & profile">
                  <img src={avatarUrl} alt="" className="avatar-tiny" />
                  <span className="username-display">{displayName}</span>
                </Link>
                <button className="btn-disconnect" onClick={signOut} title="Sign out" aria-label="Sign out">
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <button className="btn-session-signin" onClick={() => setIsAuthOpen(true)}>
                <LogIn size={13} />
                <span>Sign in</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <CommandPalette open={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </>
  );
}
