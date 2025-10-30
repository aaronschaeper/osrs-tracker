"use client";

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, Award, Calendar, Plus } from 'lucide-react';
import Navigation from '@/components/Navigation';
import SkillIcon from '@/components/SkillIcon';
import CreateGoalModal from '@/components/CreateGoalModal';
import SkillGoals from '@/components/SkillGoals';

interface Player {
  id: string;
  username: string;
  display_name: string;
  total_xp?: number;
  total_level?: number;
}

interface Snapshot {
  snapshot_date: string;
  total_xp: number;
  total_level: number;
  [key: string]: any;
}

const SKILLS = [
  'attack', 'defence', 'strength', 'hitpoints', 'ranged', 'prayer', 'magic',
  'cooking', 'woodcutting', 'fletching', 'fishing', 'firemaking', 'crafting',
  'smithing', 'mining', 'herblore', 'agility', 'thieving', 'slayer', 
  'farming', 'runecraft', 'hunter', 'construction'
];

const formatXP = (xp: number) => {
  if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(0)}K`;
  return xp.toString();
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function ProgressTracker() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [viewMode, setViewMode] = useState<'individual' | 'group'>('individual');
  const [period, setPeriod] = useState(30);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGoal, setShowCreateGoal] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    if (selectedPlayer) {
      loadPlayerSnapshots(selectedPlayer);
    }
  }, [selectedPlayer, period]);

  const loadPlayers = async () => {
    try {
      const response = await fetch('/api/players');
      if (response.ok) {
        const data = await response.json();
        setPlayers(data);
        if (data.length > 0 && !selectedPlayer) {
          setSelectedPlayer(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayerSnapshots = async (playerId: string) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);
      
      const { data, error } = await (await import('@/lib/supabase')).supabase
        .from('xp_snapshots')
        .select('*')
        .eq('player_id', playerId)
        .gte('snapshot_date', startDate.toISOString().split('T')[0])
        .order('snapshot_date', { ascending: true });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const cleanedData = [data[0]];
        
        for (let i = 1; i < data.length; i++) {
          if (data[i].total_xp >= cleanedData[cleanedData.length - 1].total_xp) {
            cleanedData.push(data[i]);
          }
        }
        
        setSnapshots(cleanedData);
      } else {
        setSnapshots([]);
      }
    } catch (error) {
      console.error('Error loading snapshots:', error);
      setSnapshots([]);
    }
  };

  const handleGoalCreated = () => {
    // Refresh goals by re-rendering
    setShowCreateGoal(false);
    // Optionally reload player data if needed
    if (selectedPlayer) {
      loadPlayerSnapshots(selectedPlayer);
    }
  };

  const calculateGains = () => {
    if (snapshots.length < 2) return { xpGain: 0, levelGain: 0 };
    
    const oldest = snapshots[0];
    const newest = snapshots[snapshots.length - 1];
    
    return {
      xpGain: newest.total_xp - oldest.total_xp,
      levelGain: newest.total_level - oldest.total_level
    };
  };

  const getChartData = () => {
    return snapshots.map(snapshot => ({
      date: formatDate(snapshot.snapshot_date),
      xp: snapshot.total_xp,
      level: snapshot.total_level
    }));
  };

  const getSkillGains = () => {
    if (snapshots.length < 2) return [];
    
    const oldest = snapshots[0];
    const newest = snapshots[snapshots.length - 1];
    
    return SKILLS.map(skill => ({
      skill: skill.charAt(0).toUpperCase() + skill.slice(1),
      xpGain: (newest[`${skill}_xp`] || 0) - (oldest[`${skill}_xp`] || 0)
    }))
    .filter(s => s.xpGain > 0)
    .sort((a, b) => b.xpGain - a.xpGain)
    .slice(0, 10);
  };

  const getCurrentPlayer = () => {
    return players.find(p => p.id === selectedPlayer);
  };

  const gains = calculateGains();
  const currentPlayer = getCurrentPlayer();
  const chartData = getChartData();
  const skillGains = getSkillGains();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1410] text-[#e6d5b8] flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d4a76a]"></div>
          <span className="text-lg">Loading tracker...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1410] text-[#e6d5b8] stone-bg">
      <Navigation />
      
      {/* Header */}
      <div className="bg-gradient-to-b from-[#2a2420] to-[#1f1a16] border-b-2 border-[#4a3a2a]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#d4a76a] mb-1">Progress Tracker</h1>
              <p className="text-[#b8a890]">Track XP and level gains over time</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Create Goal Button */}
              <button
                onClick={() => setShowCreateGoal(true)}
                className="flex items-center gap-2 bg-[#3a5f3a] hover:bg-[#4a7f4a] px-4 py-2 rounded-lg border-2 border-[#2a4a2a] transition-all"
              >
                <Plus size={18} />
                Create Goal
              </button>

              <div className="flex bg-[#2a2420] rounded-lg p-1 border-2 border-[#4a3a2a]">
                <button
                  onClick={() => setViewMode('individual')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'individual'
                      ? 'bg-[#5a4a3a] text-[#e6d5b8]'
                      : 'text-[#b8a890] hover:text-[#e6d5b8]'
                  }`}
                >
                  Individual
                </button>
                <button
                  onClick={() => setViewMode('group')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'group'
                      ? 'bg-[#5a4a3a] text-[#e6d5b8]'
                      : 'text-[#b8a890] hover:text-[#e6d5b8]'
                  }`}
                >
                  Group
                </button>
              </div>

              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="bg-[#2a2420] border-2 border-[#4a3a2a] rounded-lg px-4 py-2 text-[#e6d5b8] text-sm"
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
                <option value={365}>Last Year</option>
              </select>
            </div>
          </div>

          {viewMode === 'individual' && (
            <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
              {players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => setSelectedPlayer(player.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border-2 ${
                    selectedPlayer === player.id
                      ? 'bg-[#5a4a3a] text-[#e6d5b8] border-[#d4a76a]'
                      : 'bg-[#2a2420] text-[#b8a890] border-[#4a3a2a] hover:bg-[#3a2a2a] hover:text-[#e6d5b8]'
                  }`}
                >
                  {player.display_name || player.username}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#3a5a5a] to-[#2a4a4a] rounded-xl p-6 border-2 border-[#4a6a6a] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="text-[#9ad5d5]" size={28} />
              <span className="text-[#9ad5d5] text-sm font-medium">XP Gained</span>
            </div>
            <div className="text-3xl font-bold text-[#e6d5b8] mb-1">
              {gains.xpGain < 0 ? '-' : ''}{formatXP(Math.abs(gains.xpGain))}
            </div>
            <div className="text-[#9ad5d5] text-sm">
              In last {period} days
              {gains.xpGain < 0 && <span className="ml-2 text-red-300">⚠️ Decreased</span>}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#3a5a3a] to-[#2a4a2a] rounded-xl p-6 border-2 border-[#4a6a4a] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Award className="text-[#9ad59a]" size={28} />
              <span className="text-[#9ad59a] text-sm font-medium">Levels</span>
            </div>
            <div className="text-3xl font-bold text-[#e6d5b8] mb-1">
              {gains.levelGain > 0 ? '+' : ''}{gains.levelGain}
            </div>
            <div className="text-[#9ad59a] text-sm">
              Levels gained
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#5a3a5a] to-[#4a2a4a] rounded-xl p-6 border-2 border-[#6a4a6a] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Activity className="text-[#c5a5c5]" size={28} />
              <span className="text-[#c5a5c5] text-sm font-medium">Current XP</span>
            </div>
            <div className="text-2xl font-bold text-[#e6d5b8] mb-1">
              {formatXP(currentPlayer?.total_xp || 0)}
            </div>
            <div className="text-[#c5a5c5] text-sm">
              Total experience
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#5a4a3a] to-[#4a3a2a] rounded-xl p-6 border-2 border-[#6a5a4a] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="text-[#d4a76a]" size={28} />
              <span className="text-[#d4a76a] text-sm font-medium">Total Level</span>
            </div>
            <div className="text-3xl font-bold text-[#e6d5b8] mb-1">
              {currentPlayer?.total_level || 0}
            </div>
            <div className="text-[#d4a76a] text-sm">
              Combined level
            </div>
          </div>
        </div>

        {/* Skill Goals Section */}
        {viewMode === 'individual' && selectedPlayer && (
          <div className="mb-8">
            <SkillGoals 
              playerId={selectedPlayer}
              playerSkills={snapshots.length > 0 ? snapshots[snapshots.length - 1] : {}}
              onGoalsChange={handleGoalCreated}
            />
          </div>
        )}

        {/* Progress Chart */}
        <div className="bg-gradient-to-br from-[#2a2420] to-[#1f1a16] rounded-xl p-6 mb-8 border-2 border-[#4a3a2a] shadow-xl">
          <h2 className="text-xl font-semibold text-[#d4a76a] mb-6">XP Progress Over Time</h2>
          <div className="h-80">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6ab86a" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6ab86a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4a3a2a" />
                  <XAxis dataKey="date" stroke="#b8a890" fontSize={12} />
                  <YAxis tickFormatter={formatXP} stroke="#b8a890" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#2a2420',
                      border: '2px solid #4a3a2a',
                      borderRadius: '8px',
                      color: '#e6d5b8'
                    }}
                    formatter={(value) => [formatXP(value as number), 'Total XP']}
                  />
                  <Area
                    type="monotone"
                    dataKey="xp"
                    stroke="#6ab86a"
                    strokeWidth={3}
                    fill="url(#xpGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#b8a890]">
                No snapshot data available for this period
              </div>
            )}
          </div>
        </div>

        {/* Top Skills Trained */}
        <div className="bg-gradient-to-br from-[#2a2420] to-[#1f1a16] rounded-xl p-6 border-2 border-[#4a3a2a] shadow-xl">
          <h2 className="text-xl font-semibold text-[#d4a76a] mb-6">Top Skills Trained</h2>
          {skillGains.length > 0 ? (
            <div className="space-y-4">
              {skillGains.map((skill) => (
                <div key={skill.skill} className="flex items-center">
                  <div className="w-40 text-[#b8a890] font-medium flex items-center gap-2">
                    <SkillIcon skill={skill.skill.toLowerCase()} size="small" />
                    {skill.skill}
                  </div>
                  <div className="flex-1">
                    <div className="h-8 bg-[#1a1410] rounded-lg overflow-hidden border border-[#4a3a2a]">
                      <div
                        className="h-full bg-gradient-to-r from-[#6ab86a] to-[#4a9a4a] flex items-center px-3"
                        style={{
                          width: `${(skill.xpGain / skillGains[0].xpGain) * 100}%`
                        }}
                      >
                        <span className="text-[#e6d5b8] text-sm font-medium">
                          {formatXP(skill.xpGain)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#b8a890]">
              No skill gains data available for this period
            </div>
          )}
        </div>
      </div>

      {/* Create Goal Modal */}
      {showCreateGoal && (
        <CreateGoalModal
          players={players}
          onClose={() => setShowCreateGoal(false)}
          onGoalCreated={handleGoalCreated}
        />
      )}
    </div>
  );
}