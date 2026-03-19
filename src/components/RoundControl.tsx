import { useState } from 'react';
import { Round, Performance, Artist } from '../lib/supabase';
import { RoundEditor } from './RoundEditor';
import { Play, Pause, CheckCircle, Trophy, Clock, Target, CreditCard as Edit2, StopCircle } from 'lucide-react';

interface PerformanceWithArtist extends Performance {
  artist: Artist;
}

interface RoundControlProps {
  rounds: Round[];
  performances: PerformanceWithArtist[];
  currentRoundId: string | null;
  currentPerformanceId: string | null;
  votingOpen: boolean;
  onStartRound: (roundId: string) => void;
  onCompleteRound: (roundId: string) => void;
  onSetCurrentPerformance: (performanceId: string | null) => void;
  onToggleVoting: (roundId: string) => void;
  onAdvanceToFinal: (performanceId: string) => void;
  onUpdateRound: (roundId: string, updates: Partial<Round>) => void;
}

export function RoundControl({
  rounds,
  performances,
  currentRoundId,
  currentPerformanceId,
  votingOpen: _votingOpen,
  onStartRound,
  onCompleteRound,
  onSetCurrentPerformance,
  onToggleVoting,
  onAdvanceToFinal,
  onUpdateRound,
}: RoundControlProps) {
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);

  const getRoundPerformances = (roundId: string) => {
    return performances
      .filter((p) => p.round_id === roundId)
      .sort((a, b) => a.performance_order - b.performance_order);
  };

  const getTopPerformers = (roundId: string, count: number = 2) => {
    const roundPerfs = getRoundPerformances(roundId);
    return [...roundPerfs].sort((a, b) => b.total_votes - a.total_votes).slice(0, count);
  };

  return (
    <div className="space-y-6">
      {rounds.map((round) => {
        const roundPerformances = getRoundPerformances(round.id);
        const isActive = currentRoundId === round.id;
        const topPerformers = round.status === 'completed' && round.round_type === 'preliminary'
          ? getTopPerformers(round.id)
          : [];

        if (editingRoundId === round.id) {
          return (
            <RoundEditor
              key={round.id}
              round={round}
              onSave={(roundId, updates) => {
                onUpdateRound(roundId, updates);
                setEditingRoundId(null);
              }}
              onCancel={() => setEditingRoundId(null)}
            />
          );
        }

        return (
          <div
            key={round.id}
            className={`bg-gray-800 rounded-lg p-6 border-2 transition-all ${
              isActive
                ? 'border-cyan-500 shadow-lg shadow-cyan-500/20'
                : 'border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {round.round_type === 'final' ? (
                  <Trophy className="w-6 h-6 text-yellow-400" />
                ) : (
                  <Target className="w-6 h-6 text-cyan-400" />
                )}
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Round {round.round_number}
                    {round.round_type === 'final' && ' - FINAL'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-sm font-medium px-2 py-1 rounded ${
                        round.status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : round.status === 'completed'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {round.status.toUpperCase()}
                    </span>
                    {round.voting_open && (
                      <span className="text-sm font-medium px-2 py-1 rounded bg-red-500/20 text-red-400 flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        VOTING OPEN
                      </span>
                    )}
                    {round.max_participants && (
                      <span className="text-sm font-medium px-2 py-1 rounded bg-cyan-500/20 text-cyan-400">
                        Max: {round.max_participants}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {round.status === 'upcoming' && (
                  <button
                    onClick={() => setEditingRoundId(round.id)}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-400 rounded-lg font-semibold transition-all flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}
                {round.status === 'upcoming' && (
                  <button
                    onClick={() => onStartRound(round.id)}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start Round
                  </button>
                )}

                {round.status === 'active' && !round.voting_open && (
                  <>
                    <button
                      onClick={() => onToggleVoting(round.id)}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Open Voting
                    </button>
                    <button
                      onClick={() => onCompleteRound(round.id)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Complete Round
                    </button>
                  </>
                )}

                {round.status === 'active' && round.voting_open && (
                  <button
                    onClick={() => onToggleVoting(round.id)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    Close Voting
                  </button>
                )}
              </div>
            </div>

            {roundPerformances.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400">
                  {round.round_type === 'final'
                    ? 'Finalists will be added after preliminary rounds'
                    : 'No performances in this round'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {roundPerformances.map((perf) => {
                  const isCurrentPerf = currentPerformanceId === perf.id;
                  const isTopPerformer = topPerformers.some((tp) => tp.id === perf.id);

                  return (
                    <div
                      key={perf.id}
                      className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                        isCurrentPerf
                          ? 'bg-cyan-500/20 border-2 border-cyan-500/50'
                          : 'bg-gray-700 border-2 border-transparent'
                      } ${isTopPerformer ? 'ring-2 ring-yellow-400/30' : ''}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white">{perf.artist.name}</p>
                          {round.round_type === 'final' && perf.advanced_to_final && (
                            <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30 flex items-center gap-1">
                              <Trophy className="w-3 h-3" />
                              FINALIST
                            </span>
                          )}
                          {isTopPerformer && round.status === 'completed' && (
                            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                              Top {topPerformers.findIndex((tp) => tp.id === perf.id) + 1}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">"{perf.song_title}"</p>
                        <p className="text-sm text-cyan-400 font-medium">{perf.total_votes} votes</p>
                      </div>

                      <div className="flex gap-2">
                        {round.status === 'active' && !round.voting_open && !isCurrentPerf && (
                          <button
                            onClick={() => onSetCurrentPerformance(perf.id)}
                            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-all"
                          >
                            Show Performance
                          </button>
                        )}

                        {isCurrentPerf && round.status === 'active' && (
                          <>
                            <span className="px-4 py-2 bg-cyan-500/30 text-cyan-300 rounded-lg font-semibold border border-cyan-500/50">
                              Currently Showing
                            </span>
                            <button
                              onClick={() => onSetCurrentPerformance(null)}
                              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-lg font-semibold transition-all flex items-center gap-2"
                            >
                              <StopCircle className="w-4 h-4" />
                              Clear
                            </button>
                          </>
                        )}

                        {round.status === 'completed' &&
                          round.round_type === 'preliminary' &&
                          !perf.advanced_to_final &&
                          isTopPerformer && (
                            <button
                              onClick={() => onAdvanceToFinal(perf.id)}
                              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                            >
                              <Trophy className="w-4 h-4" />
                              Advance to Final
                            </button>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
