import React, { useState } from 'react';
import { Plus, Trash2, Save, X, Trophy, Target } from 'lucide-react';

interface RoundConfig {
  round_number: number;
  round_type: 'preliminary' | 'final';
  max_participants: number | null;
}

interface RoundSetupProps {
  onCreateRounds: (rounds: RoundConfig[]) => void;
  onCancel: () => void;
}

export function RoundSetup({ onCreateRounds, onCancel }: RoundSetupProps) {
  const [rounds, setRounds] = useState<RoundConfig[]>([
    { round_number: 1, round_type: 'preliminary', max_participants: null },
    { round_number: 2, round_type: 'final', max_participants: null },
  ]);

  const addRound = () => {
    const newRoundNumber = rounds.length + 1;
    const newRounds = [...rounds];

    if (newRounds.length > 0 && newRounds[newRounds.length - 1].round_type === 'final') {
      newRounds[newRounds.length - 1] = {
        ...newRounds[newRounds.length - 1],
        round_number: newRoundNumber,
      };
      newRounds.splice(newRounds.length - 1, 0, {
        round_number: newRoundNumber - 1,
        round_type: 'preliminary',
        max_participants: null,
      });
    } else {
      newRounds.push({
        round_number: newRoundNumber,
        round_type: 'preliminary',
        max_participants: null,
      });
    }

    setRounds(newRounds);
  };

  const removeRound = (index: number) => {
    const newRounds = rounds.filter((_, i) => i !== index);
    const reindexed = newRounds.map((round, i) => ({
      ...round,
      round_number: i + 1,
    }));
    setRounds(reindexed);
  };

  const updateRound = (index: number, field: keyof RoundConfig, value: any) => {
    const newRounds = [...rounds];
    newRounds[index] = { ...newRounds[index], [field]: value };
    setRounds(newRounds);
  };

  const handleSubmit = () => {
    if (rounds.length === 0) {
      alert('Mindestens eine Runde muss vorhanden sein');
      return;
    }

    onCreateRounds(rounds);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Runden konfigurieren</h3>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4 mb-6">
        {rounds.map((round, index) => (
          <div
            key={index}
            className="bg-gray-700 rounded-lg p-4 border-2 border-gray-600"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-2">
                {round.round_type === 'final' ? (
                  <Trophy className="w-6 h-6 text-yellow-400" />
                ) : (
                  <Target className="w-6 h-6 text-cyan-400" />
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Runden-Typ
                    </label>
                    <select
                      value={round.round_type}
                      onChange={(e) =>
                        updateRound(index, 'round_type', e.target.value)
                      }
                      className="w-full bg-gray-600 border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="preliminary">Vorrunde</option>
                      <option value="final">Finale</option>
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Max. Teilnehmer
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Unbegrenzt"
                      value={round.max_participants || ''}
                      onChange={(e) =>
                        updateRound(
                          index,
                          'max_participants',
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="w-full bg-gray-600 border border-gray-500 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    Runde {round.round_number}
                    {round.max_participants
                      ? ` - bis zu ${round.max_participants} Teilnehmer`
                      : ' - unbegrenzte Teilnehmer'}
                  </span>
                  {rounds.length > 1 && (
                    <button
                      onClick={() => removeRound(index)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <button
          onClick={addRound}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Runde hinzufügen
        </button>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-all"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all"
          >
            <Save className="w-4 h-4" />
            Runden erstellen
          </button>
        </div>
      </div>
    </div>
  );
}
