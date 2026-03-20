import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Save, Music } from 'lucide-react';

export function UserDashboard() {
  const { user, profile, token, updateProfilePatch } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const serverBaseUrl = (import.meta.env.VITE_SERVER_BASE_URL as string | undefined) || '';
  const usersMeUpdateUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/users_me_update.php` : '';
  const uploadsMeImageUploadUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/uploads_me_image_upload.php` : '';
  const uploadsMeImageDeleteUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/uploads_me_image_delete.php` : '';

  useEffect(() => {
    setDisplayName(profile?.display_name || '');
    setAvatarUrl(profile?.avatar_url || '');
  }, [profile?.display_name, profile?.avatar_url]);

  if (!user || !profile) {
    return null;
  }

  const saveProfile = async (next: { display_name?: string | null; avatar_url?: string | null }) => {
    if (!usersMeUpdateUrl) {
      throw new Error('Missing VITE_SERVER_BASE_URL');
    }
    if (!token) {
      throw new Error('Missing token');
    }

    const res = await fetch(`${usersMeUpdateUrl}?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(next),
    });
    const json = (await res.json()) as any;
    if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to update profile');

    const u = json.user as any;
    updateProfilePatch({
      display_name: (u?.display_name as string | null) ?? null,
      avatar_url: (u?.avatar_url as string | null) ?? null,
    });
  };

  const uploadAvatar = async (file: File) => {
    if (!uploadsMeImageUploadUrl) {
      throw new Error('Missing VITE_SERVER_BASE_URL');
    }
    if (!token) {
      throw new Error('Missing token');
    }

    const fd = new FormData();
    fd.append('purpose', 'avatar');
    fd.append('replace', '1');
    fd.append('file', file);

    const res = await fetch(uploadsMeImageUploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: fd,
    });

    const json = (await res.json()) as any;
    if (!res.ok || !json?.ok) throw new Error(json?.error || 'Upload failed');

    const url = (json?.url as string | null) ?? null;
    if (!url) throw new Error('Upload did not return a public URL');

    setAvatarUrl(url);
    updateProfilePatch({ avatar_url: url });
  };

  const deleteAvatar = async () => {
    if (!uploadsMeImageDeleteUrl) {
      throw new Error('Missing VITE_SERVER_BASE_URL');
    }
    if (!token) {
      throw new Error('Missing token');
    }

    const res = await fetch(uploadsMeImageDeleteUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ purpose: 'avatar' }),
    });

    const json = (await res.json()) as any;
    if (!res.ok || !json?.ok) throw new Error(json?.error || 'Delete failed');

    setAvatarUrl('');
    updateProfilePatch({ avatar_url: null });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Dein Profil</p>
      </div>

      {!isEditing ? (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="relative group shrink-0">
                <div className="w-14 h-14 rounded-full border border-gray-700 bg-gray-900 overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <Music className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {avatarUrl ? (
                  <div className="pointer-events-none absolute left-0 top-full mt-2 hidden group-hover:block z-50">
                    <div className="w-64 h-64 min-w-64 min-h-64 rounded-full border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden">
                      <img
                        src={avatarUrl}
                        alt=""
                        className="w-full h-full object-cover rounded-full"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="text-white font-semibold">{profile.display_name || '—'}</div>
                <div className="text-gray-400 text-sm">{profile.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="bg-gray-900 border border-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-800 transition-all"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              setSaving(true);
              await saveProfile({ display_name: displayName, avatar_url: avatarUrl || null });
              setIsEditing(false);
            } catch (err: any) {
              console.error(err);
              alert(err?.message || 'Failed to save');
            } finally {
              setSaving(false);
            }
          }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">E-Mail</label>
              <input
                type="text"
                value={profile.email}
                readOnly
                className="w-full bg-gray-900/40 border border-gray-700 rounded-lg py-2 px-4 text-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Dein Anzeigename"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Avatar URL (1:1)</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="https://..."
              />

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="text-sm text-gray-300"
                />

                <button
                  type="button"
                  disabled={!avatarFile || uploading}
                  onClick={async () => {
                    if (!avatarFile) return;
                    try {
                      setUploading(true);
                      await uploadAvatar(avatarFile);
                      setAvatarFile(null);
                    } catch (err: any) {
                      console.error(err);
                      alert(err?.message || 'Upload failed');
                    } finally {
                      setUploading(false);
                    }
                  }}
                  className="bg-gray-900 border border-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload Avatar'}
                </button>

                <button
                  type="button"
                  disabled={uploading || !avatarUrl}
                  onClick={async () => {
                    try {
                      setUploading(true);
                      await deleteAvatar();
                    } catch (err: any) {
                      console.error(err);
                      alert(err?.message || 'Delete failed');
                    } finally {
                      setUploading(false);
                    }
                  }}
                  className="bg-red-600/20 border border-red-500/30 text-red-200 font-semibold py-2 px-4 rounded-lg hover:bg-red-600/30 transition-all disabled:opacity-50"
                >
                  Delete Avatar
                </button>
              </div>

              <div className="mt-3">
                <div className="w-24 h-24 rounded-full border border-gray-700 bg-gray-900 overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <Music className="w-8 h-8" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save'}
            </button>

            <button
              type="button"
              disabled={saving || uploading}
              onClick={() => {
                setDisplayName(profile.display_name || '');
                setAvatarUrl(profile.avatar_url || '');
                setAvatarFile(null);
                setIsEditing(false);
              }}
              className="bg-gray-900 border border-gray-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
