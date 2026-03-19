import React, { useEffect, useState } from 'react';
import { Artist, Event } from '../lib/types';
import { useLanguage } from '../contexts/LanguageContext';
import { Music, MapPin, Instagram, Youtube, Globe, ExternalLink, X, Calendar, CheckCircle } from 'lucide-react';

interface ArtistWithEvents extends Artist {
  events: {
    event: Event;
    status: string;
  }[];
}

export function Artists() {
  const { t } = useLanguage();
  const [artists, setArtists] = useState<ArtistWithEvents[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArtist, setSelectedArtist] = useState<ArtistWithEvents | null>(null);

  const serverBaseUrl = (import.meta.env.VITE_SERVER_BASE_URL as string | undefined) || '';
  const artistsFeaturedUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/artists_featured_list.php` : '';

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    try {
      if (!artistsFeaturedUrl) {
        throw new Error('Missing VITE_SERVER_BASE_URL');
      }

      const res = await fetch(artistsFeaturedUrl, { method: 'GET' });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to load artists');
      }

      setArtists(Array.isArray(json.artists) ? json.artists : []);
    } catch (error) {
      console.error('Error loading artists:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArtists = artists.filter((artist) => {
    const search = searchTerm.toLowerCase();
    return (
      artist.name.toLowerCase().includes(search) ||
      (artist.city || '').toLowerCase().includes(search) ||
      (artist.genre || '').toLowerCase().includes(search)
    );
  });

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
          <Music className="w-4 h-4" />
          Featured Artists
        </div>
        <h1 className="text-gradient-electric">{t.artists.title}</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">{t.artists.subtitle}</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t.artists.searchPlaceholder}
          className="input-field"
        />
      </div>

      {filteredArtists.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-electric-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-cyan-500/30">
            <Music className="w-10 h-10 text-cyan-400" />
          </div>
          <h3 className="mb-4">{t.artists.noArtistsFound}</h3>
          <p className="text-gray-400">
            {artists.length === 0
              ? t.artists.noApprovedArtists
              : t.artists.noMatchingArtists
            }
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArtists.map((artist, index) => (
            <div
              key={artist.id}
              onClick={() => setSelectedArtist(artist)}
              className="card-premium spotlight-effect group cursor-pointer animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative overflow-hidden rounded-xl mb-4">
                {artist.photo_url ? (
                  <img
                    src={artist.photo_url}
                    alt={artist.name}
                    className="w-full h-56 object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-56 bg-gradient-to-br from-electric-500/30 via-cyan-500/20 to-neon-600/30 flex items-center justify-center">
                    <Music className="w-20 h-20 text-cyan-400/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-60" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-display text-2xl font-bold text-white mb-1 drop-shadow-lg group-hover:text-cyan-300 transition-colors">
                    {artist.name}
                  </h3>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {artist.city && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span>{artist.city}</span>
                  </div>
                )}
                {artist.genre && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Music className="w-4 h-4 text-cyan-400" />
                    <span>{artist.genre}</span>
                  </div>
                )}
              </div>

              {artist.bio && (
                <p className="text-gray-300 text-sm mb-4 line-clamp-3 leading-relaxed">{artist.bio}</p>
              )}

              {artist.events.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {artist.events.map((eventInfo, idx) => {
                    const isPast = new Date(eventInfo.event.event_date) < new Date();
                    return (
                      <div
                        key={idx}
                        className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-medium ${
                          isPast
                            ? 'bg-slate-800 text-gray-500 border border-slate-700'
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}
                      >
                        <CheckCircle className="w-3 h-3" />
                        {eventInfo.event.title}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-white/10">
                {artist.instagram && (
                  <a
                    href={`https://instagram.com/${artist.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 p-2.5 glass rounded-xl hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-electric-500/20 hover:border-cyan-500/30 transition-all duration-300 flex items-center justify-center border border-white/10"
                    title="Instagram"
                  >
                    <Instagram className="w-4 h-4 text-gray-300 group-hover:text-cyan-400" />
                  </a>
                )}
                {artist.youtube && (
                  <a
                    href={artist.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 p-2.5 glass rounded-xl hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-electric-500/20 hover:border-cyan-500/30 transition-all duration-300 flex items-center justify-center border border-white/10"
                    title="YouTube"
                  >
                    <Youtube className="w-4 h-4 text-gray-300 group-hover:text-cyan-400" />
                  </a>
                )}
                {artist.website && (
                  <a
                    href={artist.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 p-2.5 glass rounded-xl hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-electric-500/20 hover:border-cyan-500/30 transition-all duration-300 flex items-center justify-center border border-white/10"
                    title="Website"
                  >
                    <Globe className="w-4 h-4 text-gray-300 group-hover:text-cyan-400" />
                  </a>
                )}
                {artist.media_url && (
                  <a
                    href={artist.media_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 p-2.5 glass rounded-xl hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-electric-500/20 hover:border-cyan-500/30 transition-all duration-300 flex items-center justify-center border border-white/10"
                    title="Music"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-cyan-400" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedArtist && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setSelectedArtist(null)}>
          <div className="card-premium max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 glass-dark border-b border-white/10 p-6 flex items-center justify-between z-10 backdrop-blur-xl">
              <h2 className="text-gradient-electric">{t.artists.artistProfile}</h2>
              <button
                onClick={() => setSelectedArtist(null)}
                className="p-3 glass rounded-xl hover:bg-neon-500/20 hover:border-neon-500/30 transition-all duration-300 border border-white/10"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-neon-400" />
              </button>
            </div>

            <div className="p-8">
              <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="relative flex-shrink-0">
                  {selectedArtist.photo_url ? (
                    <img
                      src={selectedArtist.photo_url}
                      alt={selectedArtist.name}
                      className="w-full md:w-64 h-64 object-cover rounded-xl shadow-glow-md"
                    />
                  ) : (
                    <div className="w-full md:w-64 h-64 bg-gradient-to-br from-electric-500/30 via-cyan-500/20 to-neon-600/30 flex items-center justify-center rounded-xl shadow-glow-md">
                      <Music className="w-24 h-24 text-cyan-400/50" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="mb-6">{selectedArtist.name}</h3>

                  <div className="space-y-3 mb-8">
                    {selectedArtist.city && (
                      <div className="flex items-center gap-3 text-gray-300">
                        <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
                          <MapPin className="w-5 h-5 text-cyan-400" />
                        </div>
                        <span>{selectedArtist.city}</span>
                      </div>
                    )}
                    {selectedArtist.genre && (
                      <div className="flex items-center gap-3 text-gray-300">
                        <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
                          <Music className="w-5 h-5 text-cyan-400" />
                        </div>
                        <span>{selectedArtist.genre}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {selectedArtist.instagram && (
                      <a
                        href={`https://instagram.com/${selectedArtist.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Instagram className="w-5 h-5" />
                        <span className="font-medium">Instagram</span>
                      </a>
                    )}
                    {selectedArtist.youtube && (
                      <a
                        href={selectedArtist.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Youtube className="w-5 h-5" />
                        <span className="font-medium">YouTube</span>
                      </a>
                    )}
                    {selectedArtist.website && (
                      <a
                        href={selectedArtist.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Globe className="w-5 h-5" />
                        <span className="font-medium">Website</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {selectedArtist.bio && (
                <div className="mb-8 glass rounded-xl p-6 border border-white/10">
                  <h4 className="text-cyan-400 mb-3">About</h4>
                  <p className="text-gray-300 leading-relaxed">{selectedArtist.bio}</p>
                </div>
              )}

              {selectedArtist.media_url && (
                <div className="mb-8">
                  <h4 className="text-cyan-400 mb-4">Listen</h4>
                  <a
                    href={selectedArtist.media_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Listen to Music
                  </a>
                </div>
              )}

              {selectedArtist.events.length > 0 && (
                <div>
                  <h4 className="text-cyan-400 mb-4">Events</h4>
                  <div className="space-y-4">
                    {selectedArtist.events.map((eventInfo, idx) => {
                      const isPast = new Date(eventInfo.event.event_date) < new Date();
                      const eventDate = new Date(eventInfo.event.event_date);

                      return (
                        <div
                          key={idx}
                          className="glass rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all duration-300"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h5 className="font-display text-xl font-bold text-white mb-2">
                                {eventInfo.event.title}
                              </h5>
                              <div className="flex items-center gap-2 text-gray-400 mb-3">
                                <Calendar className="w-4 h-4 text-cyan-400" />
                                <span className="text-sm">
                                  {eventDate.toLocaleDateString('de-DE', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              {eventInfo.event.description && (
                                <p className="text-gray-300">{eventInfo.event.description}</p>
                              )}
                            </div>
                            <div>
                              <span className={`text-xs px-4 py-2 rounded-xl font-semibold ${
                                isPast
                                  ? 'bg-slate-800 text-gray-500 border border-slate-700'
                                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                              }`}>
                                {isPast ? 'Past Event' : 'Upcoming'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
