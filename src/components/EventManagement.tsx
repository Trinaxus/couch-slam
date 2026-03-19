import React, { useState } from 'react';
import { Event } from '../lib/supabase';
import { ConfirmModal } from './Modal';
import { CreditCard as Edit2, Trash2, Archive, ArchiveRestore, Save, X } from 'lucide-react';

interface EventManagementProps {
  events: Event[];
  onToggleLive: (event: Event) => void;
  onUpdateEvent: (eventId: string, updates: Partial<Event>) => void;
  onDeleteEvent: (eventId: string) => void;
  onArchiveEvent: (eventId: string, archived: boolean) => void;
}

export function EventManagement({
  events,
  onToggleLive,
  onUpdateEvent,
  onDeleteEvent,
  onArchiveEvent,
}: EventManagementProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Event>>({});
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; eventId: string | null; eventTitle: string | null }>({
    isOpen: false,
    eventId: null,
    eventTitle: null,
  });

  const filteredEvents = events.filter((event) => showArchived || !event.archived);

  const startEdit = (event: Event) => {
    setEditingId(event.id);
    setEditForm({
      title: event.title,
      description: event.description,
      event_date: event.event_date,
      stream_url: event.stream_url,
      youtube_video_id: event.youtube_video_id,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = (eventId: string) => {
    onUpdateEvent(eventId, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = () => {
    if (deleteModal.eventId) {
      onDeleteEvent(deleteModal.eventId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">All Events</h2>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-all"
        >
          {showArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          {showArchived ? 'Hide Archived' : 'Show Archived'}
        </button>
      </div>

      {filteredEvents.map((event) => (
        <div
          key={event.id}
          className={`bg-gray-800 rounded-lg p-6 border ${
            event.archived ? 'border-gray-600 opacity-75' : 'border-gray-700'
          }`}
        >
          {editingId === event.id ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Event Title</label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Event Date</label>
                <input
                  type="datetime-local"
                  value={editForm.event_date || ''}
                  onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Stream URL</label>
                <input
                  type="url"
                  value={editForm.stream_url || ''}
                  onChange={(e) => setEditForm({ ...editForm, stream_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  YouTube URLs werden automatisch konvertiert
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">YouTube Video ID (für Bonus-System)</label>
                <input
                  type="text"
                  value={editForm.youtube_video_id || ''}
                  onChange={(e) => setEditForm({ ...editForm, youtube_video_id: e.target.value })}
                  placeholder="dQw4w9WgXcQ"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Nur die Video-ID aus dem YouTube-Link (z.B. "dQw4w9WgXcQ" aus youtube.com/watch?v=dQw4w9WgXcQ)
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => saveEdit(event.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {event.is_live && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-red-400 font-semibold uppercase text-sm">Live</span>
                      </div>
                    )}
                    {event.archived && (
                      <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded">
                        ARCHIVED
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-white">{event.title}</h3>
                  </div>
                  <p className="text-gray-300 mb-2">{event.description}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(event.event_date).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleLive(event)}
                    disabled={event.archived}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      event.is_live
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    {event.is_live ? 'End Live' : 'Go Live'}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-gray-700">
                <button
                  onClick={() => startEdit(event)}
                  disabled={event.archived}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-400 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => onArchiveEvent(event.id, !event.archived)}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-all ${
                    event.archived
                      ? 'bg-green-500/20 hover:bg-green-500/30 border-green-500/50 text-green-400'
                      : 'bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/50 text-yellow-400'
                  }`}
                >
                  {event.archived ? (
                    <>
                      <ArchiveRestore className="w-4 h-4" />
                      Unarchive
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4" />
                      Archive
                    </>
                  )}
                </button>
                <button
                  onClick={() => setDeleteModal({ isOpen: true, eventId: event.id, eventTitle: event.title })}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Archive className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            {showArchived ? 'No archived events' : 'No events yet'}
          </p>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, eventId: null, eventTitle: null })}
        onConfirm={handleDelete}
        title="Event löschen"
        message={`Möchtest du "${deleteModal.eventTitle}" wirklich dauerhaft löschen?\n\nDies löscht auch:\n- Alle Bewerbungen\n- Alle Runden\n- Alle Performances\n- Alle Bewertungen\n- Show State\n- YouTube Bonus-Aktionen\n\nDiese Aktion kann nicht rückgängig gemacht werden!`}
        confirmText="Löschen"
        variant="danger"
      />
    </div>
  );
}
