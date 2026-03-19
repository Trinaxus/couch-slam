import React, { useEffect, useState } from 'react';
import { Artist, Event, Application } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Music, Save, Send, Calendar, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

export function ArtistDashboard() {
  const { user, token } = useAuth();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'apply' | 'applications'>('profile');
  const [applyExistingApplicationId, setApplyExistingApplicationId] = useState<string | null>(null);
  const [submittingApplication, setSubmittingApplication] = useState(false);

  const serverBaseUrl = (import.meta.env.VITE_SERVER_BASE_URL as string | undefined) || '';
  const artistMeGetUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/artist_me_get.php` : '';
  const artistMeUpsertUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/artist_me_upsert.php` : '';
  const eventsOpenListUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/events_open_list.php` : '';
  const applicationsMeListUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/applications_me_list.php` : '';
  const applicationsMeSubmitUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/applications_me_submit.php` : '';
  const applicationsMeUpdateUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/applications_me_update.php` : '';

  const artistMeGetUrlWithToken = artistMeGetUrl && token ? `${artistMeGetUrl}?token=${encodeURIComponent(token)}` : artistMeGetUrl;
  const artistMeUpsertUrlWithToken = artistMeUpsertUrl && token ? `${artistMeUpsertUrl}?token=${encodeURIComponent(token)}` : artistMeUpsertUrl;
  const applicationsMeListUrlWithToken = applicationsMeListUrl && token ? `${applicationsMeListUrl}?token=${encodeURIComponent(token)}` : applicationsMeListUrl;
  const applicationsMeSubmitUrlWithToken = applicationsMeSubmitUrl && token ? `${applicationsMeSubmitUrl}?token=${encodeURIComponent(token)}` : applicationsMeSubmitUrl;
  const applicationsMeUpdateUrlWithToken = applicationsMeUpdateUrl && token ? `${applicationsMeUpdateUrl}?token=${encodeURIComponent(token)}` : applicationsMeUpdateUrl;

  const [applicationEdits, setApplicationEdits] = useState<Record<string, { preliminary_song_title: string; final_song_title: string; technical_requirements: string }>>({});
  const [savingApplicationId, setSavingApplicationId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    city: '',
    genre: '',
    photo_url: '',
    photo_fit: 'cover' as 'cover' | 'contain' | 'fill',
    photo_pos_x: 50,
    photo_pos_y: 50,
    instagram: '',
    youtube: '',
    spotify: '',
    website: '',
    media_url: '',
  });

  const [applicationForm, setApplicationForm] = useState({
    event_id: '',
    preliminary_song_title: '',
    final_song_title: '',
    technical_requirements: '',
  });

  useEffect(() => {
    if (!applicationForm.event_id) {
      setApplyExistingApplicationId(null);
      return;
    }

    const existing = applications.find((a) => a.event_id === applicationForm.event_id);
    if (!existing) {
      setApplyExistingApplicationId(null);
      return;
    }

    setApplyExistingApplicationId(existing.id);
    setApplicationForm((prev) => ({
      ...prev,
      preliminary_song_title: existing.preliminary_song_title || '',
      final_song_title: existing.final_song_title || '',
      technical_requirements: existing.technical_requirements || '',
    }));
  }, [applicationForm.event_id, applications]);

  useEffect(() => {
    if (user) {
      void loadArtistProfile();
      void loadEvents();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    if (!artist) {
      setApplications([]);
      return;
    }
    void loadApplications();
  }, [user?.id, artist?.id]);

  const loadArtistProfile = async () => {
    try {
      if (!artistMeGetUrlWithToken) {
        throw new Error('Missing VITE_SERVER_BASE_URL');
      }

      const res = await fetch(artistMeGetUrlWithToken, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to load artist profile');

      const data = json.artist as any;
      if (data) {
        setArtist(data as Artist);
        setFormData({
          name: data.name || '',
          bio: data.bio || '',
          city: data.city || '',
          genre: data.genre || '',
          photo_url: data.photo_url || '',
          photo_fit: (data.photo_fit as any) || 'cover',
          photo_pos_x: typeof data.photo_pos_x === 'number' ? data.photo_pos_x : 50,
          photo_pos_y: typeof data.photo_pos_y === 'number' ? data.photo_pos_y : 50,
          instagram: data.instagram || '',
          youtube: data.youtube || '',
          spotify: data.spotify || '',
          website: data.website || '',
          media_url: data.media_url || '',
        });
      } else {
        setArtist(null);
      }
    } catch (error) {
      console.error('Error loading artist profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      if (!eventsOpenListUrl) {
        throw new Error('Missing VITE_SERVER_BASE_URL');
      }

      const res = await fetch(eventsOpenListUrl, { method: 'GET' });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to load events');
      setEvents(Array.isArray(json.events) ? json.events : []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadApplications = async () => {
    try {
      if (!applicationsMeListUrlWithToken) {
        throw new Error('Missing VITE_SERVER_BASE_URL');
      }

      const res = await fetch(applicationsMeListUrlWithToken, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to load applications');
      const list = Array.isArray(json.applications) ? (json.applications as Application[]) : [];
      setApplications(list);

      const nextEdits: Record<string, { preliminary_song_title: string; final_song_title: string; technical_requirements: string }> = {};
      for (const app of list) {
        nextEdits[app.id] = {
          preliminary_song_title: app.preliminary_song_title || '',
          final_song_title: app.final_song_title || '',
          technical_requirements: app.technical_requirements || '',
        };
      }
      setApplicationEdits(nextEdits);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  const handleSaveApplication = async (appId: string) => {
    try {
      if (!applicationsMeUpdateUrlWithToken) {
        throw new Error('Missing VITE_SERVER_BASE_URL');
      }
      const payload = applicationEdits[appId];
      if (!payload) {
        throw new Error('Missing application edits');
      }

      setSavingApplicationId(appId);

      const res = await fetch(applicationsMeUpdateUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: appId,
          preliminary_song_title: payload.preliminary_song_title,
          final_song_title: payload.final_song_title,
          technical_requirements: payload.technical_requirements,
        }),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to update application');

      alert('Application updated successfully!');
      await loadApplications();
    } catch (error: any) {
      console.error('Error updating application:', error);
      alert(error.message || 'Failed to update application');
    } finally {
      setSavingApplicationId(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!artistMeUpsertUrlWithToken) {
        throw new Error('Missing VITE_SERVER_BASE_URL');
      }

      const res = await fetch(artistMeUpsertUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to save profile');

      alert('Profile saved successfully!');
      await loadArtistProfile();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert(error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!artist) {
      alert('Please complete your artist profile first');
      return;
    }

    try {
      setSubmittingApplication(true);

      if (applyExistingApplicationId) {
        if (!applicationsMeUpdateUrlWithToken) {
          throw new Error('Missing VITE_SERVER_BASE_URL');
        }

        const res = await fetch(applicationsMeUpdateUrlWithToken, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: applyExistingApplicationId,
            preliminary_song_title: applicationForm.preliminary_song_title,
            final_song_title: applicationForm.final_song_title,
            technical_requirements: applicationForm.technical_requirements,
          }),
        });
        const json = (await res.json()) as any;
        if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to update application');

        alert('Application updated successfully!');
        await loadApplications();
      } else {
        if (!applicationsMeSubmitUrlWithToken) {
          throw new Error('Missing VITE_SERVER_BASE_URL');
        }

        const res = await fetch(applicationsMeSubmitUrlWithToken, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            event_id: applicationForm.event_id,
            preliminary_song_title: applicationForm.preliminary_song_title,
            final_song_title: applicationForm.final_song_title,
            technical_requirements: applicationForm.technical_requirements,
          }),
        });
        const json = (await res.json()) as any;
        if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to submit application');

        alert('Application submitted successfully!');
        setApplicationForm({
          event_id: '',
          preliminary_song_title: '',
          final_song_title: '',
          technical_requirements: '',
        });
        await loadApplications();
        setActiveTab('applications');
      }
    } catch (error: any) {
      console.error('Error submitting application:', error);
      alert(error.message || 'Failed to submit application');
    } finally {
      setSubmittingApplication(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'under_review':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'rejected':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'under_review':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  const setPhotoFocusFromClientPoint = (clientX: number, clientY: number, rect: DOMRect) => {
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setFormData((prev) => ({
      ...prev,
      photo_pos_x: Math.round(clamp(x, 0, 100)),
      photo_pos_y: Math.round(clamp(y, 0, 100)),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Artist Dashboard</h1>
          <p className="text-gray-400">Manage your profile and applications</p>
        </div>

        <div className="hidden sm:block">
          <div className="w-20 h-20 rounded-2xl border border-gray-700 bg-gray-900 overflow-hidden">
            {formData.photo_url ? (
              <img
                src={formData.photo_url}
                alt="Artist cover"
                className={`w-full h-full ${
                  formData.photo_fit === 'cover'
                    ? 'object-cover'
                    : formData.photo_fit === 'contain'
                      ? 'object-contain'
                      : 'object-fill'
                } object-center`}
                style={{ objectPosition: `${formData.photo_pos_x}% ${formData.photo_pos_y}%` }}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600">
                <Music className="w-8 h-8" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'profile'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('apply')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'apply'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Apply to Event
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'applications'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          My Applications
        </button>
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Artist/Band Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Genre
              </label>
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Photo URL
              </label>
              <input
                type="url"
                value={formData.photo_url}
                onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Photo Anzeige
              </label>
              <select
                value={formData.photo_fit}
                onChange={(e) => setFormData({ ...formData, photo_fit: e.target.value as any })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="cover">Zuschneiden (Cover)</option>
                <option value="contain">Einpassen (Contain)</option>
                <option value="fill">Strecken (Fill)</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-900/40 rounded-lg border border-gray-700 p-4">
            <p className="text-sm text-gray-300 font-medium mb-3">Vorschau</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">1:1 Ausschnitt (Klick/Tap setzt Fokuspunkt)</p>
                <div
                  className="w-full aspect-square rounded-xl border border-gray-700 bg-gray-900 overflow-hidden cursor-crosshair select-none"
                  onMouseDown={(e) => {
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    setPhotoFocusFromClientPoint(e.clientX, e.clientY, rect);
                  }}
                  onTouchStart={(e) => {
                    const t = e.touches[0];
                    if (!t) return;
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    setPhotoFocusFromClientPoint(t.clientX, t.clientY, rect);
                  }}
                  title="Klicke auf den Bereich, der im Quadrat sichtbar sein soll"
                >
                  {formData.photo_url ? (
                    <img
                      src={formData.photo_url}
                      alt="Artist cover crop preview"
                      className={`w-full h-full ${
                        formData.photo_fit === 'cover'
                          ? 'object-cover'
                          : formData.photo_fit === 'contain'
                            ? 'object-contain'
                            : 'object-fill'
                      }`}
                      style={{ objectPosition: `${formData.photo_pos_x}% ${formData.photo_pos_y}%` }}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <Music className="w-10 h-10" />
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-0" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Feinjustierung Fokuspunkt</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Horizontal (X): {formData.photo_pos_x}%</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={formData.photo_pos_x}
                        onChange={(e) => setFormData({ ...formData, photo_pos_x: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Vertikal (Y): {formData.photo_pos_y}%</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={formData.photo_pos_y}
                        onChange={(e) => setFormData({ ...formData, photo_pos_y: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">Original-Preview</p>
                  <div className="w-full h-40 rounded-xl border border-gray-700 bg-gray-900 overflow-hidden">
                    {formData.photo_url ? (
                      <img
                        src={formData.photo_url}
                        alt="Artist cover preview"
                        className={`w-full h-full ${
                          formData.photo_fit === 'cover'
                            ? 'object-cover'
                            : formData.photo_fit === 'contain'
                              ? 'object-contain'
                              : 'object-fill'
                        }`}
                        style={{ objectPosition: `${formData.photo_pos_x}% ${formData.photo_pos_y}%` }}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <Music className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Instagram Handle
              </label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="username"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                YouTube URL
              </label>
              <input
                type="url"
                value={formData.youtube}
                onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Spotify URL
              </label>
              <input
                type="url"
                value={formData.spotify}
                onChange={(e) => setFormData({ ...formData, spotify: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Music/Video URL
              </label>
              <input
                type="url"
                value={formData.media_url}
                onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      )}

      {activeTab === 'apply' && (
        <div className="space-y-6">
          {!artist ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 text-center">
              <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <p className="text-yellow-400 font-semibold mb-2">Complete Your Profile First</p>
              <p className="text-gray-300 text-sm">You need to set up your artist profile before applying to events</p>
              <button
                onClick={() => setActiveTab('profile')}
                className="mt-4 bg-yellow-500 text-gray-900 font-semibold py-2 px-6 rounded-lg hover:bg-yellow-400 transition-colors"
              >
                Go to Profile
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Open Events</h3>
              <p className="text-gray-400">There are no events accepting applications right now</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitApplication} className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Event *
                </label>
                <select
                  value={applicationForm.event_id}
                  onChange={(e) => setApplicationForm({ ...applicationForm, event_id: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                >
                  <option value="">Choose an event...</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} - {new Date(event.event_date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4 bg-gray-700/30 p-4 rounded-lg border border-gray-600">
                <p className="text-sm text-cyan-400 font-semibold">You must prepare two songs</p>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Song for Preliminary Round *
                  </label>
                  <input
                    type="text"
                    value={applicationForm.preliminary_song_title}
                    onChange={(e) => setApplicationForm({ ...applicationForm, preliminary_song_title: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Your song for the preliminary round"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Song for Final Round *
                  </label>
                  <input
                    type="text"
                    value={applicationForm.final_song_title}
                    onChange={(e) => setApplicationForm({ ...applicationForm, final_song_title: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Your song for the final round (if you advance)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">This song will be performed if you advance to the final</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Technical Requirements
                </label>
                <textarea
                  value={applicationForm.technical_requirements}
                  onChange={(e) => setApplicationForm({ ...applicationForm, technical_requirements: e.target.value })}
                  rows={4}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Any special equipment or setup you need..."
                />
              </div>

              <button
                type="submit"
                disabled={submittingApplication}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
                {submittingApplication
                  ? applyExistingApplicationId
                    ? 'Updating...'
                    : 'Submitting...'
                  : applyExistingApplicationId
                    ? 'Update Application'
                    : 'Submit Application'}
              </button>
            </form>
          )}
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="text-center py-20">
              <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Applications Yet</h3>
              <p className="text-gray-400">You haven't applied to any events</p>
            </div>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">Vorrunde Song</label>
                        <input
                          type="text"
                          value={applicationEdits[app.id]?.preliminary_song_title || ''}
                          onChange={(e) =>
                            setApplicationEdits((prev) => ({
                              ...prev,
                              [app.id]: {
                                ...(prev[app.id] || { preliminary_song_title: '', final_song_title: '', technical_requirements: '' }),
                                preliminary_song_title: e.target.value,
                              },
                            }))
                          }
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          placeholder="Songtitel für Vorrunde"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">Finale Song</label>
                        <input
                          type="text"
                          value={applicationEdits[app.id]?.final_song_title || ''}
                          onChange={(e) =>
                            setApplicationEdits((prev) => ({
                              ...prev,
                              [app.id]: {
                                ...(prev[app.id] || { preliminary_song_title: '', final_song_title: '', technical_requirements: '' }),
                                final_song_title: e.target.value,
                              },
                            }))
                          }
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          placeholder="Songtitel für Finale"
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Technical Requirements</label>
                      <textarea
                        value={applicationEdits[app.id]?.technical_requirements || ''}
                        onChange={(e) =>
                          setApplicationEdits((prev) => ({
                            ...prev,
                            [app.id]: {
                              ...(prev[app.id] || { preliminary_song_title: '', final_song_title: '', technical_requirements: '' }),
                              technical_requirements: e.target.value,
                            },
                          }))
                        }
                        rows={3}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="Technische Anforderungen..."
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(app.created_at).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => handleSaveApplication(app.id)}
                        disabled={savingApplicationId === app.id}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Save className="w-4 h-4" />
                        {savingApplicationId === app.id ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${getStatusColor(app.status)}`}>
                    {getStatusIcon(app.status)}
                    <span className="capitalize font-medium">{app.status.replace('_', ' ')}</span>
                  </div>
                </div>

                {app.notes && (
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <p className="text-sm text-gray-400 mb-1">Admin Notes:</p>
                    <p className="text-gray-300">{app.notes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
