import React, { useState, useEffect } from 'react';
import { Artist, Event, Application } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ConfirmModal, PromptModal, SelectEventModal } from './Modal';
import { UserPlus, CreditCard as Edit2, Trash2, Music, MapPin, Mail, Phone, Link as LinkIcon, Plus, Minus, Save, X, Search, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

interface ArtistManagementProps {
  events: Event[];
  onUpdate?: () => void;
  initialEditArtistId?: string | null;
  onInitialEditHandled?: () => void;
}

interface ArtistWithApplications extends Artist {
  applications: (Application & { event: Event })[];
}

export function ArtistManagement({ events, onUpdate, initialEditArtistId, onInitialEditHandled }: ArtistManagementProps) {
  const { user, token } = useAuth();
  const { showSuccess, showError } = useToast();
  const [artists, setArtists] = useState<ArtistWithApplications[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<ArtistWithApplications[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingArtist, setEditingArtist] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [loading, setLoading] = useState(true);

  const serverBaseUrl = (import.meta.env.VITE_SERVER_BASE_URL as string | undefined) || '';
  const artistsListUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/artists_list.php?token=${encodeURIComponent(token)}` : '';
  const artistsUpsertUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/artists_upsert.php?token=${encodeURIComponent(token)}` : '';
  const artistsDeleteUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/artists_delete.php?token=${encodeURIComponent(token)}` : '';
  const appsListAllUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/applications_list_all.php?token=${encodeURIComponent(token)}` : '';
  const appsCreateUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/applications_create.php?token=${encodeURIComponent(token)}` : '';
  const appsDeleteUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/applications_delete.php?token=${encodeURIComponent(token)}` : '';

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; artistId: string | null; artistName: string | null }>({
    isOpen: false,
    artistId: null,
    artistName: null,
  });
  const [addToEventModal, setAddToEventModal] = useState<{ isOpen: boolean; artistId: string | null; eventId: string | null }>({
    isOpen: false,
    artistId: null,
    eventId: null,
  });
  const [selectEventModal, setSelectEventModal] = useState<{ isOpen: boolean; artistId: string | null }>({
    isOpen: false,
    artistId: null,
  });
  const [removeFromEventModal, setRemoveFromEventModal] = useState<{ isOpen: boolean; applicationId: string | null; artistName: string | null; eventTitle: string | null }>({
    isOpen: false,
    applicationId: null,
    artistName: null,
    eventTitle: null,
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    genre: '',
    bio: '',
    website_url: '',
    photo_url: '',
    instagram_handle: '',
    youtube_channel: '',
  });

  useEffect(() => {
    loadArtists();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredArtists(artists);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredArtists(
        artists.filter(
          (a) =>
            a.name.toLowerCase().includes(query) ||
            a.city?.toLowerCase().includes(query) ||
            a.genre?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, artists]);

  useEffect(() => {
    if (!initialEditArtistId) return;
    if (loading) return;
    if (editingArtist === initialEditArtistId) return;

    const a = artists.find((x) => String(x.id) === String(initialEditArtistId));
    if (!a) return;

    handleEdit(a);
    onInitialEditHandled?.();
  }, [initialEditArtistId, loading, artists, editingArtist, onInitialEditHandled]);

  const loadArtists = async () => {
    try {
      setLoading(true);
      if (!artistsListUrl || !appsListAllUrl) {
        throw new Error('Missing VITE_SERVER_BASE_URL');
      }

      const [artistsRes, appsRes] = await Promise.all([
        fetch(artistsListUrl, { method: 'GET', headers: { Authorization: `Bearer ${token}` } }),
        fetch(appsListAllUrl, { method: 'GET', headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const artistsJson = (await artistsRes.json()) as any;
      const appsJson = (await appsRes.json()) as any;

      if (!artistsRes.ok || !artistsJson?.ok) throw new Error(artistsJson?.error || 'Failed to load artists');
      if (!appsRes.ok || !appsJson?.ok) throw new Error(appsJson?.error || 'Failed to load applications');

      const artistsData = (artistsJson.artists || []) as Artist[];
      const appsData = (appsJson.applications || []) as Array<Application & { event: Event }>;

      const artistsWithApps = (artistsData || []).map((artist: any) => ({
        ...artist,
        applications: (appsData || []).filter((app: any) => app.artist_id === artist.id),
      }));

      setArtists(artistsWithApps);
      setFilteredArtists(artistsWithApps);
    } catch (error: any) {
      console.error('Error loading artists:', error);
      showError(error.message || 'Fehler beim Laden der Künstler');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (artist: Artist) => {
    setEditingArtist(artist.id);
    setFormData({
      name: artist.name,
      email: (artist as any).email || '',
      phone: (artist as any).phone || '',
      city: artist.city || '',
      genre: artist.genre || '',
      bio: artist.bio || '',
      website_url: artist.website || '',
      photo_url: artist.photo_url || '',
      instagram_handle: artist.instagram || '',
      youtube_channel: artist.youtube || '',
    });
    setCreatingNew(false);
  };

  const handleCreateNew = () => {
    setCreatingNew(true);
    setEditingArtist(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      city: '',
      genre: '',
      bio: '',
      website_url: '',
      photo_url: '',
      instagram_handle: '',
      youtube_channel: '',
    });
  };

  const handleCancel = () => {
    setEditingArtist(null);
    setCreatingNew(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      city: '',
      genre: '',
      bio: '',
      website_url: '',
      photo_url: '',
      instagram_handle: '',
      youtube_channel: '',
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showError('Künstlername ist erforderlich');
      return;
    }

    try {
      if (!artistsUpsertUrl) throw new Error('Missing VITE_SERVER_BASE_URL');

      const payload: any = {
        id: creatingNew ? undefined : editingArtist,
        name: formData.name.trim(),
        email: formData.email.trim() || '',
        phone: formData.phone.trim() || '',
        bio: formData.bio.trim() || '',
        city: formData.city.trim() || '',
        genre: formData.genre.trim() || '',
        photo_url: formData.photo_url.trim() || '',
        instagram: formData.instagram_handle.trim() || '',
        youtube: formData.youtube_channel.trim() || '',
        spotify: '',
        website: formData.website_url.trim() || '',
        media_url: '',
      };

      const res = await fetch(artistsUpsertUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to save artist');

      showSuccess(creatingNew ? 'Künstler erfolgreich erstellt!' : 'Künstler erfolgreich aktualisiert!');

      handleCancel();
      loadArtists();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error saving artist:', error);
      showError(error.message || 'Fehler beim Speichern des Künstlers');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.artistId) return;

    try {
      if (!artistsDeleteUrl) throw new Error('Missing VITE_SERVER_BASE_URL');
      const res = await fetch(artistsDeleteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: deleteModal.artistId }),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to delete artist');

      showSuccess('Künstler erfolgreich gelöscht');
      loadArtists();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error deleting artist:', error);
      showError(error.message || 'Fehler beim Löschen des Künstlers');
    }
  };

  const handleAddToEvent = async (songTitle: string) => {
    if (!addToEventModal.artistId || !addToEventModal.eventId) return;
    if (!songTitle || !songTitle.trim()) return;

    try {
      if (!appsCreateUrl) throw new Error('Missing VITE_SERVER_BASE_URL');
      const res = await fetch(appsCreateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          artist_id: addToEventModal.artistId,
          event_id: addToEventModal.eventId,
          preliminary_song_title: songTitle.trim(),
          final_song_title: songTitle.trim(),
          status: 'accepted',
        }),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to add artist to event');

      showSuccess('Künstler zum Event hinzugefügt!');
      loadArtists();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error adding artist to event:', error);
      showError(error.message || 'Fehler beim Hinzufügen des Künstlers zum Event');
    }
  };

  const handleRemoveFromEvent = async () => {
    if (!removeFromEventModal.applicationId) return;

    try {
      if (!appsDeleteUrl) throw new Error('Missing VITE_SERVER_BASE_URL');
      const res = await fetch(appsDeleteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: removeFromEventModal.applicationId }),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to remove artist from event');

      showSuccess('Künstler vom Event entfernt');
      loadArtists();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error removing artist from event:', error);
      showError(error.message || 'Fehler beim Entfernen des Künstlers vom Event');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
        <p className="text-gray-400 mt-4">Loading artists...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search artists by name, city, genre, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          New Artist
        </button>
      </div>

      {(creatingNew || editingArtist) && (
        <div className="bg-gray-800 rounded-lg border-2 border-cyan-500/50 p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            {creatingNew ? 'Create New Artist' : 'Edit Artist'}
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Artist name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="+1234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Genre</label>
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Genre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Photo URL</label>
              <input
                type="url"
                value={formData.photo_url}
                onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Website</label>
              <input
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Instagram</label>
              <input
                type="text"
                value={formData.instagram_handle}
                onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="@username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">YouTube</label>
              <input
                type="text"
                value={formData.youtube_channel}
                onChange={(e) => setFormData({ ...formData, youtube_channel: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Channel URL or ID"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Artist bio..."
              />
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
        <div className="text-sm text-gray-400">Total Artists</div>
        <div className="text-2xl font-bold text-white">{filteredArtists.length}</div>
      </div>

      {filteredArtists.length === 0 ? (
        <div className="text-center py-20">
          <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            {searchQuery ? 'No artists found matching your search' : 'No artists yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArtists.map((artist) => (
            <div key={artist.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex items-start gap-4">
                {artist.photo_url ? (
                  <img
                    src={artist.photo_url}
                    alt={artist.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Music className="w-10 h-10 text-cyan-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{artist.name}</h3>
                  <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-400 mb-3">
                    {artist.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {artist.city}
                      </div>
                    )}
                    {artist.genre && (
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        {artist.genre}
                      </div>
                    )}
                  </div>
                  {artist.bio && <p className="text-gray-400 text-sm mb-3">{artist.bio}</p>}

                  {artist.applications.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-300 mb-2">Events:</p>
                      <div className="flex flex-wrap gap-2">
                        {artist.applications.map((app: any) => (
                          <div
                            key={app.id}
                            className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-1 border border-gray-600"
                          >
                            <Calendar className="w-3 h-3 text-cyan-400" />
                            <span className="text-sm text-white">{app.event.title}</span>
                            <span className="text-xs text-gray-400">({app.preliminary_song_title || app.final_song_title})</span>
                            {app.status === 'accepted' && (
                              <CheckCircle className="w-3 h-3 text-green-400" />
                            )}
                            <button
                              onClick={() => setRemoveFromEventModal({ isOpen: true, applicationId: app.id, artistName: artist.name, eventTitle: app.event.title })}
                              className="p-1 hover:bg-red-500/20 rounded transition-colors"
                              title="Remove from event"
                            >
                              <Minus className="w-3 h-3 text-red-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleEdit(artist)}
                      className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg transition-all flex items-center gap-2 text-blue-400 text-sm font-medium"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>

                    <button
                      onClick={() => setSelectEventModal({ isOpen: true, artistId: artist.id })}
                      className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg transition-all flex items-center gap-2 text-green-400 text-sm font-medium"
                    >
                      <Plus className="w-3 h-3" />
                      Add to Event
                    </button>

                    <button
                      onClick={() => setDeleteModal({ isOpen: true, artistId: artist.id, artistName: artist.name })}
                      className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-all flex items-center gap-2 text-red-400 text-sm font-medium ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, artistId: null, artistName: null })}
        onConfirm={handleDelete}
        title="Künstler löschen"
        message={`Möchtest du "${deleteModal.artistName}" wirklich dauerhaft löschen?\n\nDies löscht auch:\n- Alle Bewerbungen\n- Alle Performances\n- Alle Bewertungen\n\nDiese Aktion kann nicht rückgängig gemacht werden!`}
        confirmText="Löschen"
        variant="danger"
      />

      <PromptModal
        isOpen={addToEventModal.isOpen}
        onClose={() => setAddToEventModal({ isOpen: false, artistId: null, eventId: null })}
        onSubmit={handleAddToEvent}
        title="Künstler zum Event hinzufügen"
        message="Songtitel für diese Bewerbung:"
        placeholder="z.B. Mein bester Song"
        submitText="Hinzufügen"
      />

      <SelectEventModal
        isOpen={selectEventModal.isOpen}
        onClose={() => setSelectEventModal({ isOpen: false, artistId: null })}
        onSelect={(eventId) => {
          setSelectEventModal({ isOpen: false, artistId: null });
          setAddToEventModal({ isOpen: true, artistId: selectEventModal.artistId, eventId });
        }}
        events={events.filter((e) => !e.archived).map((e) => ({ id: e.id, title: e.title }))}
        title="Event auswählen"
        message="Zu welchem Event soll der Künstler hinzugefügt werden?"
      />

      <ConfirmModal
        isOpen={removeFromEventModal.isOpen}
        onClose={() => setRemoveFromEventModal({ isOpen: false, applicationId: null, artistName: null, eventTitle: null })}
        onConfirm={handleRemoveFromEvent}
        title="Künstler vom Event entfernen"
        message={`Möchtest du "${removeFromEventModal.artistName}" wirklich von "${removeFromEventModal.eventTitle}" entfernen?\n\nDies entfernt auch alle Performances und Bewertungen.`}
        confirmText="Entfernen"
        variant="danger"
      />
    </div>
  );
}
