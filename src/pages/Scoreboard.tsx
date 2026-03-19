import { useEffect, useState } from 'react';
import { Event, Performance, Artist, Round } from '../lib/types';
import { useLanguage } from '../contexts/LanguageContext';
import { Trophy, Medal, Music, TrendingUp, Target, Crown } from 'lucide-react';

type PerformanceWithArtist = Performance & { artist: Artist };

export function Scoreboard() {
  const { t } = useLanguage();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [performances, setPerformances] = useState<PerformanceWithArtist[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);

  const serverBaseUrl = (import.meta.env.VITE_SERVER_BASE_URL as string | undefined) || '';
  const eventsPublicListUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/events_public_list.php` : '';
  const roundsPublicListUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/rounds_public_list.php` : '';
  const performancesPublicListUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/performances_public_list.php` : '';

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;

    void loadPerformances(selectedEvent.id);
    void loadRounds(selectedEvent.id);

    const timer = window.setInterval(() => {
      void loadPerformances(selectedEvent.id);
      void loadRounds(selectedEvent.id);
    }, 3000);

    return () => {
      window.clearInterval(timer);
    };
  }, [selectedEvent?.id]);

  const loadEvents = async () => {
    try {
      if (!eventsPublicListUrl) {
        throw new Error('Missing VITE_SERVER_BASE_URL');
      }

      const res = await fetch(`${eventsPublicListUrl}?includeArchived=0`, { method: 'GET' });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to load events');
      }

      const list = Array.isArray(json.events) ? (json.events as Event[]) : [];
      setEvents(list);

      const liveEvent = list.find((e) => e.is_live);
      if (liveEvent) {
        setSelectedEvent(liveEvent);
        await loadPerformances(liveEvent.id);
        await loadRounds(liveEvent.id);
      } else if (list.length > 0) {
        setSelectedEvent(list[0]);
        await loadPerformances(list[0].id);
        await loadRounds(list[0].id);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRounds = async (eventId: string) => {
    try {
      if (!roundsPublicListUrl) {
        throw new Error('Missing VITE_SERVER_BASE_URL');
      }

      const url = `${roundsPublicListUrl}?event_id=${encodeURIComponent(eventId)}`;
      const res = await fetch(url, { method: 'GET' });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to load rounds');
      }

      setRounds(Array.isArray(json.rounds) ? json.rounds : []);
    } catch (error) {
      console.error('Error loading rounds:', error);
    }
  };

  const loadPerformances = async (eventId: string) => {
    try {
      if (!performancesPublicListUrl) {
        throw new Error('Missing VITE_SERVER_BASE_URL');
      }

      const url = `${performancesPublicListUrl}?event_id=${encodeURIComponent(eventId)}`;
      const res = await fetch(url, { method: 'GET' });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to load performances');
      }

      const list = Array.isArray(json.performances) ? (json.performances as PerformanceWithArtist[]) : [];
      list.sort((a, b) => b.total_votes - a.total_votes);
      setPerformances(list);
    } catch (error) {
      console.error('Error loading performances:', error);
    }
  };

  const getRoundPerformances = (roundId: string) => {
    return performances
      .filter((p) => p.round_id === roundId)
      .sort((a, b) => b.total_votes - a.total_votes);
  };

  const getRankIcon = (index: number, roundType: 'preliminary' | 'final') => {
    void roundType;
    if (index === 0) return <Medal className="w-7 h-7 text-yellow-400" />;
    if (index === 1) return <Medal className="w-7 h-7 text-gray-300" />;
    if (index === 2) return <Medal className="w-7 h-7 text-amber-600" />;
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-electric-400 to-cyan-500 rounded-2xl mx-auto mb-6 animate-pulse shadow-glow-electric" />
          <p className="text-white text-lg font-semibold">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-6">
        <div className="badge-primary mx-auto">
          <Trophy className="w-4 h-4" />
          Leaderboard
        </div>
        <div className="flex items-center justify-center gap-4">
          <h1 className="text-gradient-electric">{t.scoreboard.title}</h1>
          <TrendingUp className="w-10 h-10 text-cyan-400" />
        </div>
        <p className="text-gray-400 max-w-2xl mx-auto">{t.scoreboard.subtitle}</p>
      </div>

      {events.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide justify-center">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => {
                setSelectedEvent(event);
                loadPerformances(event.id);
                loadRounds(event.id);
              }}
              className={`px-6 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
                selectedEvent?.id === event.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-electric-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'glass text-gray-300 border border-white/10 hover:border-cyan-500/30 hover:text-cyan-300'
              }`}
            >
              {event.is_live && <span className="inline-block w-2 h-2 bg-neon-400 rounded-full mr-2 animate-pulse" />}
              {event.title}
            </button>
          ))}
        </div>
      )}

      {selectedEvent && (
        <div className="card-premium text-center">
          <h2 className="mb-2">{selectedEvent.title}</h2>
          <p className="text-cyan-400 font-semibold">{new Date(selectedEvent.event_date).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      )}

      {rounds.length === 0 || performances.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-electric-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-cyan-500/30">
            <Trophy className="w-10 h-10 text-cyan-400" />
          </div>
          <h3 className="mb-4">{t.scoreboard.noPerformances}</h3>
          <p className="text-gray-400">{t.scoreboard.noPerformancesDesc}</p>
        </div>
      ) : (
        <div className="space-y-12">
          {rounds.map((round, roundIndex) => {
            const roundPerformances = getRoundPerformances(round.id);
            if (roundPerformances.length === 0) return null;

            return (
              <div key={round.id} className="space-y-6">
                <div className="card-premium">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        round.round_type === 'final'
                          ? 'bg-gradient-to-br from-electric-400 to-cyan-500 shadow-glow-electric'
                          : 'bg-gradient-to-br from-cyan-500/20 to-electric-500/20 border border-cyan-500/30'
                      }`}>
                        {round.round_type === 'final' ? (
                          <Trophy className="w-6 h-6 text-slate-950" />
                        ) : (
                          <Target className="w-6 h-6 text-cyan-400" />
                        )}
                      </div>
                      <h3>
                        {t.scoreboard.round} {round.round_number}
                        {round.round_type === 'final' && ` - ${t.scoreboard.final}`}
                      </h3>
                    </div>
                    <span
                      className={`text-xs font-bold px-4 py-2 rounded-lg whitespace-nowrap ${
                        round.status === 'active'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : round.status === 'completed'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'glass text-gray-400 border border-white/10'
                      }`}
                    >
                      {round.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {roundPerformances.map((performance, index) => (
                    <div
                      key={performance.id}
                      className={`card-premium spotlight-effect relative overflow-hidden animate-slide-up ${
                        index === 0 && round.round_type === 'final'
                          ? 'border-cyan-500/50 shadow-glow-electric'
                          : ''
                      }`}
                      style={{ animationDelay: `${(roundIndex * 100) + (index * 50)}ms` }}
                    >
                      {index === 0 && round.round_type === 'final' && (
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-electric-500/10 rounded-full blur-3xl" />
                      )}
                      <div className="relative space-y-3">
                        <div className="flex items-center gap-4 min-w-0">
                          {performance.artist.photo_url ? (
                            <div className="relative flex-shrink-0">
                              <img
                                src={performance.artist.photo_url}
                                alt={performance.artist.name}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-md"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-electric-500/10 to-transparent rounded-2xl pointer-events-none" />
                            </div>
                          ) : (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-electric-500/30 via-cyan-500/20 to-neon-600/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                              <Music className="w-9 h-9 sm:w-10 sm:h-10 text-cyan-400/50" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h4 className="text-white text-base sm:text-lg leading-tight break-words">
                                {performance.artist.name}
                              </h4>
                              {performance.advanced_to_final && round.round_type === 'preliminary' && (
                                <span className="text-xs px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30 flex items-center gap-1 font-bold uppercase">
                                  <Trophy className="w-3 h-3" />
                                  Finalist
                                </span>
                              )}
                              {index === 0 && round.round_type === 'final' && (
                                <span className="text-xs px-3 py-1 bg-gradient-to-r from-electric-500/30 to-cyan-500/30 text-cyan-300 rounded-lg border border-cyan-500/50 flex items-center gap-1 font-bold shadow-glow-sm uppercase">
                                  <Crown className="w-3 h-3" />
                                  Winner
                                </span>
                              )}
                            </div>
                            <p className="text-cyan-400 font-semibold text-sm sm:text-base leading-snug break-words">"{performance.song_title}"</p>
                            {performance.artist.city && (
                              <p className="text-sm text-gray-400">{performance.artist.city}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="inline-flex h-10 items-center gap-2 px-3 rounded-2xl border border-white/15 bg-white/[0.03]">
                            {getRankIcon(index, round.round_type) || (
                              <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                            )}
                            <span className="text-xs font-bold tracking-wide text-gray-200">
                              {index === 0 ? '1. Platz' : index === 1 ? '2. Platz' : index === 2 ? '3. Platz' : `${index + 1}. Platz`}
                            </span>
                          </div>

                          <div className="inline-flex h-10 items-center justify-center gap-2 px-3 rounded-2xl border border-white/15 bg-white/[0.03]">
                            <span className="font-display text-2xl font-bold leading-none text-gradient-electric">
                              {performance.total_votes}
                            </span>
                            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider leading-none">
                              Punkte
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
