import { useState, useEffect } from 'react';
import { Round, Artist, Performance } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Users, Plus, X, Music, AlertCircle } from 'lucide-react';

interface RoundArtistAssignmentProps {
  eventId: string;
  rounds: Round[];
  performances: Performance[];
  onUpdate: () => void;
}

interface ArtistWithPerformance extends Artist {
  acceptedApplication?: {
    id: string;
    preliminary_song_title: string;
    final_song_title: string;
  };
}

export function RoundArtistAssignment({ eventId, rounds, performances, onUpdate }: RoundArtistAssignmentProps) {
  const { token } = useAuth();
  const [acceptedArtists, setAcceptedArtists] = useState<ArtistWithPerformance[]>([]);
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);

  const serverBaseUrl = (import.meta.env.VITE_SERVER_BASE_URL as string | undefined) || '';
  const acceptedArtistsUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/accepted_artists_list.php` : '';
  const performancesCreateUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/performances_create.php` : '';
  const performancesDeleteUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/performances_delete.php` : '';

  const acceptedArtistsUrlWithToken = acceptedArtistsUrl && token ? `${acceptedArtistsUrl}?token=${encodeURIComponent(token)}` : acceptedArtistsUrl;
  const performancesCreateUrlWithToken = performancesCreateUrl && token ? `${performancesCreateUrl}?token=${encodeURIComponent(token)}` : performancesCreateUrl;
  const performancesDeleteUrlWithToken = performancesDeleteUrl && token ? `${performancesDeleteUrl}?token=${encodeURIComponent(token)}` : performancesDeleteUrl;

  useEffect(() => {
    loadAcceptedArtists();
  }, [eventId]);

  useEffect(() => {
    if (rounds.length > 0 && !selectedRound) {
      setSelectedRound(rounds[0]);
    }
  }, [rounds]);

  const loadAcceptedArtists = async () => {
    try {
      if (!acceptedArtistsUrlWithToken) {
        throw new Error('Missing VITE_SERVER_BASE_URL');
      }

      const url = `${acceptedArtistsUrlWithToken}${acceptedArtistsUrlWithToken.includes('?') ? '&' : '?'}event_id=${encodeURIComponent(eventId)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to load accepted artists');
      }

      setAcceptedArtists(Array.isArray(json.artists) ? json.artists : []);
    } catch (error) {
      console.error('Error loading accepted artists:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformancesForRound = (roundId: string) => {
    return performances.filter(p => p.round_id === roundId);
  };

  const isArtistInRound = (artistId: string, roundId: string) => {
    return performances.some(p => p.artist_id === artistId && p.round_id === roundId);
  };

  const handleAssignArtist = async (artistId: string, preliminarySong: string, finalSong: string) => {
    if (!selectedRound) return;

    const currentPerformances = getPerformancesForRound(selectedRound.id);
    if (currentPerformances.length >= 3) {
      alert('Maximum 3 artists per round!');
      return;
    }

    if (isArtistInRound(artistId, selectedRound.id)) {
      alert('Artist already assigned to this round');
      return;
    }

    const songTitle = selectedRound.round_type === 'final' ? finalSong : preliminarySong;

    try {
      if (!performancesCreateUrlWithToken) {
        throw new Error('Missing VITE_SERVER_BASE_URL');
      }

      const res = await fetch(performancesCreateUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          event_id: eventId,
          artist_id: artistId,
          round_id: selectedRound.id,
          song_title: songTitle,
          performance_order: currentPerformances.length,
        }),
      });

      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to assign artist');
      }

      onUpdate();
    } catch (error: any) {
      console.error('Error assigning artist:', error);
      alert(error.message || 'Failed to assign artist');
    }
  };

  const handleRemoveArtist = async (performanceId: string) => {
    if (!confirm('Remove this artist from the round?')) return;

    try {
      if (!performancesDeleteUrlWithToken) {
        throw new Error('Missing VITE_SERVER_BASE_URL');
      }

      const res = await fetch(performancesDeleteUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: performanceId }),
      });

      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to remove artist');
      }

      onUpdate();
    } catch (error: any) {
      console.error('Error removing artist:', error);
      alert(error.message || 'Failed to remove artist');
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
        <p className="text-gray-400">Please create rounds first</p>
      </div>
    );
  }

  if (acceptedArtists.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
        <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No accepted artists for this event</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-6 h-6" />
          Round Artist Assignment
        </h3>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {rounds.map((round) => {
            const roundPerformances = getPerformancesForRound(round.id);
            return (
              <button
                key={round.id}
                onClick={() => setSelectedRound(round)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedRound?.id === round.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                }`}
              >
                Round {round.round_number}
                {round.round_type === 'final' && ' (Final)'}
                <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                  roundPerformances.length >= 3
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-gray-600 text-gray-300'
                }`}>
                  {roundPerformances.length}/3
                </span>
              </button>
            );
          })}
        </div>

        {selectedRound && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">
                Artists in Round {selectedRound.round_number}
                {selectedRound.round_type === 'final' && ' (Final)'}
              </h4>

              {getPerformancesForRound(selectedRound.id).length === 0 ? (
                <div className="bg-gray-700/50 rounded-lg p-8 text-center border border-dashed border-gray-600">
                  <Music className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400">No artists assigned yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {performances
                    .filter(p => p.round_id === selectedRound.id)
                    .map((performance) => {
                      const artist = acceptedArtists.find(a => a.id === performance.artist_id);
                      if (!artist) return null;

                      return (
                        <div
                          key={performance.id}
                          className="bg-gray-700 rounded-lg p-4 flex items-center justify-between border border-gray-600"
                        >
                          <div className="flex items-center gap-3">
                            {artist.photo_url ? (
                              <img
                                src={artist.photo_url}
                                alt={artist.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                <Music className="w-6 h-6 text-cyan-400" />
                              </div>
                            )}
                            <div>
                              <h5 className="font-semibold text-white">{artist.name}</h5>
                              <p className="text-sm text-gray-400">"{performance.song_title}"</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveArtist(performance.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-all"
                            title="Remove from round"
                          >
                            <X className="w-5 h-5 text-red-400" />
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-3">
                Available Artists
              </h4>
              {getPerformancesForRound(selectedRound.id).length >= 3 ? (
                <div className="bg-yellow-500/10 rounded-lg p-6 text-center border border-yellow-500/30">
                  <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                  <p className="text-yellow-400 font-medium">Round is full (3/3 artists assigned)</p>
                  <p className="text-sm text-gray-400 mt-1">Remove an artist to add another</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {acceptedArtists
                    .filter(artist => !isArtistInRound(artist.id, selectedRound.id))
                    .map((artist) => (
                      <div
                        key={artist.id}
                        className="bg-gray-700/50 rounded-lg p-4 flex items-center justify-between border border-gray-600 hover:border-cyan-500/50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {artist.photo_url ? (
                            <img
                              src={artist.photo_url}
                              alt={artist.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                              <Music className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h5 className="font-semibold text-white">{artist.name}</h5>
                            {artist.acceptedApplication && (
                              <div className="text-sm text-gray-400 space-y-0.5">
                                <p>
                                  <span className="text-cyan-400">Vorrunde:</span> "{artist.acceptedApplication.preliminary_song_title}"
                                </p>
                                <p>
                                  <span className="text-electric-400">Finale:</span> "{artist.acceptedApplication.final_song_title}"
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleAssignArtist(
                            artist.id,
                            artist.acceptedApplication?.preliminary_song_title || 'TBA',
                            artist.acceptedApplication?.final_song_title || 'TBA'
                          )}
                          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Assign
                        </button>
                      </div>
                    ))}
                  {acceptedArtists.filter(artist => !isArtistInRound(artist.id, selectedRound.id)).length === 0 && (
                    <div className="bg-gray-700/50 rounded-lg p-6 text-center border border-dashed border-gray-600">
                      <p className="text-gray-400">All accepted artists are already assigned to this round</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
