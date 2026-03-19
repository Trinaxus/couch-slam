import React, { useState } from 'react';
import { Application, Artist, Event } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ConfirmModal, PromptModal, SelectEventModal } from './Modal';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Copy,
  Trash2,
  AlertCircle,
  MessageSquare,
  Calendar,
  Music,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ApplicationManagementProps {
  applications: (Application & { artist: Artist })[];
  events: Event[];
  currentEventId: string;
  onUpdate: () => void;
}

export function ApplicationManagement({
  applications,
  events,
  currentEventId,
  onUpdate,
}: ApplicationManagementProps) {
  const { user, token } = useAuth();
  const { showSuccess, showError } = useToast();
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});

  const serverBaseUrl = (import.meta.env.VITE_SERVER_BASE_URL as string | undefined) || '';
  const updateUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/applications_update.php?token=${encodeURIComponent(token)}` : '';
  const copyUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/applications_copy.php?token=${encodeURIComponent(token)}` : '';
  const deleteUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/applications_delete.php?token=${encodeURIComponent(token)}` : '';

  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; appId: string | null }>({
    isOpen: false,
    appId: null,
  });
  const [revertModal, setRevertModal] = useState<{ isOpen: boolean; appId: string | null }>({
    isOpen: false,
    appId: null,
  });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; appId: string | null; artistId: string | null }>({
    isOpen: false,
    appId: null,
    artistId: null,
  });
  const [copyModal, setCopyModal] = useState<{
    isOpen: boolean;
    app: (Application & { artist: Artist }) | null;
  }>({
    isOpen: false,
    app: null,
  });

  const handleAccept = async (appId: string) => {
    try {
      if (!updateUrl) throw new Error('Missing VITE_SERVER_BASE_URL');
      const res = await fetch(updateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: appId, status: 'accepted' }),
      });
      const data = (await res.json()) as any;
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to update application');

      showSuccess('Bewerbung angenommen! Gehe zu "Round Setup" um den Künstler einer Runde zuzuweisen.');
      onUpdate();
    } catch (error: any) {
      console.error('Error accepting application:', error);
      showError(error.message || 'Fehler beim Annehmen der Bewerbung');
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectModal.appId) return;

    try {
      if (!updateUrl) throw new Error('Missing VITE_SERVER_BASE_URL');
      const res = await fetch(updateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: rejectModal.appId, status: 'rejected', notes: reason || '' }),
      });
      const data = (await res.json()) as any;
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to update application');

      showSuccess('Bewerbung abgelehnt');
      onUpdate();
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      showError(error.message || 'Fehler beim Ablehnen der Bewerbung');
    }
  };

  const handleRevert = async () => {
    if (!revertModal.appId) return;

    try {
      if (!updateUrl) throw new Error('Missing VITE_SERVER_BASE_URL');
      const res = await fetch(updateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: revertModal.appId, status: 'submitted' }),
      });
      const data = (await res.json()) as any;
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to update application');

      showSuccess('Bewerbung zurückgesetzt. Performances wurden entfernt.');
      onUpdate();
    } catch (error: any) {
      console.error('Error reverting application:', error);
      showError(error.message || 'Fehler beim Zurücksetzen der Bewerbung');
    }
  };

  const handleCopyToEvent = async (eventId: string) => {
    if (!copyModal.app) return;

    const targetEvent = events.find(e => e.id === eventId);
    if (!targetEvent) {
      showError('Event nicht gefunden!');
      return;
    }

    try {
      if (!copyUrl) throw new Error('Missing VITE_SERVER_BASE_URL');
      const res = await fetch(copyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sourceApplicationId: copyModal.app.id, targetEventId: eventId }),
      });
      const data = (await res.json()) as any;
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to copy application');

      showSuccess(`Bewerbung kopiert zu "${targetEvent.title}"!`);
    } catch (error: any) {
      console.error('Error copying application:', error);
      showError(error.message || 'Fehler beim Kopieren der Bewerbung');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.appId || !deleteModal.artistId) return;

    try {
      if (!deleteUrl) throw new Error('Missing VITE_SERVER_BASE_URL');
      const res = await fetch(deleteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: deleteModal.appId }),
      });
      const data = (await res.json()) as any;
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to delete application');

      showSuccess('Bewerbung gelöscht');
      onUpdate();
    } catch (error: any) {
      console.error('Error deleting application:', error);
      showError(error.message || 'Fehler beim Löschen der Bewerbung');
    }
  };

  const handleSaveNotes = async (appId: string) => {
    try {
      if (!updateUrl) throw new Error('Missing VITE_SERVER_BASE_URL');
      const res = await fetch(updateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: appId, notes: notes[appId] || '' }),
      });
      const data = (await res.json()) as any;
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to update application');

      showSuccess('Notizen gespeichert!');
      onUpdate();
    } catch (error: any) {
      console.error('Error saving notes:', error);
      showError(error.message || 'Fehler beim Speichern der Notizen');
    }
  };

  if (applications.length === 0) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No applications for this event</p>
      </div>
    );
  }

  const pendingApps = applications.filter(a => a.status === 'submitted' || a.status === 'under_review');
  const acceptedApps = applications.filter(a => a.status === 'accepted');
  const rejectedApps = applications.filter(a => a.status === 'rejected');

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
          <div className="text-sm text-gray-400">Pending</div>
          <div className="text-2xl font-bold text-yellow-400">{pendingApps.length}</div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
          <div className="text-sm text-gray-400">Accepted</div>
          <div className="text-2xl font-bold text-green-400">{acceptedApps.length}</div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
          <div className="text-sm text-gray-400">Rejected</div>
          <div className="text-2xl font-bold text-red-400">{rejectedApps.length}</div>
        </div>
      </div>

      {[...pendingApps, ...acceptedApps, ...rejectedApps].map((app) => (
        <div key={app.id} className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1">
                {app.artist.photo_url ? (
                  <img
                    src={app.artist.photo_url}
                    alt={app.artist.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Music className="w-8 h-8 text-cyan-400" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-white">{app.artist.name}</h3>
                    <div
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        app.status === 'accepted'
                          ? 'bg-green-400/20 text-green-400 border border-green-400/30'
                          : app.status === 'rejected'
                          ? 'bg-red-400/20 text-red-400 border border-red-400/30'
                          : 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                      }`}
                    >
                      {app.status === 'accepted' ? 'Accepted' : app.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </div>
                  </div>
                  <div className="mb-2 space-y-1">
                    <p className="text-cyan-400 font-medium">
                      <span className="text-gray-500 text-xs">Vorrunde:</span> "{app.preliminary_song_title}"
                    </p>
                    <p className="text-electric-400 font-medium">
                      <span className="text-gray-500 text-xs">Finale:</span> "{app.final_song_title}"
                    </p>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    {app.artist.city && <p>City: {app.artist.city}</p>}
                    {app.artist.genre && <p>Genre: {app.artist.genre}</p>}
                    <p>Submitted: {new Date(app.created_at).toLocaleString()}</p>
                    {app.reviewed_at && (
                      <p className="text-xs">
                        Reviewed: {new Date(app.reviewed_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                {expandedApp === app.id ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>

            {expandedApp === app.id && (
              <div className="space-y-4 pt-4 border-t border-gray-700">
                {app.technical_requirements && (
                  <div>
                    <p className="text-sm font-semibold text-gray-300 mb-1">Technical Requirements:</p>
                    <p className="text-gray-400 text-sm">{app.technical_requirements}</p>
                  </div>
                )}

                {app.notes && (
                  <div>
                    <p className="text-sm font-semibold text-gray-300 mb-1">Notes:</p>
                    <p className="text-gray-400 text-sm">{app.notes}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-gray-300 mb-2 block">
                    Add/Edit Notes:
                  </label>
                  <div className="flex gap-2">
                    <textarea
                      value={notes[app.id] !== undefined ? notes[app.id] : app.notes || ''}
                      onChange={(e) => setNotes({ ...notes, [app.id]: e.target.value })}
                      rows={2}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Internal notes about this application..."
                    />
                    <button
                      onClick={() => handleSaveNotes(app.id)}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-all flex items-center gap-2 self-start"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {(app.status === 'submitted' || app.status === 'under_review') && (
                    <>
                      <button
                        onClick={() => handleAccept(app.id)}
                        className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg transition-all flex items-center gap-2 text-green-400 font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => setRejectModal({ isOpen: true, appId: app.id })}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-all flex items-center gap-2 text-red-400 font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}

                  {(app.status === 'accepted' || app.status === 'rejected') && (
                    <button
                      onClick={() => setRevertModal({ isOpen: true, appId: app.id })}
                      className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded-lg transition-all flex items-center gap-2 text-yellow-400 font-medium"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Revert to Pending
                    </button>
                  )}

                  <button
                    onClick={() => setCopyModal({ isOpen: true, app })}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg transition-all flex items-center gap-2 text-blue-400 font-medium"
                  >
                    <Copy className="w-4 h-4" />
                    Copy to Event
                  </button>

                  <button
                    onClick={() => setDeleteModal({ isOpen: true, appId: app.id, artistId: app.artist_id })}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-all flex items-center gap-2 text-red-400 font-medium ml-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      <PromptModal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, appId: null })}
        onSubmit={handleReject}
        title="Bewerbung ablehnen"
        message="Grund für die Ablehnung (optional):"
        placeholder="z.B. Passt nicht zum Event-Konzept"
        submitText="Ablehnen"
      />

      <ConfirmModal
        isOpen={revertModal.isOpen}
        onClose={() => setRevertModal({ isOpen: false, appId: null })}
        onConfirm={handleRevert}
        title="Bewerbung zurücksetzen"
        message="Möchtest du diese Bewerbung wirklich zurück auf 'Eingereicht' setzen? Alle zugewiesenen Performances werden entfernt."
        confirmText="Zurücksetzen"
        variant="warning"
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, appId: null, artistId: null })}
        onConfirm={handleDelete}
        title="Bewerbung löschen"
        message="Möchtest du diese Bewerbung wirklich dauerhaft löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmText="Löschen"
        variant="danger"
      />

      <SelectEventModal
        isOpen={copyModal.isOpen}
        onClose={() => setCopyModal({ isOpen: false, app: null })}
        onSelect={handleCopyToEvent}
        events={events
          .filter(e => e.id !== currentEventId && !e.archived)
          .map(e => ({ id: e.id, title: e.title }))}
        title="Bewerbung zu Event kopieren"
        message="Wähle das Ziel-Event aus:"
      />
    </div>
  );
}
