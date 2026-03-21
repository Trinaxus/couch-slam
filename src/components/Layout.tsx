import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Users, Trophy, Settings, Shield, LogOut, User, Radio, LayoutDashboard, Languages, Home, Maximize2, Minimize2, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onShowAuth: () => void;
}

export function Layout({ children, currentPage, onNavigate, onShowAuth }: LayoutProps) {
  const { user, profile, token, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const userTypeLabel = profile?.user_type === 'artist' ? 'Artist' : 'Zuschauer';

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [artistAvatarThumbUrl, setArtistAvatarThumbUrl] = useState<string | null>(null);

  const [dbOk, setDbOk] = useState<boolean | null>(null);
  const serverBaseUrl = (import.meta.env.VITE_SERVER_BASE_URL as string | undefined) || '';
  const dbTestUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/db_test.php` : '';
  const artistMeGetUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/artist_me_get.php` : '';

  useEffect(() => {
    if (!user || !profile || profile.user_type !== 'artist') {
      setArtistAvatarThumbUrl(null);
      return;
    }
    if (!artistMeGetUrl || !token) {
      setArtistAvatarThumbUrl(null);
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch(`${artistMeGetUrl}?token=${encodeURIComponent(token)}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const json = (await res.json()) as any;
        const url = (json?.artist?.avatar_url as string | null) ?? null;
        if (!cancelled) setArtistAvatarThumbUrl(url && String(url).trim() ? String(url) : null);
      } catch {
        if (!cancelled) setArtistAvatarThumbUrl(null);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [user, profile?.user_type, artistMeGetUrl, token]);

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

  useEffect(() => {
    if (!showMobileMenu) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMobileMenu(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showMobileMenu]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNavigate = (page: string) => {
    setShowMobileMenu(false);
    setShowSettingsMenu(false);
    onNavigate(page);
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

    if (profile) {
      items.push({ id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard });
    }

    return items;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent pointer-events-none" />

      <nav className="glass-dark sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-8 min-w-0">
              <button
                onClick={() => handleNavigate('home')}
                className="flex items-center group"
              >
                <img
                  src="/couch_slam_02.png"
                  alt="Couch Slam"
                  className="h-9 sm:h-10 md:h-12 w-auto object-contain transform group-hover:scale-[1.02] transition-all duration-300 drop-shadow-lg"
                />
              </button>

              <div className="hidden lg:flex items-center gap-2">
                {getNavItems().map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`h-11 flex items-center gap-2 px-4 rounded-2xl font-semibold text-sm transition-all duration-200 border ${
                      currentPage === item.id
                        ? 'bg-gradient-to-r from-cyan-500/20 to-electric-500/15 text-cyan-200 border-cyan-500/40 ring-1 ring-inset ring-cyan-500/25'
                        : 'bg-white/[0.02] text-gray-200 hover:bg-white/[0.05] hover:text-white border-white/10 hover:border-white/20'
                    }`}
                  >
                    <item.icon className="w-4.5 h-4.5" />
                    <span className="font-bold">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileMenu(true)}
                className="lg:hidden h-11 w-11 inline-flex items-center justify-center glass rounded-2xl text-gray-200 hover:text-white transition-all duration-200 border border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                title="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {user && profile ? (
                <>
                  <div className="hidden sm:flex glass h-11 px-4 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3">
                      {artistAvatarThumbUrl ? (
                        <img
                          src={artistAvatarThumbUrl}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover shadow-glow-sm border border-white/10"
                        />
                      ) : profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover shadow-glow-sm border border-white/10"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-gradient-to-br from-electric-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-glow-sm">
                          <User className="w-4.5 h-4.5 text-slate-950" />
                        </div>
                      )}
                      <div className="text-sm">
                        <div className="text-white font-semibold leading-tight">{profile.display_name}</div>
                        <div className="text-cyan-400 text-xs font-medium leading-tight">{userTypeLabel}</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <button
                  onClick={onShowAuth}
                  className="h-11 px-4 inline-flex items-center gap-2 rounded-2xl font-semibold text-sm transition-all duration-200 bg-cyan-500/15 hover:bg-cyan-500/20 text-cyan-100 border border-cyan-500/25 hover:border-cyan-400/35"
                >
                  <User className="w-4.5 h-4.5" />
                  <span className="hidden sm:inline font-bold">{t.nav.signIn}</span>
                </button>
              )}

              <div className="relative hidden sm:block" data-settings-menu-root="true">
                <button
                  onClick={() => setShowSettingsMenu((v) => !v)}
                  className={`h-11 w-11 inline-flex items-center justify-center glass rounded-2xl transition-all duration-200 border ${
                    showSettingsMenu
                      ? 'text-white border-cyan-500/35 ring-1 ring-inset ring-cyan-500/25 bg-white/[0.04]'
                      : 'text-gray-200 hover:text-white border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
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
                      {profile?.access_role === 'admin' && (
                        <button
                          onClick={() => {
                            handleNavigate('admin');
                          }}
                          className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all"
                          title={t.nav.admin}
                        >
                          <div className="flex items-center gap-3">
                            <Shield className="w-4.5 h-4.5 text-gray-300" />
                            <span className="text-sm font-semibold text-white">{t.nav.admin}</span>
                          </div>
                        </button>
                      )}

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
        </div>
      </nav>

      {showMobileMenu && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowMobileMenu(false)}
            aria-label="Close menu"
          />

          <div className="absolute top-0 left-0 right-0 glass-dark border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img src="/couch_slam_02.png" alt="Couch Slam" className="h-9 w-auto object-contain" />
                </div>

                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="h-11 w-11 inline-flex items-center justify-center glass rounded-2xl text-gray-200 hover:text-white transition-all duration-200 border border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {user && profile && (
                <div className="mt-4 glass h-11 px-4 rounded-2xl border border-white/10 flex items-center">
                  <div className="flex items-center gap-3">
                    {artistAvatarThumbUrl ? (
                      <img
                        src={artistAvatarThumbUrl}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover shadow-glow-sm border border-white/10"
                      />
                    ) : profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover shadow-glow-sm border border-white/10"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-electric-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-glow-sm">
                        <User className="w-5 h-5 text-slate-950" />
                      </div>
                    )}
                    <div className="text-sm">
                      <div className="text-white font-semibold leading-tight">{profile.display_name}</div>
                      <div className="text-cyan-400 text-xs font-medium leading-tight">{userTypeLabel}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 grid gap-2">
                {getNavItems().map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full h-11 flex items-center gap-3 px-4 rounded-2xl font-semibold text-sm transition-all duration-200 border ${
                      currentPage === item.id
                        ? 'bg-gradient-to-r from-cyan-500/20 to-electric-500/15 text-cyan-200 border-cyan-500/40 ring-1 ring-inset ring-cyan-500/25'
                        : 'bg-white/[0.02] text-gray-200 hover:bg-white/[0.05] hover:text-white border-white/10 hover:border-white/20'
                    }`}
                  >
                    <item.icon className="w-4.5 h-4.5" />
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 border-t border-white/10 pt-3 grid gap-2">
                {profile?.access_role === 'admin' && (
                  <button
                    onClick={() => {
                      handleNavigate('admin');
                    }}
                    className="w-full h-11 flex items-center justify-between gap-3 px-4 rounded-2xl transition-all duration-200 border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-4.5 h-4.5 text-gray-300" />
                      <span className="text-sm font-semibold text-white">{t.nav.admin}</span>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => {
                    toggleLanguage();
                    setShowMobileMenu(false);
                  }}
                  className="w-full h-11 flex items-center justify-between gap-3 px-4 rounded-2xl transition-all duration-200 border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20"
                >
                  <div className="flex items-center gap-3">
                    <Languages className="w-4.5 h-4.5 text-gray-300" />
                    <span className="text-sm font-semibold text-white">Sprache</span>
                  </div>
                  <span className="text-xs font-bold uppercase text-cyan-400">{language.toUpperCase()}</span>
                </button>

                <button
                  onClick={() => {
                    void toggleFullscreen();
                    setShowMobileMenu(false);
                  }}
                  disabled={!canFullscreen}
                  className="w-full h-11 flex items-center justify-between gap-3 px-4 rounded-2xl transition-all duration-200 border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
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
                    className="w-full h-11 flex items-center justify-between gap-3 px-4 rounded-2xl border border-white/10 bg-white/[0.02]"
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
                          dbOk === null ? 'bg-gray-500' : dbOk ? 'bg-green-400' : 'bg-red-400'
                        }`}
                      />
                      <span className="text-sm font-semibold text-white">Datenbank</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-400">{dbOk === null ? 'Unknown' : dbOk ? 'Live' : 'Offline'}</span>
                  </div>
                )}

                {user && profile ? (
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      void handleSignOut();
                    }}
                    className="w-full h-11 flex items-center justify-between gap-3 px-4 rounded-2xl transition-all duration-200 border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut className="w-4.5 h-4.5 text-gray-300" />
                      <span className="text-sm font-semibold text-white">{t.nav.signOut}</span>
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      onShowAuth();
                    }}
                    className="w-full h-11 flex items-center justify-between gap-3 px-4 rounded-2xl transition-all duration-200 border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20"
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-4.5 h-4.5 text-gray-300" />
                      <span className="text-sm font-semibold text-white">{t.nav.signIn}</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>
    </div>
  );
}
