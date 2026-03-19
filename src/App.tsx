import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthForm } from './components/AuthForm';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { LiveShow } from './pages/LiveShow';
import { Scoreboard } from './pages/Scoreboard';
import { Artists } from './pages/Artists';
import { ArtistDashboard } from './pages/ArtistDashboard';
import { AdminPanel } from './pages/AdminPanel';

function getPageFromHash(): string {
  const hash = window.location.hash.slice(1);
  return hash || 'home';
}

function AppContent() {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();
  const [currentPage, setCurrentPage] = useState(getPageFromHash());
  const [showAuthForm, setShowAuthForm] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(getPageFromHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (page: string) => {
    window.location.hash = page;
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent" />
        <div className="relative text-center animate-fade-in">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-electric-400 via-cyan-500 to-neon-500 rounded-3xl animate-pulse shadow-neon-glow" />
            <div className="absolute inset-2 bg-slate-950 rounded-2xl flex items-center justify-center">
              <div className="w-12 h-12 bg-gradient-to-br from-electric-400 to-neon-500 rounded-xl animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>
          <h2 className="font-display text-3xl font-bold text-gradient-electric mb-2">Couch Slam</h2>
          <p className="text-gray-400 text-lg">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (showAuthForm && !user) {
    return <AuthForm onClose={() => setShowAuthForm(false)} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} onShowAuth={() => setShowAuthForm(true)} />;
      case 'live':
        return <LiveShow onLoginRequired={() => setShowAuthForm(true)} />;
      case 'scoreboard':
        return <Scoreboard />;
      case 'artists':
        return <Artists />;
      case 'dashboard':
        if (!user || !profile) {
          setShowAuthForm(true);
          return <Home onNavigate={handleNavigate} onShowAuth={() => setShowAuthForm(true)} />;
        }
        return profile.user_type === 'artist' ? <ArtistDashboard /> : <Home onNavigate={handleNavigate} onShowAuth={() => setShowAuthForm(true)} />;
      case 'admin':
        if (!user || !profile) {
          setShowAuthForm(true);
          return <Home onNavigate={handleNavigate} onShowAuth={() => setShowAuthForm(true)} />;
        }
        return profile.access_role === 'admin' ? <AdminPanel /> : <Home onNavigate={handleNavigate} onShowAuth={() => setShowAuthForm(true)} />;
      default:
        return <Home onNavigate={handleNavigate} onShowAuth={() => setShowAuthForm(true)} />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onShowAuth={() => setShowAuthForm(true)}
    >
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
