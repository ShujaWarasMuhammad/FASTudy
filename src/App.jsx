import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import { QuestionsProvider } from './context/QuestionsContext';
import { NAV_ITEMS } from './config/navigation';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Practice from './pages/Practice';
import QuestionView from './pages/QuestionView';
import Profile from './pages/Profile';
import Planner from './pages/Planner';
import './index.css';

/** Scrolls to top and sets a page title on every navigation. */
function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const page = NAV_ITEMS.find((n) => n.match(pathname));
    if (!pathname.startsWith('/question')) {
      document.title = page && page.to !== '/' ? `${page.label} · FASTudy` : 'FASTudy';
    }
  }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <div className="page-container not-found">
      <p className="dash-date">404</p>
      <h1 className="dash-title">This page doesn’t exist.</h1>
      <p>The link may be outdated. Use search (<kbd>Ctrl</kbd><kbd>K</kbd>) or head back.</p>
      <Link to="/" className="btn-primary">Go to dashboard</Link>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <QuestionsProvider>
            <BrowserRouter>
              <RouteEffects />
              <Navbar />
              <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/practice" element={<Practice />} />
                  <Route path="/practice/:subjectId" element={<Practice />} />
                  <Route path="/practice/:subjectId/:categoryId/:subcategoryId" element={<Practice />} />
                  <Route path="/question/:questionId" element={<QuestionView />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/planner" element={<Planner />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </BrowserRouter>
          </QuestionsProvider>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
