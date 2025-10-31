"use client";

import { useEffect, useState } from 'react';
import { getLevelFromXP, getXPForLevel, getProgressToGoal } from '@/lib/osrsData';
import SkillIcon from '@/components/SkillIcon';
import { Trash2 } from 'lucide-react';

interface SkillGoal {
  id: string;
  player_id: string;
  skill_name: string;
  target_level: number;
}

interface SkillGoalsProps {
  playerId: string;
  playerSkills: { [key: string]: number };
  onGoalsChange?: () => void;
}

export default function SkillGoals({ playerId, playerSkills, onGoalsChange }: SkillGoalsProps) {
  const [goals, setGoals] = useState<SkillGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGoals = async () => {
    try {
      const response = await fetch(`/api/goals?player_id=${playerId}`);
      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reload goals when playerId changes
  useEffect(() => {
    loadGoals();
  }, [playerId]);

  // IMPORTANT: Re-render when playerSkills changes (after sync)
  useEffect(() => {
    // This forces a re-render when player skills update
    if (Object.keys(playerSkills).length > 0) {
      setLoading(false);
    }
  }, [playerSkills]);

  const deleteGoal = async (goalId: string) => {
    if (!confirm('Delete this goal?')) return;

    try {
      const response = await fetch(`/api/goals?id=${goalId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadGoals();
        onGoalsChange?.();
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#2a2420] to-[#1f1a16] p-6 rounded-lg border-2 border-[#4a3a2a] shadow-xl">
        <p className="text-[#b8a890]">Loading goals...</p>
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#2a2420] to-[#1f1a16] p-6 rounded-lg border-2 border-[#4a3a2a] shadow-xl">
        <h3 className="text-xl font-semibold text-[#d4a76a] mb-2">Skill Goals</h3>
        <p className="text-[#b8a890] text-center py-4">
          No active goals. Click "Create Goal" to set one!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#2a2420] to-[#1f1a16] p-6 rounded-lg border-2 border-[#4a3a2a] shadow-xl">
      <h3 className="text-xl font-semibold text-[#d4a76a] mb-4">Skill Goals</h3>
      
      <div className="space-y-4">
        {goals.map(goal => {
          const currentXP = playerSkills[`${goal.skill_name}_xp`] || 0;
          const currentLevel = getLevelFromXP(currentXP);
          const progress = getProgressToGoal(currentXP, goal.target_level);
          const xpRemaining = getXPForLevel(goal.target_level) - currentXP;
          const levelsRemaining = goal.target_level - currentLevel;

          return (
            <div key={goal.id} className="bg-[#1a1410] p-4 rounded-lg border border-[#4a3a2a]">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <SkillIcon skill={goal.skill_name} size="medium" />
                  <div>
                    <p className="text-[#e6d5b8] font-semibold capitalize">
                      {goal.skill_name}
                    </p>
                    <p className="text-[#b8a890] text-sm">
                      Level {currentLevel} → {goal.target_level}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="text-[#b86a6a] hover:text-[#d88a8a] transition-colors"
                  title="Delete goal"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="relative mb-3">
                <div className="h-6 bg-[#0a0a08] rounded overflow-hidden border border-[#4a3a2a]">
                  <div
                    className="h-full bg-gradient-to-r from-[#6ab86a] to-[#4a9a4a] transition-all duration-500 flex items-center px-2"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  >
                    {progress > 10 && (
                      <span className="text-[#e6d5b8] text-xs font-semibold">
                        {progress.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                {progress <= 10 && (
                  <span className="absolute right-2 top-0.5 text-[#b8a890] text-xs">
                    {progress.toFixed(1)}%
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-2 text-xs">
                <div className="flex-1 bg-[#0a0a08] p-2 rounded border border-[#4a3a2a]">
                  <p className="text-[#b8a890]">Levels</p>
                  <p className="text-[#d4a76a] font-semibold">{levelsRemaining}</p>
                </div>
                <div className="flex-1 bg-[#0a0a08] p-2 rounded border border-[#4a3a2a]">
                  <p className="text-[#b8a890]">XP Left</p>
                  <p className="text-[#6ab86a] font-semibold">
                    {xpRemaining.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}