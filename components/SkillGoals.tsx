"use client";

import { useEffect, useState } from 'react';
import { getLevelFromXP, getProgressToGoal, getXPToGoal } from '@/lib/osrsData';
import SkillIcon from '@/components/SkillIcon';
import { Trash2 } from 'lucide-react';

interface SkillGoal {
  id: string;
  player_id: string;
  skill: string;  // This is the correct column name
  target_level: number;
  starting_level: number;
  starting_xp: number;
  created_at: string;
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
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase
        .from('skill_goals')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setGoals(data || []);
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

  // Re-render when playerSkills changes (after sync)
  useEffect(() => {
    if (Object.keys(playerSkills).length > 0) {
      // Force re-render with updated skills
      setLoading(false);
    }
  }, [playerSkills]);

  const deleteGoal = async (goalId: string) => {
    if (!confirm('Delete this goal?')) return;

    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase
        .from('skill_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      // Reload goals after deletion
      loadGoals();
      onGoalsChange?.();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#2a2420] to-[#1f1a16] p-6 rounded-lg border-2 border-[#4a3a2a] shadow-xl">
        <div className="text-center text-[#b8a890]">Loading goals...</div>
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#2a2420] to-[#1f1a16] p-6 rounded-lg border-2 border-[#4a3a2a] shadow-xl">
        <h3 className="text-xl font-semibold text-[#d4a76a] mb-2">Skill Goals</h3>
        <p className="text-[#b8a890] text-center py-4">
          No skill goals set yet. Click "Create Goal" to set one!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#2a2420] to-[#1f1a16] p-6 rounded-lg border-2 border-[#4a3a2a] shadow-xl">
      <h3 className="text-xl font-semibold text-[#d4a76a] mb-4">Skill Goals</h3>
      
      <div className="space-y-4">
        {goals.map(goal => {
          // Handle both 'skill' and 'skill_name' for backwards compatibility
          const skillName = goal.skill || (goal as any).skill_name;
          if (!skillName) return null;
          
          const skillLower = skillName.toLowerCase();
          const currentXP = playerSkills[`${skillLower}_xp`] || 0;
          const currentLevel = getLevelFromXP(currentXP);
          
          // Use stored starting values for accurate progress calculation
          const progress = getProgressToGoal(
            currentXP, 
            goal.target_level,
            goal.starting_level,
            goal.starting_xp
          );
          
          const xpRemaining = getXPToGoal(currentXP, goal.target_level);
          const levelsRemaining = goal.target_level - currentLevel;

          return (
            <div key={goal.id} className="bg-[#1a1410] p-4 rounded-lg border border-[#4a3a2a]">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <SkillIcon skill={skillLower} size="medium" />
                  <div>
                    <p className="text-[#e6d5b8] font-semibold capitalize">
                      {skillName}
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