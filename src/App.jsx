import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import { QuestionsProvider } from './context/QuestionsContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Practice from './pages/Practice';
import QuestionView from './pages/QuestionView';
import Profile from './pages/Profile';
import Planner from './pages/Planner';
import Cms from './pages/Cms';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <QuestionsProvider>
            <BrowserRouter>
              <Navbar />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/practice" element={<Practice />} />
                <Route path="/practice/:subjectId" element={<Practice />} />
                <Route
                  path="/practice/:subjectId/:categoryId/:subcategoryId"
                  element={<Practice />}
                />
                <Route path="/question/:questionId" element={<QuestionView />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/planner" element={<Planner />} />
                <Route path="/cms" element={<Cms />} />
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
