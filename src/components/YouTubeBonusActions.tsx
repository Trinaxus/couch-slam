import { useState, useEffect } from 'react';
import { ThumbsUp, Bell, MessageCircle, Share2, ExternalLink, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

interface BonusAction {
  type: 'liked' | 'subscribed' | 'commented' | 'shared';
  label: string;
  labelEn: string;
  bonus: string;
  icon: any;
  url: string;
}

interface YouTubeBonusActionsProps {
  eventId: string;
  videoId: string;
  channelUrl: string;
}

export function YouTubeBonusActions({ eventId, videoId, channelUrl }: YouTubeBonusActionsProps) {
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const { showSuccess, showError } = useToast();
  const [claimedActions, setClaimedActions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [multiplier, setMultiplier] = useState(1.0);

  const serverBaseUrl = (import.meta.env.VITE_SERVER_BASE_URL as string | undefined) || '';
  const listUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/youtube_bonus_actions_list.php` : '';
  const claimUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/youtube_bonus_actions_claim.php` : '';
  const unclaimUrl = serverBaseUrl ? `${serverBaseUrl.replace(/\/$/, '')}/api/youtube_bonus_actions_unclaim.php` : '';

  const listUrlWithToken = listUrl && token ? `${listUrl}?token=${encodeURIComponent(token)}` : listUrl;
  const claimUrlWithToken = claimUrl && token ? `${claimUrl}?token=${encodeURIComponent(token)}` : claimUrl;
  const unclaimUrlWithToken = unclaimUrl && token ? `${unclaimUrl}?token=${encodeURIComponent(token)}` : unclaimUrl;

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const actions: BonusAction[] = [
    {
      type: 'liked',
      label: 'Video geliked',
      labelEn: 'Liked video',
      bonus: '+30%',
      icon: ThumbsUp,
      url: videoUrl,
    },
    {
      type: 'subscribed',
      label: 'Kanal abonniert',
      labelEn: 'Subscribed',
      bonus: '+50%',
      icon: Bell,
      url: channelUrl,
    },
    {
      type: 'commented',
      label: 'Kommentiert',
      labelEn: 'Commented',
      bonus: '+30%',
      icon: MessageCircle,
      url: videoUrl,
    },
    {
      type: 'shared',
      label: 'Geteilt',
      labelEn: 'Shared',
      bonus: '+50%',
      icon: Share2,
      url: videoUrl,
    },
  ];

  useEffect(() => {
    if (user) {
      loadClaimedActions();
    }
  }, [user, eventId]);

  const loadClaimedActions = async () => {
    if (!user) return;

    if (!listUrlWithToken) return;

    const url = `${listUrlWithToken}${listUrlWithToken.includes('?') ? '&' : '?'}event_id=${encodeURIComponent(eventId)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = (await res.json()) as any;
    if (!res.ok || !json?.ok) {
      return;
    }

    const claimed = new Set<string>(
      (Array.isArray(json.actions) ? json.actions : []).map((x: any) => String(x))
    );
    setClaimedActions(claimed);
    calculateMultiplier(claimed);
  };

  const calculateMultiplier = (claimed: Set<string>) => {
    const bonuses = {
      liked: 0.30,
      subscribed: 0.50,
      commented: 0.30,
      shared: 0.50,
    };

    let total = 1.0;
    claimed.forEach(action => {
      total += bonuses[action as keyof typeof bonuses] || 0;
    });
    setMultiplier(total);
  };

  const handleClaimAction = async (actionType: string) => {
    if (!user || claimedActions.has(actionType)) return;

    setLoading(true);
    try {
      if (!claimUrlWithToken) {
        showError(language === 'de' ? 'Fehler beim Beanspruchen des Bonus' : 'Failed to claim bonus');
        return;
      }

      const res = await fetch(claimUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_id: eventId, action_type: actionType }),
      });

      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        showError(language === 'de' ? 'Fehler beim Beanspruchen des Bonus' : 'Failed to claim bonus');
        return;
      }

      const newClaimed = new Set(claimedActions);
      newClaimed.add(actionType);
      setClaimedActions(newClaimed);
      calculateMultiplier(newClaimed);

      const action = actions.find(a => a.type === actionType);
      if (action) {
        showSuccess(
          language === 'de'
            ? `Bonus ${action.bonus} erhalten! Deine Voting Power wurde erhöht.`
            : `Bonus ${action.bonus} claimed! Your voting power increased.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnclaimAction = async (actionType: string) => {
    if (!user || !claimedActions.has(actionType)) return;

    setLoading(true);
    try {
      if (!unclaimUrlWithToken) {
        showError(language === 'de' ? 'Fehler beim Zurücksetzen' : 'Failed to reset action');
        return;
      }

      const res = await fetch(unclaimUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_id: eventId, action_type: actionType }),
      });

      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        showError(language === 'de' ? 'Fehler beim Zurücksetzen' : 'Failed to reset action');
        return;
      }

      const newClaimed = new Set(claimedActions);
      newClaimed.delete(actionType);
      setClaimedActions(newClaimed);
      calculateMultiplier(newClaimed);

      showSuccess(
        language === 'de'
          ? 'Aktion wurde zurückgesetzt'
          : 'Action has been reset'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 border border-slate-700">
        <p className="text-slate-400 text-center">
          {language === 'de' ? 'Melde dich an, um Bonus-Voting-Power zu erhalten' : 'Sign in to earn bonus voting power'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">
          {language === 'de' ? '🎁 Bonus Voting Power' : '🎁 Bonus Voting Power'}
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-400">{((multiplier - 1) * 100).toFixed(0)}%</div>
          <div className="text-xs text-slate-400">
            {language === 'de' ? 'Aktueller Bonus' : 'Current Bonus'}
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-300 mb-4">
        {language === 'de'
          ? 'Unterstütze uns auf YouTube und erhalte mehr Voting Power!'
          : 'Support us on YouTube and earn more voting power!'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const isClaimed = claimedActions.has(action.type);

          return (
            <div
              key={action.type}
              className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                isClaimed
                  ? 'bg-green-900/30 border-green-500'
                  : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Icon className={`w-5 h-5 ${isClaimed ? 'text-green-400' : 'text-slate-400'}`} />
                  <span className={`text-sm font-bold ${isClaimed ? 'text-green-400' : 'text-yellow-400'}`}>
                    {action.bonus}
                  </span>
                </div>

                <div className="text-sm font-medium text-white mb-3">
                  {language === 'de' ? action.label : action.labelEn}
                </div>

                {!isClaimed ? (
                  <div className="flex gap-2">
                    <a
                      href={action.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {language === 'de' ? 'Aktion' : 'Action'}
                    </a>
                    <button
                      onClick={() => handleClaimAction(action.type)}
                      disabled={loading}
                      className="flex-1 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                    >
                      {language === 'de' ? 'Erledigt' : 'Done'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-green-400 text-sm font-medium">
                      <span>✓</span>
                      <span>{language === 'de' ? 'Abgeschlossen' : 'Claimed'}</span>
                    </div>
                    <button
                      onClick={() => handleUnclaimAction(action.type)}
                      disabled={loading}
                      className="p-1.5 bg-slate-600/50 hover:bg-slate-500 text-slate-300 hover:text-white rounded transition-colors disabled:opacity-50"
                      title={language === 'de' ? 'Zurücksetzen' : 'Reset'}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
        <p className="text-xs text-slate-400 text-center">
          {language === 'de'
            ? '💡 Tipp: Deine Stimmen werden mit deinem aktuellen Bonus multipliziert!'
            : '💡 Tip: Your votes will be multiplied by your current bonus!'}
        </p>
      </div>
    </div>
  );
}
