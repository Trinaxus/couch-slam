import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Artist, Event } from '../lib/types';
import { useLanguage } from '../contexts/LanguageContext';
import { Music, MapPin, Instagram, Youtube, Globe, ExternalLink, X, Calendar, CheckCircle } from 'lucide-react';

interface ArtistWithEvents extends Artist {
  events: {
    event: Event;
    status: string;
  }[];
}

const getObjectFitClass = (fit?: any) => {
  if (fit === 'contain') return 'object-contain';
  if (fit === 'fill') return 'object-fill';
  return 'object-cover';
};

const getObjectPositionStyle = (artist: any) => {
  const x = typeof artist?.photo_pos_x === 'number' ? artist.photo_pos_x : 50;
  const y = typeof artist?.photo_pos_y === 'number' ? artist.photo_pos_y : 50;
  return { objectPosition: `${x}% ${y}%` } as CSSProperties;
};

const normalizeUrl = (raw: string) => {
  const v = (raw || '').trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
};

const instagramUrl = (handle: string) => {
  const h = (handle || '').trim().replace(/^@/, '');
  if (!h) return '';
  return `https://instagram.com/${h}`;
};

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

  const filteredArtists = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return artists.filter((artist) => {
      return (
        artist.name.toLowerCase().includes(search) ||
        (artist.city || '').toLowerCase().includes(search) ||
        (artist.genre || '').toLowerCase().includes(search)
      );
    });
  }, [artists, searchTerm]);

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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtists.map((artist, index) => (
            <div
              key={artist.id}
              onClick={() => setSelectedArtist(artist)}
              className="card-premium spotlight-effect group cursor-pointer animate-slide-up overflow-hidden"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative">
                <div className="relative overflow-hidden">
                  {artist.photo_url ? (
                    <img
                      src={artist.photo_url}
                      alt={artist.name}
                      className={`w-full aspect-[16/10] ${getObjectFitClass((artist as any).photo_fit)} transform group-hover:scale-105 transition-transform duration-700`}
                      style={getObjectPositionStyle(artist)}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full aspect-[16/10] bg-gradient-to-br from-electric-500/30 via-cyan-500/20 to-neon-600/30 flex items-center justify-center">
                      <Music className="w-20 h-20 text-cyan-400/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                </div>

                <div className="absolute left-5 -bottom-7">
                  <div className="w-14 h-14 rounded-full border border-white/15 bg-slate-950 overflow-hidden shadow-glow-sm">
                    {artist.avatar_url ? (
                      <img
                        src={artist.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-electric-400 to-cyan-500 flex items-center justify-center">
                        <Music className="w-6 h-6 text-slate-950" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 pt-10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-xl font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                      {artist.name}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {artist.city ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/5 text-gray-200 border border-white/10">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          {artist.city}
                        </span>
                      ) : null}
                      {artist.genre ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-200 border border-cyan-500/20">
                          <Music className="w-3.5 h-3.5 text-cyan-300" />
                          {artist.genre}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 font-semibold">Profil</div>
                </div>

                {artist.bio ? (
                  <p className="mt-4 text-gray-300 text-sm line-clamp-3 leading-relaxed">{artist.bio}</p>
                ) : (
                  <p className="mt-4 text-gray-500 text-sm">Keine Beschreibung vorhanden.</p>
                )}

                {artist.events.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {artist.events.slice(0, 2).map((eventInfo, idx) => {
                      const isPast = new Date(eventInfo.event.event_date) < new Date();
                      return (
                        <div
                          key={idx}
                          className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold ${
                            isPast
                              ? 'bg-slate-800 text-gray-500 border border-slate-700'
                              : 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30'
                          }`}
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span className="truncate max-w-[14rem]">{eventInfo.event.title}</span>
                        </div>
                      );
                    })}
                    {artist.events.length > 2 ? (
                      <div className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 border border-white/10 font-semibold">
                        +{artist.events.length - 2}
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="mt-5 flex items-center gap-2 pt-4 border-t border-white/10">
                  {artist.instagram ? (
                    <a
                      href={instagramUrl(artist.instagram)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="h-10 w-10 inline-flex items-center justify-center glass rounded-xl hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-electric-500/20 hover:border-cyan-500/30 transition-all duration-300 border border-white/10"
                      title="Instagram"
                    >
                      <Instagram className="w-4.5 h-4.5 text-gray-200" />
                    </a>
                  ) : null}
                  {artist.youtube ? (
                    <a
                      href={normalizeUrl(artist.youtube)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="h-10 w-10 inline-flex items-center justify-center glass rounded-xl hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-electric-500/20 hover:border-cyan-500/30 transition-all duration-300 border border-white/10"
                      title="YouTube"
                    >
                      <Youtube className="w-4.5 h-4.5 text-gray-200" />
                    </a>
                  ) : null}
                  {artist.website ? (
                    <a
                      href={normalizeUrl(artist.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="h-10 w-10 inline-flex items-center justify-center glass rounded-xl hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-electric-500/20 hover:border-cyan-500/30 transition-all duration-300 border border-white/10"
                      title="Website"
                    >
                      <Globe className="w-4.5 h-4.5 text-gray-200" />
                    </a>
                  ) : null}
                  {artist.media_url ? (
                    <a
                      href={normalizeUrl(artist.media_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="h-10 w-10 inline-flex items-center justify-center glass rounded-xl hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-electric-500/20 hover:border-cyan-500/30 transition-all duration-300 border border-white/10"
                      title="Media"
                    >
                      <ExternalLink className="w-4.5 h-4.5 text-gray-200" />
                    </a>
                  ) : null}

                  <div className="flex-1" />
                  <div className="text-xs font-semibold text-gray-400">Klick für Details</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedArtist && (
        <div className="fixed inset-0 z-[80] overflow-y-auto animate-fade-in">
          <button
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-md"
            aria-label="Close"
            onClick={() => setSelectedArtist(null)}
          />

          <div className="relative min-h-full px-4 py-8 flex items-start justify-center">
            <div
              className="card-premium max-w-4xl w-full overflow-hidden animate-scale-in shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  {selectedArtist.photo_url ? (
                    <img
                      src={selectedArtist.photo_url}
                      alt={selectedArtist.name}
                      className={`w-full h-full ${getObjectFitClass((selectedArtist as any).photo_fit)}`}
                      style={getObjectPositionStyle(selectedArtist)}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-electric-500/30 via-cyan-500/20 to-neon-600/30 flex items-center justify-center">
                      <Music className="w-24 h-24 text-cyan-400/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                </div>

                <button
                  onClick={() => setSelectedArtist(null)}
                  className="absolute top-4 right-4 h-11 w-11 inline-flex items-center justify-center rounded-full bg-slate-950/60 backdrop-blur border border-white/10 hover:border-white/20 hover:bg-slate-950/80 transition"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-200" />
                </button>

                <div className="absolute left-6 bottom-0 translate-y-1/2">
                  <div className="w-20 h-20 rounded-full border border-white/15 bg-slate-950 overflow-hidden shadow-2xl">
                    {selectedArtist.avatar_url ? (
                      <img
                        src={selectedArtist.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-electric-400 to-cyan-500 flex items-center justify-center">
                        <Music className="w-8 h-8 text-slate-950" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-8 pt-14 pb-8">
                <div className="mb-8">
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-400/90">{t.artists.artistProfile}</div>
                  <h2 className="mt-2 font-display text-3xl font-bold text-white">{selectedArtist.name}</h2>
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                  {selectedArtist.city ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 text-gray-200 border border-white/10">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      {selectedArtist.city}
                    </span>
                  ) : null}
                  {selectedArtist.genre ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-200 border border-cyan-500/20">
                      <Music className="w-4 h-4 text-cyan-300" />
                      {selectedArtist.genre}
                    </span>
                  ) : null}
                </div>

                {selectedArtist.bio ? (
                  <div className="mb-6 glass rounded-2xl p-6 border border-white/10">
                    <h4 className="text-cyan-400 mb-3">About</h4>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedArtist.bio}</p>
                  </div>
                ) : null}

                {(selectedArtist.instagram || selectedArtist.youtube || selectedArtist.website || selectedArtist.media_url) ? (
                  <div className="mb-8">
                    <div className="text-sm font-semibold text-gray-400 mb-3">Links</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedArtist.instagram ? (
                        <a
                          href={instagramUrl(selectedArtist.instagram)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary flex items-center gap-2"
                        >
                          <Instagram className="w-5 h-5" />
                          <span className="font-medium">Instagram</span>
                        </a>
                      ) : null}
                      {selectedArtist.youtube ? (
                        <a
                          href={normalizeUrl(selectedArtist.youtube)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary flex items-center gap-2"
                        >
                          <Youtube className="w-5 h-5" />
                          <span className="font-medium">YouTube</span>
                        </a>
                      ) : null}
                      {selectedArtist.website ? (
                        <a
                          href={normalizeUrl(selectedArtist.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary flex items-center gap-2"
                        >
                          <Globe className="w-5 h-5" />
                          <span className="font-medium">Website</span>
                        </a>
                      ) : null}
                      {selectedArtist.media_url ? (
                        <a
                          href={normalizeUrl(selectedArtist.media_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary flex items-center gap-2"
                        >
                          <ExternalLink className="w-5 h-5" />
                          <span className="font-medium">Media</span>
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {selectedArtist.media_url ? (
                  <div className="mb-8">
                    <h4 className="text-cyan-400 mb-4">Listen</h4>
                    <a
                      href={normalizeUrl(selectedArtist.media_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Listen to Music
                    </a>
                  </div>
                ) : null}

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
        </div>
      )}
    </div>
  );
}
