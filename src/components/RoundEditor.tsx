import React, { useState } from 'react';
import { Round } from '../lib/supabase';
import { Save, X, Trophy, Target } from 'lucide-react';

interface RoundEditorProps {
  round: Round;
  onSave: (roundId: string, updates: Partial<Round>) => void;
  onCancel: () => void;
}

export function RoundEditor({ round, onSave, onCancel }: RoundEditorProps) {
  const [roundType, setRoundType] = useState<'preliminary' | 'final'>(round.round_type);
  const [maxParticipants, setMaxParticipants] = useState<number | null>(
    round.max_participants || null
  );

  const handleSubmit = () => {
    onSave(round.id, {
      round_type: roundType,
      max_participants: maxParticipants,
    });
  };

  return (
    <div className="bg-gray-700 rounded-lg p-4 border-2 border-cyan-500">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-2">
          {roundType === 'final' ? (
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
                value={roundType}
                onChange={(e) => setRoundType(e.target.value as 'preliminary' | 'final')}
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
                value={maxParticipants || ''}
                onChange={(e) =>
                  setMaxParticipants(e.target.value ? parseInt(e.target.value) : null)
                }
                className="w-full bg-gray-600 border border-gray-500 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
              Abbrechen
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all"
            >
              <Save className="w-4 h-4" />
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
