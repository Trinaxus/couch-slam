import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Music2, Trophy, Users, Radio, Star, Clock, Mic2, CheckCircle, Camera, Video, Disc3, Award, Gift, Sparkles, MessageCircle, Monitor, Eye, Smartphone, TrendingUp, Zap, ChevronDown, ChevronUp } from 'lucide-react';

interface HomeProps {
  onNavigate?: (page: string) => void;
  onShowAuth?: () => void;
}

export function Home({ onNavigate, onShowAuth }: HomeProps = {}) {
  const { t } = useLanguage();
  const { user, profile, token } = useAuth();
  const { showError, showInfo } = useToast();
  const [showArtistSection, setShowArtistSection] = useState(false);
  const [showAudienceSection, setShowAudienceSection] = useState(false);
  const [artistRequestLoading, setArtistRequestLoading] = useState(false);
  const [hasOpenArtistRequest, setHasOpenArtistRequest] = useState(false);

  const serverBaseUrl = (import.meta.env.VITE_SERVER_BASE_URL as string | undefined) || '';
  const artistRequestStatusUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/artist_request_status.php` : '';
  const artistRequestCreateUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/artist_request_create.php` : '';
  const artistRequestStatusUrlWithToken = artistRequestStatusUrl && token ? `${artistRequestStatusUrl}?token=${encodeURIComponent(token)}` : artistRequestStatusUrl;
  const artistRequestCreateUrlWithToken = artistRequestCreateUrl && token ? `${artistRequestCreateUrl}?token=${encodeURIComponent(token)}` : artistRequestCreateUrl;

  useEffect(() => {
    const run = async () => {
      if (!user || !token || !artistRequestStatusUrlWithToken) {
        setHasOpenArtistRequest(false);
        return;
      }

      if (profile?.user_type === 'artist') {
        setHasOpenArtistRequest(false);
        return;
      }

      try {
        const res = await fetch(artistRequestStatusUrlWithToken, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = (await res.json()) as any;
        if (!res.ok || !data?.ok) {
          return;
        }
        setHasOpenArtistRequest(Boolean(data?.has_open_request));
      } catch {
        // ignore
      }
    };

    void run();
  }, [user, token, profile?.user_type, artistRequestStatusUrlWithToken]);

  return (
    <div className="space-y-16 animate-fade-in">
      <section className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('/live-performance-hero.webp')] bg-cover bg-center opacity-30"></div>

        <div className="relative text-center space-y-8 py-24 px-6">
          <div className="inline-flex items-center gap-2 badge-live mx-auto">
            <Radio className="w-4 h-4" />
            Live Music Battle
          </div>

          <div className="flex flex-col items-center justify-center gap-6 mb-6">
            <img
              src="/TB_W_02_LOGO.png"
              alt="Couch Slam Logo"
              className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl"
            />
            <h1 className="text-gradient-electric text-5xl md:text-7xl">
              {((t as any)?.common?.appName as string) || 'Couch Slam'}
            </h1>
          </div>

          <p className="text-gray-300 text-xl max-w-3xl mx-auto leading-relaxed">
            Das Slam-Konzept trifft auf Live-Musik im professionellen Tonstudio. Erlebe spannende Performances,
            stimme für deine Favoriten ab und sichere dir hochwertige Aufnahmen deiner Performance.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#kuenstler" className="btn-primary">
              Für Künstler
            </a>
            <a href="#zuschauer" className="btn-secondary">
              Für Zuschauer
            </a>
          </div>
        </div>
      </section>

      <section id="konzept" className="card-premium">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="mb-6">Was ist Couch Slam?</h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                Couch Slam ist ein innovatives Live-Musik-Format nach dem Slam-Prinzip, das die Energie
                von Live-Performances mit professioneller Studiotechnik und digitaler Interaktivität verbindet.
              </p>
              <p>
                In einem gemütlichen Tonstudio treten Musiker und Bands in spannenden Runden gegeneinander an,
                während zwei charismatische Moderatoren durch die Show führen und das Publikum in Echtzeit abstimmt
                und die Show mitgestaltet.
              </p>
              <p>
                Das Besondere: Jede Performance wird mit 5 Live-Kameras festgehalten und in Studioqualität aufgenommen.
                Die Moderatoren interagieren live mit dem Publikum über Screens und schaffen eine einzigartige,
                interaktive Atmosphäre. Von der Vorrunde bis zum großen Finale - erlebe authentische Live-Musik
                und sei Teil eines einzigartigen Wettbewerbs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card text-center p-6">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-electric-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-glow-electric">
                <Users className="w-7 h-7 text-slate-950" />
              </div>
              <h4 className="text-white mb-2">Musiker & Bands</h4>
              <p className="text-gray-400 text-sm">Talentierte Acts aus allen Genres</p>
            </div>

            <div className="card text-center p-6">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-electric-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-glow-electric">
                <Radio className="w-7 h-7 text-slate-950" />
              </div>
              <h4 className="text-white mb-2">Live Stream</h4>
              <p className="text-gray-400 text-sm">Echtzeitübertragung der Show</p>
            </div>

            <div className="card text-center p-6">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-electric-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-glow-electric">
                <Star className="w-7 h-7 text-slate-950" />
              </div>
              <h4 className="text-white mb-2">Voting</h4>
              <p className="text-gray-400 text-sm">Publikum entscheidet live</p>
            </div>

            <div className="card text-center p-6">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-electric-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-glow-electric">
                <Trophy className="w-7 h-7 text-slate-950" />
              </div>
              <h4 className="text-white mb-2">Finale</h4>
              <p className="text-gray-400 text-sm">Besten Artists im Showdown</p>
            </div>
          </div>
        </div>
      </section>

      <section id="kuenstler" className="space-y-12 scroll-mt-20">
        <button
          onClick={() => setShowArtistSection(!showArtistSection)}
          className="w-full card-premium hover:border-electric-500/40 transition-all cursor-pointer"
        >
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-electric-500/10 border border-electric-500/30 rounded-full mb-4">
              <Mic2 className="w-4 h-4 text-electric-400" />
              <span className="text-electric-400 text-sm font-medium">Für Künstler & Bands</span>
            </div>
            <h2 className="mb-4">Deine Bühne, deine Chance</h2>
            <p className="text-gray-300 max-w-2xl mx-auto text-lg mb-4">
              Zeige dein Talent im professionellen Studio-Setup und sichere dir hochwertige Aufnahmen deiner Performance
            </p>
            <div className="flex items-center justify-center gap-2 text-electric-400">
              {showArtistSection ? (
                <>
                  <ChevronUp className="w-5 h-5" />
                  <span className="text-sm font-medium">Weniger anzeigen</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-5 h-5" />
                  <span className="text-sm font-medium">Mehr erfahren</span>
                </>
              )}
            </div>
          </div>
        </button>

        {showArtistSection && (
          <div className="space-y-8 animate-fade-in">

        <div className="relative overflow-hidden rounded-2xl mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95"></div>
          <img
            src="/artist-recording.webp"
            alt="Künstler im Studio"
            className="w-full h-64 object-cover opacity-40"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white text-2xl md:text-3xl font-bold text-center px-6">
              Professionelle Studio-Aufnahmen deiner Performance
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card-premium">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-electric-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-glow-electric">
                <Video className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h3 className="mb-2">Professionelle Video-Aufnahme</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Erhalte nach deiner Performance ein hochwertiges Video deines Auftritts.
                  Mit 5 Kamera-Perspektiven professionell geschnitten - perfekt für dein Portfolio.
                </p>
              </div>
            </div>
          </div>

          <div className="card-premium">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-electric-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-glow-electric">
                <Disc3 className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h3 className="mb-2">Studio-Audio-Recording</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Deine Performance in Studioqualität aufgenommen. Nutze die professionellen Audio-Aufnahmen
                  für deine Musik, Social Media oder zum Teilen mit Fans.
                </p>
              </div>
            </div>
          </div>

          <div className="card-premium">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-glow-electric">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="mb-2">Gewinner-Gutschein</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Der Gewinner erhält einen exklusiven Gutschein für eine Recording Session im Studio.
                  Produziere deinen nächsten Track in professioneller Umgebung.
                </p>
              </div>
            </div>
          </div>

          <div className="card-premium">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-electric-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-glow-electric">
                <TrendingUp className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h3 className="mb-2">Reichweite & Exposure</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Erreiche ein breites Publikum durch den Live-Stream und die Aufzeichnung.
                  Vernetze dich mit anderen Musikern und baue deine Fanbase aus.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-premium bg-gradient-to-br from-slate-800/50 to-slate-900/50">
          <h3 className="mb-6 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-cyan-400" />
            So funktioniert die Teilnahme
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/30">
                <span className="text-cyan-400 font-bold text-xl">1</span>
              </div>
              <h4 className="text-white mb-2">Bewerbung</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                Bewirb dich mit zwei Songs - einem für die Vorrunde und einem für das Finale.
                Das Team wählt die besten Acts aus.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/30">
                <span className="text-cyan-400 font-bold text-xl">2</span>
              </div>
              <h4 className="text-white mb-2">Vorrunde</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                In den Vorrunden treten jeweils 3 Acts an.
                Das Publikum bewertet live. Die Besten kommen weiter.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-electric-400 to-cyan-500 rounded-full flex items-center justify-center shadow-glow-electric">
                <span className="text-slate-950 font-bold text-xl">3</span>
              </div>
              <h4 className="text-white mb-2">Finale</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                Die Top-Acts performen ihre Finalsongs.
                Der Gewinner wird durch Publikumsvoting ermittelt.
              </p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-slate-900/50 rounded-xl border border-slate-700/50">
            <h4 className="text-white mb-4 flex items-center gap-2">
              <Music2 className="w-5 h-5 text-cyan-400" />
              Wichtige Infos für Teilnehmer
            </h4>
            <ul className="grid md:grid-cols-2 gap-3 text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>Zwei verschiedene Songs vorbereiten</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>Maximal 6 Minuten pro Song</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>Eigene Songs bevorzugt, Cover nach Absprache</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>Pünktlichkeit erforderlich</span>
              </li>
            </ul>
          </div>
        </div>
          </div>
        )}
      </section>

      <section id="zuschauer" className="space-y-12 scroll-mt-20">
        <button
          onClick={() => setShowAudienceSection(!showAudienceSection)}
          className="w-full card-premium hover:border-orange-500/40 transition-all cursor-pointer"
        >
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full mb-4">
              <Eye className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400 text-sm font-medium">Für Zuschauer</span>
            </div>
            <h2 className="mb-4">Sei live dabei und entscheide mit</h2>
            <p className="text-gray-300 max-w-2xl mx-auto text-lg mb-4">
              Erlebe spannende Live-Performances, interagiere mit den Moderatoren und bestimme mit deinem Vote,
              wer ins Finale einzieht
            </p>
            <div className="flex items-center justify-center gap-2 text-orange-400">
              {showAudienceSection ? (
                <>
                  <ChevronUp className="w-5 h-5" />
                  <span className="text-sm font-medium">Weniger anzeigen</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-5 h-5" />
                  <span className="text-sm font-medium">Mehr erfahren</span>
                </>
              )}
            </div>
          </div>
        </button>

        {showAudienceSection && (
          <div className="space-y-8 animate-fade-in">

        <div className="relative overflow-hidden rounded-2xl mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95"></div>
          <img
            src="/audience-voting.webp"
            alt="Publikum beim Voting"
            className="w-full h-64 object-cover opacity-40"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white text-2xl md:text-3xl font-bold text-center px-6">
              Live abstimmen und die Show mitgestalten
            </p>
          </div>
        </div>

        <div className="card-premium bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-orange-500/20">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-glow-electric">
                <Radio className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-3">Live Stream</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Verfolge die Show in Echtzeit mit professionellem 5-Kamera-Setup.
                Genieße Studioqualität-Sound direkt bei dir zuhause.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-glow-electric">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-3">Live-Voting</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Bewerte jede Performance mit 1-5 Sternen.
                Deine Stimme entscheidet, wer weiterkommt und wer gewinnt.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-glow-electric">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-3">Interaktive Show</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Zwei Moderatoren führen durch die Show und interagieren
                live mit dem Publikum über Screens.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-glow-electric">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-3">Überall dabei</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Schaue von jedem Gerät - Desktop, Tablet oder Smartphone.
                Verpasse keine Sekunde der Action.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card-premium">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-glow-electric">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="mb-2">Community werden</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Registriere dich kostenlos und werde Teil der Couch Slam Community.
                  Vernetze dich mit anderen Musikfans und entdecke neue Talente.
                </p>
              </div>
            </div>
          </div>

          <div className="card-premium">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-glow-electric">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="mb-2">Talente entdecken</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Sei dabei wenn neue Musiker durchstarten. Unterstütze deine Favoriten
                  und erlebe die nächste Generation live.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-premium bg-gradient-to-br from-slate-800/50 to-slate-900/50">
          <h3 className="mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-400" />
            So funktioniert das Voting
          </h3>
          <ul className="grid md:grid-cols-2 gap-4 text-gray-300">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <span>Bewertung mit 1-5 Sternen pro Performance</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <span>Voting-Phase wird nach jeder Runde geöffnet</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <span>Nur registrierte Nutzer können abstimmen</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <span>Eine Stimme pro Performance möglich</span>
            </li>
          </ul>
        </div>
          </div>
        )}
      </section>


      <section className="grid md:grid-cols-2 gap-6">
        <div className="card-premium text-center bg-gradient-to-br from-electric-500/10 to-cyan-500/10 border-electric-500/20">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-electric-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-glow-electric">
            <Mic2 className="w-8 h-8 text-slate-950" />
          </div>
          <h3 className="mb-3">Künstler werden</h3>
          <p className="text-gray-300 mb-6 leading-relaxed">
            Bewirb dich jetzt und sichere dir professionelle Studio-Aufnahmen deiner Performance.
          </p>
          <button
            onClick={() => {
              if (!user) {
                if (onShowAuth) {
                  onShowAuth();
                }
                return;
              }

              if (profile?.user_type !== 'artist') {
                if (hasOpenArtistRequest) {
                  showInfo('Deine Anfrage wurde eingereicht und wird gerade geprüft.');
                  return;
                }

                if (!artistRequestCreateUrlWithToken || !token) {
                  showError('Server nicht konfiguriert');
                  return;
                }

                setArtistRequestLoading(true);
                fetch(artistRequestCreateUrlWithToken, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({}),
                })
                  .then(async (res) => {
                    const data = (await res.json()) as any;
                    if (!res.ok || !data?.ok) {
                      throw new Error(data?.error || 'Request failed');
                    }
                    setHasOpenArtistRequest(true);
                    showInfo('Anfrage eingereicht – sie wird jetzt geprüft.');
                  })
                  .catch((e: any) => {
                    showError(e?.message || 'Fehler beim Senden der Anfrage');
                  })
                  .finally(() => {
                    setArtistRequestLoading(false);
                  });
                return;
              }

              if (onNavigate) {
                onNavigate('dashboard');
                return;
              }

              window.location.hash = 'dashboard';
            }}
            className="btn-primary w-full"
            disabled={artistRequestLoading || (Boolean(user) && profile?.user_type !== 'artist' && hasOpenArtistRequest)}
          >
            {!user
              ? 'Jetzt bewerben'
              : profile?.user_type === 'artist'
                ? 'Zum Dashboard'
                : hasOpenArtistRequest
                  ? 'Anfrage wird geprüft'
                  : 'Jetzt bewerben'}
          </button>
        </div>

        <div className="card-premium text-center bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-glow-electric">
            <Eye className="w-8 h-8 text-white" />
          </div>
          <h3 className="mb-3">Zuschauer werden</h3>
          <p className="text-gray-300 mb-6 leading-relaxed">
            Registriere dich kostenlos und werde Teil der Community. Entdecke neue Talente live.
          </p>
          <button
            onClick={() => {
              if (onNavigate) {
                onNavigate('artists');
              }
            }}
            className="btn-secondary w-full"
          >
            Nächste Events ansehen
          </button>
        </div>
      </section>
    </div>
  );
}
