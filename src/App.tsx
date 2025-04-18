import { useEffect, useLayoutEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import StarryBackground from './components/StarryBackground';
import CaptionsDisplay from './components/CaptionsDisplay';
import ControlButtons from './components/ControlButtons';
import useSpeechRecognition from './hooks/useSpeechRecognition';
import useAppStore from './store';
import DualMicPage from './components/DualMicPage';
import Header from './components/Header';
import Login from './components/Login';
import Signup from './components/Signup';
import Premium from './components/Premium';
import Splash from './components/Splash';
import AdminPage from './components/Admin/AdminPage';

const MainContent: React.FC = () => {
  const { themeMode, isDualMicActive, currentUser } = useAppStore();
  const { error } = useSpeechRecognition();
  const location = useLocation();

  const PremiumContent = () => (
    <>
      <CaptionsDisplay />
      <ControlButtons />
      {isDualMicActive && <DualMicPage />}
    </>
  );

  // Hide Header for /admin routes
  const showHeader = !location.pathname.startsWith('/admin');

  return (
    <>
      {showHeader && <Header />}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: themeMode === 'dark' ? '#1F2937' : '#FFFFFF',
            color: themeMode === 'dark' ? '#FFFFFF' : '#1F2937',
          },
        }}
      />
      <div className="min-h-screen flex items-center justify-center px-4 relative">
        <StarryBackground />
        <Routes>
          {/* Root route */}
          <Route
            path="/"
            element={
              currentUser ? (
                currentUser.role === 'admin' ? (
                  <Navigate to="/admin" replace />
                ) : currentUser.isPremium ? (
                  <PremiumContent />
                ) : (
                  <Splash />
                )
              ) : (
                <Splash />
              )
            }
          />
          {/* Dashboard route - only for premium users */}
          <Route
            path="/dashboard"
            element={
              currentUser?.isPremium ? (
                <PremiumContent />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          {/* Dual Mic route - only for premium users */}
          <Route
            path="/dual-mic"
            element={
              currentUser?.isPremium ? (
                isDualMicActive ? (
                  <DualMicPage />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          {/* Admin route - strict check for exact 'admin' role */}
          <Route
            path="/admin/*"
            element={
              currentUser?.role === 'admin' ? (
                <AdminPage />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          {/* Auth routes */}
          <Route
            path="/login"
            element={currentUser ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/signup"
            element={currentUser ? <Navigate to="/" replace /> : <Signup />}
          />
          {/* Premium route */}
          <Route path="/premium" element={<Premium />} />
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {/* Error display */}
        {error && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50">
            {error}
          </div>
        )}
      </div>
    </>
  );
};

function App() {
  const { themeMode, setPopoutState } = useAppStore();

  useLayoutEffect(() => {
    setPopoutState('hidden');
  }, [setPopoutState]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
  }, [themeMode]);

  return (
    <Router>
      <MainContent />
    </Router>
  );
}

export default App;