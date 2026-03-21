import React, { useEffect, useState } from 'react';
import { Event, Application, Artist, Performance, ShowState, Round } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ConfirmModal } from '../components/Modal';
import { RoundControl } from '../components/RoundControl';
import { RoundSetup } from '../components/RoundSetup';
import { EventManagement } from '../components/EventManagement';
import { RoundArtistAssignment } from '../components/RoundArtistAssignment';
import { ApplicationManagement } from '../components/ApplicationManagement';
import { ArtistManagement } from '../components/ArtistManagement';
import {
  Plus,
  Calendar,
  Users,
  Radio,
  AlertCircle,
  ListOrdered,
  Music2,
} from 'lucide-react';

type ApplicationWithArtist = Application & { artist: Artist };
type PerformanceWithArtist = Performance & { artist: Artist };

export function AdminPanel() {
  const { token } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'events' | 'artists' | 'applications' | 'round-setup' | 'show-control' | 'users'>('events');
  const [artistManagementInitialEditId, setArtistManagementInitialEditId] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [applications, setApplications] = useState<ApplicationWithArtist[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [performances, setPerformances] = useState<PerformanceWithArtist[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [showState, setShowState] = useState<ShowState | null>(null);
  const [manualCurrentRoundId, setManualCurrentRoundId] = useState<string>('');

  const [selectedRoundSetupEvent, setSelectedRoundSetupEvent] = useState<Event | null>(null);
  const [roundSetupRounds, setRoundSetupRounds] = useState<Round[]>([]);
  const [roundSetupPerformances, setRoundSetupPerformances] = useState<PerformanceWithArtist[]>([]);
  const [loading, setLoading] = useState(true);

  const [usersLoading, setUsersLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [openArtistRequestCount, setOpenArtistRequestCount] = useState(0);
  const [openArtistRequestsByUserId, setOpenArtistRequestsByUserId] = useState<Record<string, string>>({});
  const [resolvingArtistRequestUserId, setResolvingArtistRequestUserId] = useState<string | null>(null);

  const serverBaseUrl = (import.meta.env.VITE_SERVER_BASE_URL as string | undefined) || '';
  const usersListUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/users_list.php` : '';
  const usersUpdateUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/users_update.php` : '';
  const artistRequestsCountUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/artist_requests_count.php` : '';
  const artistRequestsListUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/artist_requests_list.php` : '';
  const artistRequestResolveUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/artist_request_resolve.php` : '';

  const eventsListUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/events_list.php` : '';
  const eventsCreateUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/events_create.php` : '';
  const eventsUpdateUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/events_update.php` : '';
  const eventsDeleteUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/events_delete.php` : '';

  const applicationsListUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/applications_list.php` : '';

  const roundsListUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/rounds_list.php` : '';
  const roundsCreateUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/rounds_create.php` : '';
  const roundsUpdateUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/rounds_update.php` : '';
  const performancesListUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/performances_list.php` : '';
  const performancesAdvanceToFinalUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/performances_advance_to_final.php` : '';
  const performancesDeleteUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/performances_delete.php` : '';
  const showStateGetUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/show_state_get.php` : '';
  const showStateUpsertUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/show_state_upsert.php` : '';

  const usersListUrlWithToken = usersListUrl && token ? `${usersListUrl}?token=${encodeURIComponent(token)}` : usersListUrl;
  const usersUpdateUrlWithToken = usersUpdateUrl && token ? `${usersUpdateUrl}?token=${encodeURIComponent(token)}` : usersUpdateUrl;
  const artistRequestsCountUrlWithToken = artistRequestsCountUrl && token ? `${artistRequestsCountUrl}?token=${encodeURIComponent(token)}` : artistRequestsCountUrl;
  const artistRequestsListUrlWithToken = artistRequestsListUrl && token ? `${artistRequestsListUrl}?token=${encodeURIComponent(token)}` : artistRequestsListUrl;
  const artistRequestResolveUrlWithToken = artistRequestResolveUrl && token ? `${artistRequestResolveUrl}?token=${encodeURIComponent(token)}` : artistRequestResolveUrl;

  const eventsListUrlWithToken = eventsListUrl && token ? `${eventsListUrl}?token=${encodeURIComponent(token)}` : eventsListUrl;
  const eventsCreateUrlWithToken = eventsCreateUrl && token ? `${eventsCreateUrl}?token=${encodeURIComponent(token)}` : eventsCreateUrl;
  const eventsUpdateUrlWithToken = eventsUpdateUrl && token ? `${eventsUpdateUrl}?token=${encodeURIComponent(token)}` : eventsUpdateUrl;
  const eventsDeleteUrlWithToken = eventsDeleteUrl && token ? `${eventsDeleteUrl}?token=${encodeURIComponent(token)}` : eventsDeleteUrl;

  const applicationsListUrlWithToken = applicationsListUrl && token ? `${applicationsListUrl}?token=${encodeURIComponent(token)}` : applicationsListUrl;

  const roundsListUrlWithToken = roundsListUrl && token ? `${roundsListUrl}?token=${encodeURIComponent(token)}` : roundsListUrl;
  const roundsCreateUrlWithToken = roundsCreateUrl && token ? `${roundsCreateUrl}?token=${encodeURIComponent(token)}` : roundsCreateUrl;
  const roundsUpdateUrlWithToken = roundsUpdateUrl && token ? `${roundsUpdateUrl}?token=${encodeURIComponent(token)}` : roundsUpdateUrl;
  const performancesListUrlWithToken = performancesListUrl && token ? `${performancesListUrl}?token=${encodeURIComponent(token)}` : performancesListUrl;
  const performancesAdvanceToFinalUrlWithToken = performancesAdvanceToFinalUrl && token ? `${performancesAdvanceToFinalUrl}?token=${encodeURIComponent(token)}` : performancesAdvanceToFinalUrl;
  const performancesDeleteUrlWithToken = performancesDeleteUrl && token ? `${performancesDeleteUrl}?token=${encodeURIComponent(token)}` : performancesDeleteUrl;
  const showStateGetUrlWithToken = showStateGetUrl && token ? `${showStateGetUrl}?token=${encodeURIComponent(token)}` : showStateGetUrl;
  const showStateUpsertUrlWithToken = showStateUpsertUrl && token ? `${showStateUpsertUrl}?token=${encodeURIComponent(token)}` : showStateUpsertUrl;

  const [showRoundSetup, setShowRoundSetup] = useState(false);
  const [deletePerformanceModal, setDeletePerformanceModal] = useState<{ isOpen: boolean; performanceId: string | null }>({
    isOpen: false,
    performanceId: null,
  });

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_date: '',
    stream_url: '',
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadUsers = async () => {
    if (!usersListUrlWithToken) {
      showError('Missing VITE_SERVER_BASE_URL');
      return;
    }

    try {
      setUsersLoading(true);
      const res = await fetch(usersListUrlWithToken, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = (await res.json()) as any;
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to load users');
      }
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (e: any) {
      showError(e?.message || 'Fehler beim Laden der User');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSetCurrentRound = async (roundId: string, opts?: { activate?: boolean }) => {
    if (!selectedEvent) return;

    try {
      if (!showStateUpsertUrlWithToken) {
        showError('Missing VITE_SERVER_BASE_URL');
        return;
      }

      if (opts?.activate) {
        if (!roundsUpdateUrlWithToken) {
          showError('Missing VITE_SERVER_BASE_URL');
          return;
        }

        const roundRes = await fetch(roundsUpdateUrlWithToken, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id: roundId, status: 'active', started_at: new Date().toISOString() }),
        });
        const roundJson = (await roundRes.json()) as any;
        if (!roundRes.ok || !roundJson?.ok) throw new Error(roundJson?.error || 'Failed to activate round');
      }

      const ssRes = await fetch(showStateUpsertUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_id: selectedEvent.id, current_round_id: roundId, current_performance_id: null }),
      });
      const ssJson = (await ssRes.json()) as any;
      if (!ssRes.ok || !ssJson?.ok) throw new Error(ssJson?.error || 'Failed to update show state');

      await loadRounds(selectedEvent.id);
      await loadShowState(selectedEvent.id);
      showSuccess(opts?.activate ? 'Runde aktiviert und als Current gesetzt.' : 'Current Round gesetzt.');
    } catch (error: any) {
      console.error('Error setting current round:', error);
      showError(error.message || 'Fehler beim Setzen der Runde');
    }
  };

  const renderUsersTable = (title: string, list: any[]) => {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-gray-400 text-sm">{list.length} User</p>
          </div>
          <button
            onClick={() => void loadUsers()}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
            disabled={usersLoading}
          >
            Refresh
          </button>
        </div>

        {usersLoading ? (
          <div className="text-gray-300 mt-6">Loading users...</div>
        ) : list.length === 0 ? (
          <div className="text-gray-400 mt-6">Keine User gefunden.</div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="py-2 pr-4">E-Mail</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Artist-Profil</th>
                  <th className="py-2 pr-4">Anfrage</th>
                  <th className="py-2 pr-4">Access</th>
                  <th className="py-2 pr-4">Typ</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id} className="border-b border-gray-800">
                    <td className="py-3 pr-4 text-white whitespace-nowrap">{u.email}</td>
                    <td className="py-3 pr-4 text-gray-300 whitespace-nowrap">{u.display_name || ''}</td>
                    <td className="py-3 pr-4">
                      {u.artist__id ? (
                        <div className="flex items-center gap-2">
                          {u.artist__photo_url ? (
                            <img
                              src={String(u.artist__photo_url)}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover border border-gray-600"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gray-700 border border-gray-600" />
                          )}
                          <span className="text-gray-200 text-sm whitespace-nowrap">{String(u.artist__name || '')}</span>
                          <button
                            onClick={() => {
                              setArtistManagementInitialEditId(String(u.artist__id));
                              setActiveTab('artists');
                            }}
                            className="ml-2 px-2 py-1 rounded-lg text-xs font-semibold bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 transition-all"
                          >
                            Profil bearbeiten
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-xs">-</span>
                          {String(u.user_type || 'audience') === 'artist' && (
                            <button
                              onClick={() => void updateUser(String(u.id), { userType: 'artist' })}
                              className="px-2 py-1 rounded-lg text-xs font-semibold bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600 transition-all"
                            >
                              Profil erzeugen
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {openArtistRequestsByUserId[String(u.id)] ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                            offen
                          </span>
                          <button
                            onClick={() => void resolveArtistRequest(String(u.id), 'approve')}
                            className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                            disabled={resolvingArtistRequestUserId === String(u.id)}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => void resolveArtistRequest(String(u.id), 'decline')}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                            disabled={resolvingArtistRequestUserId === String(u.id)}
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                        value={u.access_role || 'user'}
                        onChange={(e) => {
                          const accessRole = e.target.value;
                          setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, access_role: accessRole } : x)));
                        }}
                      >
                        <option value="user">user</option>
                        <option value="helper">helper</option>
                        <option value="team">team</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                        value={u.user_type || 'audience'}
                        onChange={(e) => {
                          const userType = e.target.value;
                          setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, user_type: userType } : x)));
                        }}
                      >
                        <option value="audience">audience</option>
                        <option value="artist">artist</option>
                      </select>
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => void updateUser(String(u.id), { accessRole: String(u.access_role || 'user'), userType: String(u.user_type || 'audience') })}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-all"
                      >
                        Speichern
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const updateUser = async (userId: string, patch: { accessRole?: string; userType?: string }) => {
    if (!usersUpdateUrlWithToken) {
      showError('Missing VITE_SERVER_BASE_URL');
      return;
    }

    try {
      const res = await fetch(usersUpdateUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, ...patch }),
      });
      const data = (await res.json()) as any;
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to update user');
      }
      showSuccess('User aktualisiert');
      await loadUsers();
    } catch (e: any) {
      showError(e?.message || 'Fehler beim Aktualisieren');
    }
  };

  useEffect(() => {
    if (events.length > 0 && !selectedRoundSetupEvent) {
      const activeEvents = events.filter((e) => !e.archived);
      setSelectedRoundSetupEvent(activeEvents.length > 0 ? activeEvents[0] : events[0]);
    }
  }, [events]);

  useEffect(() => {
    if (activeTab === 'users') {
      void loadUsers();
      void loadArtistRequests();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'show-control') return;
    const desired = String(showState?.current_round_id || '');
    if (desired) {
      setManualCurrentRoundId(desired);
      return;
    }
    if (!manualCurrentRoundId && rounds.length > 0) {
      setManualCurrentRoundId(String(rounds[0].id));
    }
  }, [activeTab, showState?.current_round_id, rounds.length]);

  const loadArtistRequests = async () => {
    if (!artistRequestsCountUrlWithToken || !artistRequestsListUrlWithToken) {
      return;
    }

    try {
      const [countRes, listRes] = await Promise.all([
        fetch(artistRequestsCountUrlWithToken, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${artistRequestsListUrlWithToken}${artistRequestsListUrlWithToken.includes('?') ? '&' : '?'}status=open`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const countJson = (await countRes.json()) as any;
      const listJson = (await listRes.json()) as any;

      if (countRes.ok && countJson?.ok) {
        setOpenArtistRequestCount(Number(countJson?.count || 0));
      }

      if (listRes.ok && listJson?.ok) {
        const map: Record<string, string> = {};
        (Array.isArray(listJson?.requests) ? listJson.requests : []).forEach((r: any) => {
          const uid = String(r?.user_id || '');
          const rid = String(r?.id || '');
          if (uid && rid) {
            map[uid] = rid;
          }
        });
        setOpenArtistRequestsByUserId(map);
      }
    } catch {
      // ignore
    }
  };

  const resolveArtistRequest = async (userId: string, action: 'approve' | 'decline') => {
    const requestId = openArtistRequestsByUserId[String(userId)] || '';
    if (!requestId || !artistRequestResolveUrlWithToken) {
      return;
    }

    try {
      setResolvingArtistRequestUserId(String(userId));
      const res = await fetch(artistRequestResolveUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, action }),
      });
      const data = (await res.json()) as any;
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to resolve request');
      }

      showSuccess(action === 'approve' ? 'Artist freigeschaltet' : 'Anfrage abgelehnt');
      await loadUsers();
      await loadArtistRequests();
    } catch (e: any) {
      showError(e?.message || 'Fehler beim Bearbeiten der Anfrage');
    } finally {
      setResolvingArtistRequestUserId(null);
    }
  };

  useEffect(() => {
    if (activeTab !== 'show-control') return;
    if (!selectedEvent) return;
    void loadPerformances(selectedEvent.id);
    void loadRounds(selectedEvent.id);
    void loadShowState(selectedEvent.id);
  }, [activeTab, selectedEvent?.id]);

  useEffect(() => {
    if (selectedRoundSetupEvent) {
      void loadRoundSetupRounds(selectedRoundSetupEvent.id);
      void loadRoundSetupPerformances(selectedRoundSetupEvent.id);
    }
  }, [selectedRoundSetupEvent?.id]);

  useEffect(() => {
    if (selectedEvent) {
      void loadApplications(selectedEvent.id);
    }
  }, [selectedEvent?.id]);

  const loadRoundSetupRounds = async (eventId: string) => {
    try {
      if (!roundsListUrlWithToken) {
        showError('Missing VITE_SERVER_BASE_URL');
        return;
      }

      const url = `${roundsListUrlWithToken}${roundsListUrlWithToken.includes('?') ? '&' : '?'}event_id=${encodeURIComponent(eventId)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to load rounds');
      }
      setRoundSetupRounds(Array.isArray(json.rounds) ? json.rounds : []);
    } catch (error) {
      console.error('Error loading round setup rounds:', error);
    }
  };

  const loadRoundSetupPerformances = async (eventId: string) => {
    try {
      if (!performancesListUrlWithToken) {
        showError('Missing VITE_SERVER_BASE_URL');
        return;
      }

      const url = `${performancesListUrlWithToken}${performancesListUrlWithToken.includes('?') ? '&' : '?'}event_id=${encodeURIComponent(eventId)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to load performances');
      }
      setRoundSetupPerformances(Array.isArray(json.performances) ? json.performances : []);
    } catch (error) {
      console.error('Error loading round setup performances:', error);
    }
  };

  const loadEvents = async () => {
    try {
      if (!eventsListUrlWithToken) {
        showError('Missing VITE_SERVER_BASE_URL');
        return;
      }

      const res = await fetch(eventsListUrlWithToken, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to load events');
      }

      const list = Array.isArray(json.events) ? (json.events as Event[]) : [];
      setEvents(list);

      if (list.length > 0 && !selectedEvent) {
        const activeEvents = list.filter((e) => !e.archived);
        setSelectedEvent(activeEvents.length > 0 ? activeEvents[0] : list[0]);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async (eventId: string) => {
    try {
      if (!applicationsListUrlWithToken) {
        showError('Missing VITE_SERVER_BASE_URL');
        return;
      }

      const url = `${applicationsListUrlWithToken}${applicationsListUrlWithToken.includes('?') ? '&' : '?'}event_id=${encodeURIComponent(eventId)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to load applications');
      }
      setApplications(Array.isArray(json.applications) ? json.applications : []);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  const loadPerformances = async (eventId: string) => {
    try {
      if (!performancesListUrlWithToken) {
        showError('Missing VITE_SERVER_BASE_URL');
        return;
      }

      const url = `${performancesListUrlWithToken}${performancesListUrlWithToken.includes('?') ? '&' : '?'}event_id=${encodeURIComponent(eventId)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to load performances');

      setPerformances(Array.isArray(json.performances) ? json.performances : []);
    } catch (error: any) {
      console.error('Error loading performances:', error);
      showError(error?.message || 'Fehler beim Laden der Performances');
    }
  };

  const loadRounds = async (eventId: string) => {
    try {
      if (!roundsListUrlWithToken) {
        showError('Missing VITE_SERVER_BASE_URL');
        return;
      }

      const url = `${roundsListUrlWithToken}${roundsListUrlWithToken.includes('?') ? '&' : '?'}event_id=${encodeURIComponent(eventId)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to load rounds');

      setRounds(Array.isArray(json.rounds) ? json.rounds : []);
    } catch (error: any) {
      console.error('Error loading rounds:', error);
      showError(error?.message || 'Fehler beim Laden der Runden');
    }
  };

  const loadShowState = async (eventId: string) => {
    try {
      if (!showStateGetUrlWithToken) {
        showError('Missing VITE_SERVER_BASE_URL');
        return;
      }

      const url = `${showStateGetUrlWithToken}${showStateGetUrlWithToken.includes('?') ? '&' : '?'}event_id=${encodeURIComponent(eventId)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to load show state');

      setShowState(json.show_state || null);
    } catch (error: any) {
      console.error('Error loading show state:', error);
      showError(error?.message || 'Fehler beim Laden von Show State');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!eventsCreateUrlWithToken) {
        showError('Missing VITE_SERVER_BASE_URL');
        return;
      }

      const res = await fetch(eventsCreateUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: eventForm.title,
          description: eventForm.description,
          event_date: eventForm.event_date,
          stream_url: eventForm.stream_url,
        }),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to create event');
      }

      showSuccess('Event erfolgreich erstellt!');
      setEventForm({
        title: '',
        description: '',
        event_date: '',
        stream_url: '',
      });
      await loadEvents();
    } catch (error: any) {
      console.error('Error creating event:', error);
      showError(error.message || 'Fehler beim Erstellen des Events');
    }
  };

  const handleToggleLive = async (event: Event) => {
    try {
      if (!eventsUpdateUrlWithToken) {
        showError('Missing VITE_SERVER_BASE_URL');
        return;
      }

      const res = await fetch(eventsUpdateUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: event.id, is_live: !event.is_live }),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to update event');
      }

      showSuccess(event.is_live ? 'Event live beendet!' : 'Event ist jetzt live!');
      await loadEvents();
    } catch (error: any) {
      console.error('Error toggling live:', error);
      showError(error.message || 'Fehler beim Aktualisieren des Live-Status');
    }
  };

  const handleUpdateEvent = async (eventId: string, updates: Partial<Event>) => {
    try {
      if (!eventsUpdateUrlWithToken) {
        showError('Missing VITE_SERVER_BASE_URL');
        return;
      }

      const res = await fetch(eventsUpdateUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: eventId, ...updates }),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to update event');
      }

      showSuccess('Event erfolgreich aktualisiert!');
      await loadEvents();
    } catch (error: any) {
      console.error('Error updating event:', error);
      showError(error.message || 'Fehler beim Aktualisieren des Events');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      if (!eventsDeleteUrlWithToken) {
        showError('Missing VITE_SERVER_BASE_URL');
        return;
      }

      const res = await fetch(eventsDeleteUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: eventId }),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to delete event');
      }

      showSuccess('Event erfolgreich gelöscht!');
      await loadEvents();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      showError(error.message || 'Fehler beim Löschen des Events');
    }
  };

  const handleArchiveEvent = async (eventId: string, archived: boolean) => {
    try {
      if (!eventsUpdateUrlWithToken) {
        showError('Missing VITE_SERVER_BASE_URL');
        return;
      }

      const res = await fetch(eventsUpdateUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: eventId, archived }),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to archive event');
      }

      showSuccess(archived ? 'Event archiviert!' : 'Event wiederhergestellt!');
      await loadEvents();
    } catch (error: any) {
      console.error('Error archiving event:', error);
      showError(error.message || 'Fehler beim Archivieren des Events');
    }
  };

  const handleStartRound = async (roundId: string) => {
    if (!selectedEvent) return;

    try {
      if (!roundsUpdateUrlWithToken || !showStateUpsertUrlWithToken) {
        showError('Missing VITE_SERVER_BASE_URL');
        return;
      }

      const roundRes = await fetch(roundsUpdateUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: roundId, status: 'active', started_at: new Date().toISOString() }),
      });
      const roundJson = (await roundRes.json()) as any;
      if (!roundRes.ok || !roundJson?.ok) throw new Error(roundJson?.error || 'Failed to start round');

      const ssRes = await fetch(showStateUpsertUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_id: selectedEvent.id, current_round_id: roundId, voting_open: false }),
      });
      const ssJson = (await ssRes.json()) as any;
      if (!ssRes.ok || !ssJson?.ok) throw new Error(ssJson?.error || 'Failed to update show state');

      await loadRounds(selectedEvent.id);
      await loadShowState(selectedEvent.id);
    } catch (error: any) {
      console.error('Error starting round:', error);
      showError(error.message || 'Fehler beim Starten der Runde');
    }
  };

  const handleCompleteRound = async (roundId: string) => {
    if (!selectedEvent) return;

    try {
      if (!roundsUpdateUrlWithToken) {
        showError('Missing VITE_SERVER_BASE_URL');
        return;
      }

      const res = await fetch(roundsUpdateUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: roundId, status: 'completed', completed_at: new Date().toISOString() }),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to complete round');
      await loadRounds(selectedEvent.id);
    } catch (error: any) {
      console.error('Error completing round:', error);
      showError(error.message || 'Fehler beim Abschließen der Runde');
    }
  };

  const handleSetCurrentPerformance = async (performanceId: string | null) => {
    if (!selectedEvent) return;

    try {
      if (!showStateUpsertUrlWithToken) {
        showError('Missing VITE_SERVER_BASE_URL');
        return;
      }

      const res = await fetch(showStateUpsertUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_id: selectedEvent.id, current_performance_id: performanceId }),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to set current performance');
      await loadShowState(selectedEvent.id);
    } catch (error: any) {
      console.error('Error setting current performance:', error);
      showError(error.message || 'Fehler beim Setzen der aktuellen Performance');
    }
  };

  const handleToggleVoting = async (roundId: string) => {
    if (!selectedEvent) return;

    const round = rounds.find((r) => r.id === roundId);
    if (!round) return;

    try {
      if (!roundsUpdateUrlWithToken || !showStateUpsertUrlWithToken) {
        showError('Missing VITE_SERVER_BASE_URL');
        return;
      }

      const roundRes = await fetch(roundsUpdateUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: roundId, voting_open: !round.voting_open }),
      });
      const roundJson = (await roundRes.json()) as any;
      if (!roundRes.ok || !roundJson?.ok) throw new Error(roundJson?.error || 'Failed to toggle voting');

      const ssRes = await fetch(showStateUpsertUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_id: selectedEvent.id, voting_open: !round.voting_open, voting_ends_at: null }),
      });
      const ssJson = (await ssRes.json()) as any;
      if (!ssRes.ok || !ssJson?.ok) throw new Error(ssJson?.error || 'Failed to update show state');

      await loadRounds(selectedEvent.id);
      await loadShowState(selectedEvent.id);
    } catch (error: any) {
      console.error('Error toggling voting:', error);
      showError(error.message || 'Fehler beim Umschalten der Abstimmung');
    }
  };

  const handleCreateRounds = async (roundConfigs: Array<{ round_number: number; round_type: 'preliminary' | 'final'; max_participants: number | null }>) => {
    if (!selectedRoundSetupEvent) return;

    try {
      if (!roundsCreateUrlWithToken) {
        showError('Missing VITE_SERVER_BASE_URL');
        return;
      }

      const res = await fetch(roundsCreateUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          event_id: selectedRoundSetupEvent.id,
          rounds: roundConfigs.map((c) => ({
            round_number: c.round_number,
            round_type: c.round_type,
            max_participants: c.max_participants,
            status: 'upcoming',
          })),
        }),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to create rounds');
      }

      await loadRoundSetupRounds(selectedRoundSetupEvent.id);
      await loadRoundSetupPerformances(selectedRoundSetupEvent.id);
      setShowRoundSetup(false);
      showSuccess(`${roundConfigs.length} Runden erstellt! Performances wurden Runde 1 zugewiesen.`);
    } catch (error: any) {
      console.error('Error creating rounds:', error);
      showError(error.message || 'Fehler beim Erstellen der Runden');
    }
  };

  const handleUpdateRound = async (roundId: string, updates: Partial<Round>) => {
    if (!selectedEvent) return;

    try {
      if (!roundsUpdateUrlWithToken) {
        showError('Missing VITE_SERVER_BASE_URL');
        return;
      }

      const res = await fetch(roundsUpdateUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: roundId, ...updates }),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to update round');
      await loadRounds(selectedEvent.id);
      showSuccess('Runde erfolgreich aktualisiert');
    } catch (error: any) {
      console.error('Error updating round:', error);
      showError(error.message || 'Fehler beim Aktualisieren der Runde');
    }
  };

  const handleAdvanceToFinal = async (performanceId: string) => {
    if (!selectedEvent) return;

    try {
      if (!performancesAdvanceToFinalUrlWithToken) {
        showError('Missing VITE_SERVER_BASE_URL');
        return;
      }

      const res = await fetch(performancesAdvanceToFinalUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_id: selectedEvent.id, performance_id: performanceId }),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to advance to final');

      await loadPerformances(selectedEvent.id);
      showSuccess('Künstler zur Finalrunde hinzugefügt');
    } catch (error: any) {
      console.error('Error advancing to final:', error);
      showError(error.message || 'Fehler beim Hinzufügen zur Finalrunde');
    }
  };

  const handleDeletePerformance = async () => {
    if (!selectedEvent) return;
    if (!deletePerformanceModal.performanceId) return;

    try {
      if (!performancesDeleteUrlWithToken) {
        showError('Missing VITE_SERVER_BASE_URL');
        return;
      }

      const res = await fetch(performancesDeleteUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: deletePerformanceModal.performanceId }),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to delete performance');

      await loadPerformances(selectedEvent.id);
      showSuccess('Performance gelöscht');
      setDeletePerformanceModal({ isOpen: false, performanceId: null });
    } catch (error: any) {
      console.error('Error deleting performance:', error);
      showError(error.message || 'Fehler beim Löschen der Performance');
    }
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
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
        <p className="text-gray-400">Manage events, applications, and show controls</p>
      </div>

      <div className="flex gap-2 border-b border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'events'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Calendar className="w-5 h-5 inline mr-2" />
          Events
        </button>
        <button
          onClick={() => setActiveTab('artists')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'artists'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Music2 className="w-5 h-5 inline mr-2" />
          Artists
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'applications'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-5 h-5 inline mr-2" />
          Applications
        </button>
        <button
          onClick={() => setActiveTab('round-setup')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'round-setup'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <ListOrdered className="w-5 h-5 inline mr-2" />
          Round Setup
        </button>
        <button
          onClick={() => setActiveTab('show-control')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'show-control'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Radio className="w-5 h-5 inline mr-2" />
          Show Control
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'users'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <span>Users</span>
            {openArtistRequestCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white">
                {openArtistRequestCount}
              </span>
            )}
          </span>
        </button>
      </div>

      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-6 h-6" />
              Create New Event
            </h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Event Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={eventForm.event_date}
                    onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stream URL (YouTube, etc.)
                </label>
                <input
                  type="url"
                  value={eventForm.stream_url}
                  onChange={(e) => setEventForm({ ...eventForm, stream_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  YouTube URLs werden automatisch konvertiert
                </p>
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all"
              >
                Create Event
              </button>
            </form>
          </div>

          <EventManagement
            events={events}
            onToggleLive={handleToggleLive}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onArchiveEvent={handleArchiveEvent}
          />
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">User Verwaltung</h2>
                <p className="text-gray-400 text-sm">Rollen (admin/user/helper/team) und Typ (audience/artist) ändern</p>
              </div>
            </div>
          </div>

          {renderUsersTable(
            'Admins',
            users.filter((u) => String(u.access_role || 'user') === 'admin')
          )}

          {renderUsersTable(
            'User',
            users.filter(
              (u) =>
                String(u.access_role || 'user') !== 'admin' &&
                String(u.user_type || 'audience') !== 'artist'
            )
          )}

          {renderUsersTable(
            'Artists',
            users.filter(
              (u) =>
                String(u.access_role || 'user') !== 'admin' &&
                String(u.user_type || 'audience') === 'artist'
            )
          )}
        </div>
      )}

      {activeTab === 'artists' && (
        <ArtistManagement
          events={events}
          onUpdate={loadEvents}
          initialEditArtistId={artistManagementInitialEditId}
          onInitialEditHandled={() => setArtistManagementInitialEditId(null)}
        />
      )}

      {activeTab === 'applications' && (
        <div className="space-y-6">
          <div className="flex gap-2 overflow-x-auto">
            {events.filter(e => !e.archived).map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedEvent?.id === event.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
                }`}
              >
                {event.title}
              </button>
            ))}
          </div>

          {selectedEvent && (
            <>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h2 className="text-lg font-semibold text-white">{selectedEvent.title}</h2>
                <p className="text-sm text-gray-400">
                  {applications.length} application{applications.length !== 1 ? 's' : ''}
                </p>
              </div>

              <ApplicationManagement
                applications={applications}
                events={events}
                currentEventId={selectedEvent.id}
                onUpdate={() => loadApplications(selectedEvent.id)}
              />
            </>
          )}
        </div>
      )}

      {activeTab === 'round-setup' && (
        <div className="space-y-6">
          <div className="flex gap-2 overflow-x-auto">
            {events.filter(e => !e.archived).map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedRoundSetupEvent(event)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedRoundSetupEvent?.id === event.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
                }`}
              >
                {event.title}
              </button>
            ))}
          </div>

          {selectedRoundSetupEvent && (
            <>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h2 className="text-lg font-semibold text-white">{selectedRoundSetupEvent.title}</h2>
                <p className="text-sm text-gray-400">
                  {roundSetupRounds.length} round{roundSetupRounds.length !== 1 ? 's' : ''}
                </p>
              </div>

              {roundSetupRounds.length === 0 ? (
                showRoundSetup ? (
                  <RoundSetup onCreateRounds={handleCreateRounds} onCancel={() => setShowRoundSetup(false)} />
                ) : (
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
                    <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                    <p className="text-gray-400 mb-4">No rounds configured for this event</p>
                    <button
                      onClick={() => setShowRoundSetup(true)}
                      className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2 mx-auto"
                    >
                      <Plus className="w-5 h-5" />
                      Create Rounds
                    </button>
                  </div>
                )
              ) : (
                <RoundArtistAssignment
                  eventId={selectedRoundSetupEvent.id}
                  rounds={roundSetupRounds}
                  performances={roundSetupPerformances}
                  onUpdate={() => {
                    void loadRoundSetupPerformances(selectedRoundSetupEvent.id);
                    void loadRoundSetupRounds(selectedRoundSetupEvent.id);
                  }}
                />
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'show-control' && (
        <div className="space-y-6">
          <div className="flex gap-2 overflow-x-auto">
            {events.filter(e => !e.archived).map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedEvent?.id === event.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
                }`}
              >
                {event.is_live && <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />}
                {event.title}
              </button>
            ))}
          </div>

          {selectedEvent && (
            <>
              {(() => {
                const showActive =
                  !!selectedEvent.is_live &&
                  !!showState &&
                  (showState.voting_open || !!showState.current_round_id || !!showState.current_performance_id);

                return (
              <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-lg p-6 border border-cyan-500/30">
                <h2 className="text-2xl font-bold text-white mb-2">{selectedEvent.title}</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Status:</span>
                    <span className={`font-semibold ${showActive ? 'text-red-400' : 'text-gray-400'}`}>
                      {showActive ? 'LIVE' : 'Offline'}
                    </span>
                  </div>
                  {showState && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Voting:</span>
                      <span className={`font-semibold ${showState.voting_open ? 'text-green-400' : 'text-gray-400'}`}>
                        {showState.voting_open ? 'OPEN' : 'Closed'}
                      </span>
                    </div>
                  )}
                  {showState?.current_round_id && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Current Round:</span>
                      <span className="font-semibold text-cyan-400">
                        Round {rounds.find((r) => r.id === showState.current_round_id)?.round_number}
                      </span>
                    </div>
                  )}
                </div>

                {rounds.length > 0 && (
                  <div className="mt-5 flex flex-wrap items-end gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Current Round manuell setzen</label>
                      <select
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                        value={manualCurrentRoundId || ''}
                        onChange={(e) => setManualCurrentRoundId(e.target.value)}
                      >
                        {rounds
                          .slice()
                          .sort((a, b) => a.round_number - b.round_number)
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              Round {r.round_number} ({r.status})
                            </option>
                          ))}
                      </select>
                    </div>

                    <button
                      onClick={() => manualCurrentRoundId && void handleSetCurrentRound(manualCurrentRoundId)}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition-all"
                      disabled={!manualCurrentRoundId}
                      title="Setzt nur show_state.current_round_id (ohne Status-Änderung)"
                    >
                      Set Current
                    </button>

                    <button
                      onClick={() => manualCurrentRoundId && void handleSetCurrentRound(manualCurrentRoundId, { activate: true })}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-all"
                      disabled={!manualCurrentRoundId}
                      title="Setzt Runde auf ACTIVE (falls nötig) und setzt sie als Current Round"
                    >
                      Activate + Set Current
                    </button>
                  </div>
                )}
              </div>
                );
              })()}

              {rounds.length === 0 ? (
                showRoundSetup ? (
                  <RoundSetup
                    onCreateRounds={handleCreateRounds}
                    onCancel={() => setShowRoundSetup(false)}
                  />
                ) : (
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
                    <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                    <p className="text-gray-400 mb-4">No rounds configured for this event</p>
                    <button
                      onClick={() => setShowRoundSetup(true)}
                      className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2 mx-auto"
                    >
                      <Plus className="w-5 h-5" />
                      Create Rounds
                    </button>
                  </div>
                )
              ) : (
                <RoundControl
                  rounds={rounds}
                  performances={performances}
                  currentRoundId={showState?.current_round_id || null}
                  currentPerformanceId={showState?.current_performance_id || null}
                  votingOpen={showState?.voting_open || false}
                  onStartRound={handleStartRound}
                  onCompleteRound={handleCompleteRound}
                  onSetCurrentPerformance={handleSetCurrentPerformance}
                  onToggleVoting={handleToggleVoting}
                  onAdvanceToFinal={handleAdvanceToFinal}
                  onUpdateRound={handleUpdateRound}
                />
              )}
            </>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={deletePerformanceModal.isOpen}
        onClose={() => setDeletePerformanceModal({ isOpen: false, performanceId: null })}
        onConfirm={handleDeletePerformance}
        title="Performance löschen"
        message="Möchtest du diese Performance wirklich entfernen?"
        confirmText="Löschen"
        variant="danger"
      />
    </div>
  );
}
