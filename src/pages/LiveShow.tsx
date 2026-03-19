import { useEffect, useState } from 'react';
import { Event, Performance, Artist, ShowState, Vote, Round } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { getYouTubeEmbedUrl } from '../lib/youtube';
import { Star, Music, MapPin, Radio, Target, Trophy, Clock, ChevronDown, ChevronUp, CheckCircle2, PlayCircle, Clock3 } from 'lucide-react';
import { YouTubeBonusActions } from '../components/YouTubeBonusActions';

type PerformanceWithArtist = Performance & { artist: Artist };

interface LiveShowProps {
  onLoginRequired?: () => void;
}

export function LiveShow({ onLoginRequired }: LiveShowProps = {}) {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const { showSuccess, showError } = useToast();
  const [liveEvent, setLiveEvent] = useState<Event | null>(null);
  const [showState, setShowState] = useState<ShowState | null>(null);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [currentPerformance, setCurrentPerformance] = useState<PerformanceWithArtist | null>(null);
  const [roundPerformances, setRoundPerformances] = useState<PerformanceWithArtist[]>([]);
  const [userVotes, setUserVotes] = useState<Map<string, Vote>>(new Map());
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [votingPowerExpanded, setVotingPowerExpanded] = useState(false);

  const serverBaseUrl = (import.meta.env.VITE_SERVER_BASE_URL as string | undefined) || '';
  const eventsLiveUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/events_live.php` : '';
  const showStateGetUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/show_state_get.php` : '';
  const roundsGetUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/rounds_get.php` : '';
  const roundsPublicListUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/rounds_public_list.php` : '';
  const performancesGetUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/performances_get.php` : '';
  const performancesPublicListUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/performances_public_list.php` : '';

  const votesListUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/votes_list.php` : '';
  const votesUpsertUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/votes_upsert.php` : '';
  const votingMultiplierUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/voting_multiplier_get.php` : '';

  const votesListUrlWithToken = votesListUrl && token ? `${votesListUrl}?token=${encodeURIComponent(token)}` : votesListUrl;
  const votesUpsertUrlWithToken = votesUpsertUrl && token ? `${votesUpsertUrl}?token=${encodeURIComponent(token)}` : votesUpsertUrl;
  const votingMultiplierUrlWithToken = votingMultiplierUrl && token ? `${votingMultiplierUrl}?token=${encodeURIComponent(token)}` : votingMultiplierUrl;

  useEffect(() => {
    void loadLiveEvent();

    const timer = window.setInterval(() => {
      void loadLiveEvent();
    }, 3000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const loadLiveEvent = async () => {
    try {
      if (!eventsLiveUrl) {
        throw new Error('Missing VITE_SERVER_BASE_URL');
      }

      const res = await fetch(eventsLiveUrl, { method: 'GET' });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to load live event');
      }

      const event = (json.event as Event | null) || null;
      setLiveEvent(event);

      if (event) {
        await loadShowState(event.id);
      } else {
        setShowState(null);
        setCurrentRound(null);
        setCurrentPerformance(null);
        setRoundPerformances([]);
        setUserVotes(new Map());
      }
    } catch (error) {
      console.error('Error loading live event:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadShowState = async (eventId: string) => {
    try {
      if (!showStateGetUrl) {
        throw new Error('Missing VITE_SERVER_BASE_URL');
      }

      const url = `${showStateGetUrl}?event_id=${encodeURIComponent(eventId)}`;
      const res = await fetch(url, { method: 'GET' });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to load show state');
      }

      const data = (json.show_state as ShowState | null) || null;
      setShowState(data);

      const effectiveRoundId = data?.current_round_id || (await getEffectiveRoundIdForEvent(eventId));

      if (effectiveRoundId) {
        await loadCurrentRound(effectiveRoundId);
        if (user && liveEvent) {
          await loadUserVote(liveEvent.id, effectiveRoundId);
        }
      } else {
        setCurrentRound(null);
        await loadEventPerformances(eventId);
        setUserVotes(new Map());
      }

      if (data?.current_performance_id) {
        await loadCurrentPerformance(data.current_performance_id);
      } else {
        setCurrentPerformance(null);
      }
    } catch (error) {
      console.error('Error loading show state:', error);
    }
  };

  const getEffectiveRoundIdForEvent = async (eventId: string): Promise<string | null> => {
    try {
      if (!roundsPublicListUrl) return null;

      const url = `${roundsPublicListUrl}?event_id=${encodeURIComponent(eventId)}`;
      const res = await fetch(url, { method: 'GET' });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) return null;

      const rounds = (Array.isArray(json.rounds) ? json.rounds : []) as Round[];
      if (rounds.length === 0) return null;

      const active = rounds.find((r) => String((r as any).status || '') === 'active');
      if (active?.id) return active.id;

      const byNumber = [...rounds].sort((a, b) => (a.round_number || 0) - (b.round_number || 0));
      const last = byNumber[byNumber.length - 1];
      return last?.id || null;
    } catch (e) {
      return null;
    }
  };

  const loadCurrentRound = async (roundId: string) => {
    try {
      if (!roundsGetUrl) {
        throw new Error('Missing VITE_SERVER_BASE_URL');
      }

      const url = `${roundsGetUrl}?id=${encodeURIComponent(roundId)}`;
      const res = await fetch(url, { method: 'GET' });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to load round');
      }

      const data = (json.round as Round | null) || null;
      setCurrentRound(data);
      if (data) {
        await loadRoundPerformances(data.id);
      } else {
        setRoundPerformances([]);
      }
    } catch (error) {
      console.error('Error loading current round:', error);
    }
  };

  const loadEventPerformances = async (eventId: string) => {
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

      setRoundPerformances(Array.isArray(json.performances) ? json.performances : []);
    } catch (error) {
      console.error('Error loading event performances:', error);
    }
  };

  const loadRoundPerformances = async (roundId: string) => {
    try {
      if (!performancesPublicListUrl) {
        throw new Error('Missing VITE_SERVER_BASE_URL');
      }

      const url = `${performancesPublicListUrl}?round_id=${encodeURIComponent(roundId)}`;
      const res = await fetch(url, { method: 'GET' });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to load performances');
      }

      setRoundPerformances(Array.isArray(json.performances) ? json.performances : []);
    } catch (error) {
      console.error('Error loading round performances:', error);
    }
  };

  const loadCurrentPerformance = async (performanceId: string) => {
    try {
      if (!performancesGetUrl) {
        throw new Error('Missing VITE_SERVER_BASE_URL');
      }

      const url = `${performancesGetUrl}?id=${encodeURIComponent(performanceId)}`;
      const res = await fetch(url, { method: 'GET' });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to load performance');
      }

      setCurrentPerformance((json.performance as PerformanceWithArtist | null) || null);
    } catch (error) {
      console.error('Error loading current performance:', error);
    }
  };

  const loadUserVote = async (eventId: string, roundId: string) => {
    if (!user) {
      setUserVotes(new Map());
      return;
    }

    try {
      if (!votesListUrlWithToken) {
        setUserVotes(new Map());
        return;
      }

      const url = `${votesListUrlWithToken}${votesListUrlWithToken.includes('?') ? '&' : '?'}event_id=${encodeURIComponent(eventId)}&round_id=${encodeURIComponent(roundId)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to load votes');
      }

      const votesMap = new Map<string, Vote>();
      (Array.isArray(json.votes) ? json.votes : []).forEach((vote: Vote) => {
        votesMap.set(vote.performance_id, vote);
      });
      setUserVotes(votesMap);
    } catch (error) {
      console.error('Error loading user votes:', error);
    }
  };

  const handleVote = async (performanceId: string, baseRating: number) => {
    if (!user) {
      onLoginRequired?.();
      return;
    }

    const effectiveRoundId = showState?.current_round_id || currentRound?.id;
    if (!liveEvent || !showState?.voting_open || !effectiveRoundId) return;

    setVoting(true);
    try {
      let multiplier = 1.0;
      if (votingMultiplierUrlWithToken) {
        const url = `${votingMultiplierUrlWithToken}${votingMultiplierUrlWithToken.includes('?') ? '&' : '?'}event_id=${encodeURIComponent(liveEvent.id)}`;
        const mRes = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const mJson = (await mRes.json()) as any;
        if (mRes.ok && mJson?.ok) {
          multiplier = typeof mJson.multiplier === 'number' ? mJson.multiplier : parseFloat(String(mJson.multiplier || '1'));
        }
      }

      const weightedVote = Math.round(baseRating * multiplier * 10) / 10;

      if (!votesUpsertUrlWithToken) {
        throw new Error('Missing VITE_SERVER_BASE_URL');
      }

      const res = await fetch(votesUpsertUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          event_id: liveEvent.id,
          round_id: effectiveRoundId,
          performance_id: performanceId,
          base_rating: baseRating,
          multiplier,
          weighted_vote: weightedVote,
        }),
      });

      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to vote');
      }

      await loadUserVote(liveEvent.id, effectiveRoundId);
      await loadRoundPerformances(effectiveRoundId);

      if (multiplier > 1.0) {
        showSuccess(`Stimme erfolgreich abgegeben! Bonus: ${((multiplier - 1) * 100).toFixed(0)}%`);
      } else {
        showSuccess('Stimme erfolgreich abgegeben!');
      }
    } catch (error: any) {
      console.error('Error voting:', error);
      showError(error.message || 'Fehler beim Abstimmen. Bitte versuche es erneut.');
    } finally {
      setVoting(false);
    }
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

  if (!liveEvent) {
    return (
      <div className="text-center py-24">
        <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-electric-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-cyan-500/30">
          <Radio className="w-10 h-10 text-cyan-400" />
        </div>
        <h2 className="mb-4">{t.liveShow.noLiveEvent}</h2>
        <p className="text-gray-400">{t.liveShow.checkBackSoon}</p>
      </div>
    );
  }

  const isVotingPhase = showState?.voting_open && !currentPerformance && roundPerformances.length > 0;

  const completedPerformances = roundPerformances.filter(
    (p) => currentPerformance && p.performance_order < currentPerformance.performance_order
  );
  const upcomingPerformances = currentPerformance
    ? roundPerformances.filter((p) => p.performance_order > currentPerformance.performance_order)
    : roundPerformances;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="card-premium spotlight-effect relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/15 to-electric-500/5 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="badge-live">
              <div className="w-2 h-2 bg-neon-400 rounded-full animate-pulse" />
              {t.liveShow.liveNow}
            </div>
            {currentRound && (
              <div className="badge-primary">
                {currentRound.round_type === 'final' ? (
                  <Trophy className="w-4 h-4" />
                ) : (
                  <Target className="w-4 h-4" />
                )}
                {t.liveShow.round} {currentRound.round_number}
                {currentRound.round_type === 'final' && ` - ${t.liveShow.final}`}
              </div>
            )}
          </div>
          <h1 className="text-gradient-electric mb-4">{liveEvent.title}</h1>
          <p className="text-gray-300 text-lg">{liveEvent.description}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {liveEvent.stream_url ? (
            <div className="bg-black rounded-2xl overflow-hidden aspect-video border border-white/10">
              <iframe
                src={getYouTubeEmbedUrl(liveEvent.stream_url)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="card-premium aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-electric-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-cyan-500/30">
                  <Music className="w-10 h-10 text-cyan-400" />
                </div>
                <p className="text-gray-300 text-lg">{t.liveShow.streamStartsSoon}</p>
              </div>
            </div>
          )}

          {liveEvent.youtube_video_id && (
            <div className="card-premium">
              <button
                onClick={() => setVotingPowerExpanded(!votingPowerExpanded)}
                className="w-full flex items-center justify-between mb-4"
              >
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-semibold text-white">Voting Power Bonus</h3>
                </div>
                {votingPowerExpanded ? (
                  <ChevronUp className="w-5 h-5 text-cyan-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-cyan-400" />
                )}
              </button>
              {votingPowerExpanded && (
                <div className="animate-slide-down">
                  <YouTubeBonusActions
                    eventId={liveEvent.id}
                    videoId={liveEvent.youtube_video_id}
                    channelUrl="https://www.youtube.com/@tonbandleipzig"
                  />
                </div>
              )}
            </div>
          )}

          {isVotingPhase ? (
            <div className="card-premium spotlight-effect border-2 border-cyan-500/50">
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-electric-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-glow-lg">
                  <Star className="w-10 h-10 text-white" />
                </div>
                <div className="badge-primary mb-4 inline-flex">
                  <Star className="w-4 h-4" />
                  {t.liveShow.votingPhase}
                </div>
                <h3 className="mb-3">{t.liveShow.votingInProgress}</h3>
                <p className="text-gray-300 text-lg">{t.liveShow.votingPhaseDesc}</p>
              </div>
            </div>
          ) : currentPerformance ? (
            <div className="card-premium spotlight-effect border-2 border-cyan-500/50">
              <div className="flex items-start gap-6">
                <div className="relative flex-shrink-0">
                  {currentPerformance.artist.photo_url ? (
                    <img
                      src={currentPerformance.artist.photo_url}
                      alt={currentPerformance.artist.name}
                      className="w-28 h-28 rounded-xl object-cover shadow-glow-md"
                    />
                  ) : (
                    <div className="w-28 h-28 bg-gradient-to-br from-electric-500/30 via-cyan-500/20 to-neon-600/30 rounded-xl flex items-center justify-center shadow-glow-md">
                      <Music className="w-14 h-14 text-cyan-400/50" />
                    </div>
                  )}
                  <div className="absolute -top-2 -right-2 bg-gradient-to-br from-cyan-500 to-electric-500 rounded-full p-2 shadow-glow-md animate-pulse">
                    <PlayCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="badge-primary mb-4">
                    <PlayCircle className="w-4 h-4" />
                    Jetzt Live
                  </div>
                  <h3 className="mb-2">{currentPerformance.artist.name}</h3>
                  <p className="text-cyan-400 font-semibold text-lg mb-4">
                    "{currentPerformance.song_title}"
                  </p>
                  <div className="flex flex-wrap gap-4 text-gray-400 text-sm mb-4">
                    {currentPerformance.artist.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        <span>{currentPerformance.artist.city}</span>
                      </div>
                    )}
                    {currentPerformance.artist.genre && (
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-cyan-400" />
                        <span>{currentPerformance.artist.genre}</span>
                      </div>
                    )}
                  </div>
                  {currentPerformance.artist.bio && (
                    <p className="text-gray-300 text-sm leading-relaxed">{currentPerformance.artist.bio}</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          {roundPerformances.length > 0 ? (
            <div className="card-premium relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-cyan-500/10 to-electric-500/5 rounded-full blur-3xl" />
              <div className="relative">
                <div className="mb-6">
                  {showState?.voting_open ? (
                    <>
                      <div className="badge-primary mb-4">
                        <Star className="w-4 h-4" />
                        {isVotingPhase ? t.liveShow.votingPhase : 'Vote Now'}
                      </div>
                      <h3 className="mb-3">{t.liveShow.ratePerformances}</h3>
                      <p className="text-gray-400 mb-6 text-sm">{t.liveShow.rateWithStars}</p>
                    </>
                  ) : (
                    <>
                      <div className="badge mb-4 bg-slate-700/50 text-gray-300 border-slate-600/50">
                        <Music className="w-4 h-4" />
                        Show Lineup
                      </div>
                      <h3 className="mb-3">Künstler Lineup</h3>
                      <p className="text-gray-400 mb-6 text-sm">Verfolge die Reihenfolge der Auftritte</p>
                    </>
                  )}
                </div>

                <div className="space-y-6">
                  {isVotingPhase ? (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 text-cyan-400 animate-pulse" />
                        <h4 className="text-sm font-semibold text-cyan-400">{t.liveShow.allPerformances}</h4>
                      </div>
                      <div className="space-y-3">
                        {roundPerformances.map((perf) => {
                          const userRating = userVotes.get(perf.id)?.base_rating || 0;
                          return (
                            <div
                              key={perf.id}
                              className="glass rounded-xl p-4 border-2 border-cyan-500/50 bg-cyan-500/10"
                            >
                              <div className="flex items-center gap-3 mb-3">
                                {perf.artist.photo_url ? (
                                  <img
                                    src={perf.artist.photo_url}
                                    alt={perf.artist.name}
                                    className="w-10 h-10 rounded-lg object-cover shadow-md"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gradient-to-br from-electric-500/30 via-cyan-500/20 to-neon-600/30 rounded-lg flex items-center justify-center">
                                    <Music className="w-5 h-5 text-cyan-400/50" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-white text-sm truncate">{perf.artist.name}</p>
                                  <p className="text-cyan-400 text-xs truncate">"{perf.song_title}"</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    onClick={() => handleVote(perf.id, star)}
                                    disabled={voting}
                                    className="transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-110 active:scale-95"
                                  >
                                    <Star
                                      className={`w-7 h-7 transition-all duration-200 ${
                                        star <= userRating
                                          ? 'fill-cyan-400 text-cyan-400 drop-shadow-glow-sm'
                                          : 'text-slate-700 hover:text-cyan-400/50'
                                      }`}
                                    />
                                  </button>
                                ))}
                                {userRating > 0 && (
                                  <div className="ml-2 px-2 py-1 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
                                    <span className="text-cyan-400 font-bold text-xs">
                                      {userRating}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <>
                      {completedPerformances.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            <h4 className="text-sm font-semibold text-gray-400">Bereits aufgetreten</h4>
                          </div>
                          <div className="space-y-3">
                            {completedPerformances.map((perf) => {
                              const userRating = userVotes.get(perf.id)?.base_rating || 0;
                              return (
                                <div
                                  key={perf.id}
                                  className="glass rounded-xl p-4 border border-green-500/20 bg-green-500/5"
                                >
                                  <div className="flex items-center gap-3 mb-3">
                                    {perf.artist.photo_url ? (
                                      <img
                                        src={perf.artist.photo_url}
                                        alt={perf.artist.name}
                                        className="w-10 h-10 rounded-lg object-cover shadow-md opacity-80"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-gradient-to-br from-electric-500/30 via-cyan-500/20 to-neon-600/30 rounded-lg flex items-center justify-center opacity-80">
                                        <Music className="w-5 h-5 text-cyan-400/50" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-white text-sm truncate">{perf.artist.name}</p>
                                      <p className="text-cyan-400 text-xs truncate">"{perf.song_title}"</p>
                                    </div>
                                  </div>
                                  {showState?.voting_open && (
                                    <div className="flex items-center gap-2">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          onClick={() => handleVote(perf.id, star)}
                                          disabled={voting}
                                          className="transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-110 active:scale-95"
                                        >
                                          <Star
                                            className={`w-7 h-7 transition-all duration-200 ${
                                              star <= userRating
                                                ? 'fill-cyan-400 text-cyan-400 drop-shadow-glow-sm'
                                                : 'text-slate-700 hover:text-cyan-400/50'
                                            }`}
                                          />
                                        </button>
                                      ))}
                                      {userRating > 0 && (
                                        <div className="ml-2 px-2 py-1 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
                                          <span className="text-cyan-400 font-bold text-xs">
                                            {userRating}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {currentPerformance && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <PlayCircle className="w-4 h-4 text-cyan-400 animate-pulse" />
                            <h4 className="text-sm font-semibold text-cyan-400">Jetzt Live</h4>
                          </div>
                          <div className="glass rounded-xl p-5 border-2 border-cyan-500/50 bg-cyan-500/10">
                            <div className="flex items-center gap-4 mb-4">
                              {currentPerformance.artist.photo_url ? (
                                <img
                                  src={currentPerformance.artist.photo_url}
                                  alt={currentPerformance.artist.name}
                                  className="w-12 h-12 rounded-lg object-cover shadow-md ring-2 ring-cyan-500/50"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gradient-to-br from-electric-500/30 via-cyan-500/20 to-neon-600/30 rounded-lg flex items-center justify-center ring-2 ring-cyan-500/50">
                                  <Music className="w-6 h-6 text-cyan-400/50" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white truncate">{currentPerformance.artist.name}</p>
                                <p className="text-cyan-400 text-sm truncate">"{currentPerformance.song_title}"</p>
                              </div>
                            </div>
                            {showState?.voting_open && (
                              <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => {
                                  const userRating = userVotes.get(currentPerformance.id)?.base_rating || 0;
                                  return (
                                    <button
                                      key={star}
                                      onClick={() => handleVote(currentPerformance.id, star)}
                                      disabled={voting}
                                      className="transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-110 active:scale-95"
                                    >
                                      <Star
                                        className={`w-8 h-8 transition-all duration-200 ${
                                          star <= userRating
                                            ? 'fill-cyan-400 text-cyan-400 drop-shadow-glow-sm'
                                            : 'text-slate-700 hover:text-cyan-400/50'
                                        }`}
                                      />
                                    </button>
                                  );
                                })}
                                {userVotes.get(currentPerformance.id)?.base_rating && (
                                  <div className="ml-2 px-3 py-1.5 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
                                    <span className="text-cyan-400 font-bold text-xs">
                                      {userVotes.get(currentPerformance.id)?.base_rating}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {upcomingPerformances.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Clock3 className="w-4 h-4 text-gray-400" />
                            <h4 className="text-sm font-semibold text-gray-400">Als nächstes</h4>
                          </div>
                          <div className="space-y-3">
                            {upcomingPerformances.map((perf) => (
                              <div
                                key={perf.id}
                                className="glass rounded-xl p-4 border border-white/10 opacity-60"
                              >
                                <div className="flex items-center gap-3">
                                  {perf.artist.photo_url ? (
                                    <img
                                      src={perf.artist.photo_url}
                                      alt={perf.artist.name}
                                      className="w-10 h-10 rounded-lg object-cover shadow-md"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-gradient-to-br from-electric-500/30 via-cyan-500/20 to-neon-600/30 rounded-lg flex items-center justify-center">
                                      <Music className="w-5 h-5 text-cyan-400/50" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-white text-sm truncate">{perf.artist.name}</p>
                                    <p className="text-cyan-400 text-xs truncate">"{perf.song_title}"</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            !showState?.voting_open && (
              <div className="card-premium text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-electric-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
                  <Clock className="w-8 h-8 text-cyan-400" />
                </div>
                <p className="text-gray-300 text-lg">
                  {currentPerformance ? t.liveShow.enjoyPerformance : t.liveShow.votingClosed}
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
