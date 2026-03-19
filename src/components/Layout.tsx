import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Users, Trophy, Settings, LogOut, User, Radio, LayoutDashboard, Languages, Home, Maximize2, Minimize2 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onShowAuth: () => void;
}

export function Layout({ children, currentPage, onNavigate, onShowAuth }: LayoutProps) {
  const { user, profile, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const [dbOk, setDbOk] = useState<boolean | null>(null);
  const serverBaseUrl = (import.meta.env.VITE_SERVER_BASE_URL as string | undefined) || '';
  const dbTestUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/db_test.php` : '';

  useEffect(() => {
    if (!user || profile?.access_role !== 'admin' || !dbTestUrl) {
      setDbOk(null);
      return;
    }

    let cancelled = false;
    let timer: number | undefined;

    const check = async () => {
      try {
        const res = await fetch(dbTestUrl, { method: 'GET' });
        const data = (await res.json()) as any;
        const ok = Boolean(res.ok && (data?.db === true || data?.ok === true));
        if (!cancelled) setDbOk(ok);
      } catch {
        if (!cancelled) setDbOk(false);
      }
    };

    void check();
    timer = window.setInterval(() => {
      void check();
    }, 15000);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [user, profile?.access_role, dbTestUrl]);

  useEffect(() => {
    const update = () => {
      const supported = typeof document !== 'undefined' && typeof (document.documentElement as any)?.requestFullscreen === 'function';
      setCanFullscreen(Boolean(supported));
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    update();
    document.addEventListener('fullscreenchange', update);
    return () => {
      document.removeEventListener('fullscreenchange', update);
    };
  }, []);

  useEffect(() => {
    if (!showSettingsMenu) return;

    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-settings-menu-root="true"]')) return;
      setShowSettingsMenu(false);
    };

    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [showSettingsMenu]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'de' ? 'en' : 'de');
  };

  const toggleFullscreen = async () => {
    if (!canFullscreen) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // ignore
    }
  };

  const getNavItems = () => {
    const items = [
      { id: 'home', label: 'Home', icon: Home },
      { id: 'live', label: t.nav.liveShow, icon: Radio },
      { id: 'scoreboard', label: t.nav.scoreboard, icon: Trophy },
      { id: 'artists', label: t.nav.artists, icon: Users },
    ];

    if (profile?.user_type === 'artist') {
      items.push({ id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard });
    }

    if (profile?.access_role === 'admin') {
      items.push({ id: 'admin', label: t.nav.admin, icon: Settings });
    }

    return items;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent pointer-events-none" />

      <nav className="glass-dark sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-8">
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center gap-3 group"
              >
                <img
                  src="/TB_W_02_LOGO.png"
                  alt="Couch Slam Logo"
                  className="w-12 h-12 object-contain transform group-hover:scale-105 transition-all duration-300 drop-shadow-lg"
                />
                <span className="font-display text-2xl font-bold text-gradient-electric">
                  Couch Slam
                </span>
              </button>

              <div className="hidden lg:flex items-center gap-2">
                {getNavItems().map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                      currentPage === item.id
                        ? 'bg-gradient-to-r from-cyan-500/20 to-electric-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-gray-300 hover:bg-white/5 hover:text-cyan-300 border border-transparent'
                    }`}
                  >
                    <item.icon className="w-4.5 h-4.5" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user && profile ? (
                <>
                  <div className="hidden sm:flex glass px-4 py-2.5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-electric-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-glow-sm">
                        <User className="w-4.5 h-4.5 text-slate-950" />
                      </div>
                      <div className="text-sm">
                        <div className="text-white font-semibold leading-tight">{profile.display_name}</div>
                        <div className="text-cyan-400 capitalize text-xs font-medium leading-tight">{profile.access_role}</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <button
                  onClick={onShowAuth}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <User className="w-4.5 h-4.5" />
                  <span className="hidden sm:inline font-bold">{t.nav.signIn}</span>
                </button>
              )}

              <div className="relative" data-settings-menu-root="true">
                <button
                  onClick={() => setShowSettingsMenu((v) => !v)}
                  className="p-3 glass rounded-xl text-gray-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all duration-300 border border-white/10"
                  title="Settings"
                >
                  <Settings className="w-4.5 h-4.5" />
                </button>

                {showSettingsMenu && (
                  <div className="absolute right-0 mt-3 w-72 glass-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10">
                      <div className="text-white font-semibold text-sm">Einstellungen</div>
                      <div className="text-gray-400 text-xs">Sprache, Fullscreen, DB</div>
                    </div>

                    <div className="p-2">
                      <button
                        onClick={() => {
                          toggleLanguage();
                          setShowSettingsMenu(false);
                        }}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all"
                        title={language === 'de' ? 'Switch to English' : 'Zu Deutsch wechseln'}
                      >
                        <div className="flex items-center gap-3">
                          <Languages className="w-4.5 h-4.5 text-gray-300" />
                          <span className="text-sm font-semibold text-white">Sprache</span>
                        </div>
                        <span className="text-xs font-bold uppercase text-cyan-400">{language.toUpperCase()}</span>
                      </button>

                      <button
                        onClick={() => void toggleFullscreen()}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                        disabled={!canFullscreen}
                      >
                        <div className="flex items-center gap-3">
                          {isFullscreen ? (
                            <Minimize2 className="w-4.5 h-4.5 text-gray-300" />
                          ) : (
                            <Maximize2 className="w-4.5 h-4.5 text-gray-300" />
                          )}
                          <span className="text-sm font-semibold text-white">Fullscreen</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-400">{isFullscreen ? 'On' : 'Off'}</span>
                      </button>

                      {profile?.access_role === 'admin' && (
                        <div
                          className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                          title={
                            dbOk === null
                              ? 'DB Status: unknown'
                              : dbOk
                                ? 'DB Status: live'
                                : 'DB Status: offline'
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${
                                dbOk === null
                                  ? 'bg-gray-500'
                                  : dbOk
                                    ? 'bg-green-400'
                                    : 'bg-red-400'
                              }`}
                            />
                            <span className="text-sm font-semibold text-white">Datenbank</span>
                          </div>
                          <span className="text-xs font-semibold text-gray-400">
                            {dbOk === null ? 'Unknown' : dbOk ? 'Live' : 'Offline'}
                          </span>
                        </div>
                      )}

                      {user && profile && (
                        <>
                          <div className="my-2 border-t border-white/10" />
                          <button
                            onClick={() => {
                              setShowSettingsMenu(false);
                              void handleSignOut();
                            }}
                            className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all"
                            title={t.nav.signOut}
                          >
                            <div className="flex items-center gap-3">
                              <LogOut className="w-4.5 h-4.5 text-gray-300" />
                              <span className="text-sm font-semibold text-white">{t.nav.signOut}</span>
                            </div>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:hidden flex items-center gap-2 pb-4 overflow-x-auto scrollbar-hide">
            {getNavItems().map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
                  currentPage === item.id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-electric-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-300 glass border border-white/10 hover:text-cyan-300'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>
    </div>
  );
}
