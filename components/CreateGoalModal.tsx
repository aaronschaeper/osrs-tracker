"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import SkillIcon from '@/components/SkillIcon';
import { getLevelFromXP } from '@/lib/osrsData';

interface Player {
  id: string;
  username: string;
  display_name: string;
  total_level?: number;
}

interface CreateGoalModalProps {
  players: Player[];
  onClose: () => void;
  onGoalCreated: () => void;
}

const SKILLS = [
  'attack', 'strength', 'defence', 'hitpoints', 'ranged', 'prayer', 'magic',
  'cooking', 'woodcutting', 'fletching', 'fishing', 'firemaking', 'crafting',
  'smithing', 'mining', 'herblore', 'agility', 'thieving', 'slayer',
  'farming', 'runecraft', 'hunter', 'construction'
];

export default function CreateGoalModal({ players, onClose, onGoalCreated }: CreateGoalModalProps) {
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [targetLevel, setTargetLevel] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [playerSkills, setPlayerSkills] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (selectedPlayer) {
      loadPlayerSkills(selectedPlayer);
    }
  }, [selectedPlayer]);

  const loadPlayerSkills = async (playerId: string) => {
    try {
      const { data, error } = await (await import('@/lib/supabase')).supabase
        .from('xp_snapshots')
        .select('*')
        .eq('player_id', playerId)
        .order('snapshot_date', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setPlayerSkills(data[0]);
      }
    } catch (error) {
      console.error('Error loading player skills:', error);
    }
  };

  const getCurrentLevel = (skill: string): number => {
    const xp = playerSkills[`${skill}_xp`] || 0;
    return getLevelFromXP(xp);
  };

  const handleCreateGoal = async () => {
    if (!selectedPlayer || !selectedSkill || !targetLevel) return;

    setCreating(true);
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: selectedPlayer,
          skill_name: selectedSkill,
          target_level: targetLevel
        })
      });

      if (response.ok) {
        onGoalCreated();
        onClose();
      }
    } catch (error) {
      console.error('Error creating goal:', error);
    } finally {
      setCreating(false);
    }
  };

  const currentLevel = selectedSkill ? getCurrentLevel(selectedSkill) : 1;
  const levelOptions = Array.from(
    { length: 99 - currentLevel },
    (_, i) => currentLevel + i + 1
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#2a2420] to-[#1f1a16] rounded-xl p-6 max-w-2xl w-full border-2 border-[#4a3a2a] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#d4a76a]">Create Skill Goal</h2>
          <button
            onClick={onClose}
            className="text-[#b8a890] hover:text-[#e6d5b8] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Step 1: Select Player */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[#e6d5b8] mb-3">1. Select Player</h3>
          <div className="grid grid-cols-2 gap-3">
            {players.map((player) => (
              <button
                key={player.id}
                onClick={() => {
                  setSelectedPlayer(player.id);
                  setSelectedSkill('');
                  setTargetLevel(null);
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedPlayer === player.id
                    ? 'bg-[#5a4a3a] border-[#d4a76a] text-[#e6d5b8]'
                    : 'bg-[#1a1410] border-[#4a3a2a] text-[#b8a890] hover:bg-[#2a2420] hover:border-[#5a4a3a]'
                }`}
              >
                <p className="font-semibold">{player.display_name || player.username}</p>
                <p className="text-sm opacity-75">Level {player.total_level || 0}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Select Skill */}
        {selectedPlayer && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#e6d5b8] mb-3">2. Select Skill</h3>
            <div className="grid grid-cols-8 gap-2">
              {SKILLS.map((skill) => {
                const level = getCurrentLevel(skill);
                const isMaxed = level >= 99;
                
                return (
                  <button
                    key={skill}
                    onClick={() => {
                      if (!isMaxed) {
                        setSelectedSkill(skill);
                        setTargetLevel(null);
                      }
                    }}
                    disabled={isMaxed}
                    className={`relative group p-3 rounded-lg border-2 transition-all ${
                      selectedSkill === skill
                        ? 'bg-[#5a4a3a] border-[#d4a76a]'
                        : isMaxed
                        ? 'bg-[#1a1410] border-[#3a2a2a] opacity-50 cursor-not-allowed'
                        : 'bg-[#1a1410] border-[#4a3a2a] hover:border-[#5a4a3a]'
                    }`}
                  >
                    <SkillIcon skill={skill} size="medium" className="mx-auto" />
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[#1a1410] border border-[#4a3a2a] rounded px-2 py-1 whitespace-nowrap z-10">
                      <p className="text-[#e6d5b8] text-xs capitalize">{skill}</p>
                      <p className="text-[#b8a890] text-xs">Level {level}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Select Target Level */}
        {selectedSkill && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#e6d5b8] mb-3">
              3. Select Target Level
            </h3>
            <p className="text-[#b8a890] text-sm mb-3">
              Current {selectedSkill.charAt(0).toUpperCase() + selectedSkill.slice(1)} level: {currentLevel}
            </p>
            <select
              value={targetLevel || ''}
              onChange={(e) => setTargetLevel(Number(e.target.value))}
              className="w-full bg-[#1a1410] border-2 border-[#4a3a2a] rounded-lg px-4 py-3 text-[#e6d5b8]"
            >
              <option value="">Select target level...</option>
              {levelOptions.map(level => (
                <option key={level} value={level}>
                  Level {level}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Create Button */}
        <div className="flex gap-3">
          <button
            onClick={handleCreateGoal}
            disabled={!selectedPlayer || !selectedSkill || !targetLevel || creating}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              !selectedPlayer || !selectedSkill || !targetLevel || creating
                ? 'bg-[#4a4440] text-[#8a7a6a] cursor-not-allowed'
                : 'bg-[#3a5f3a] hover:bg-[#4a7f4a] text-[#e6d5b8]'
            }`}
          >
            {creating ? 'Creating...' : 'Create Goal'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-[#5a4a3a] hover:bg-[#6a5a4a] text-[#e6d5b8] rounded-lg font-semibold transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}