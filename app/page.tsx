"use client";

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Trophy, TrendingUp, Calendar, Plus, RotateCw, User } from 'lucide-react';
import Navigation from '@/components/Navigation';

interface Player {
  id: string;
  username: string;
  display_name?: string;
  total_xp?: number;
  total_level?: number;
  created_at: string;
}

interface Competition {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  competition_type: string;
}

interface WeeklyGain {
  username: string;
  display_name?: string;
  xp_gained: number;
}

const formatXP = (xp) => {
  if (!xp || xp === 0) return '0';
  if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(0)}K`;
  return xp.toString();
};

const formatNumber = (num) => {
  if (!num || isNaN(num)) return '0';
  return new Intl.NumberFormat().format(num);
};

export default function OSRSTracker() {
  const [players, setPlayers] = useState([]);
  const [weeklyGains, setWeeklyGains] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isCreatingCompetition, setIsCreatingCompetition] = useState(false);
  const [newCompetition, setNewCompetition] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    type: 'total_xp'
  });

  const loadPlayers = async () => {
    try {
      const response = await fetch('/api/players');
      if (response.ok) {
        const playersData = await response.json();
        setPlayers(playersData || []);
      }
    } catch (error) {
      console.error('Error loading players:', error);
      setPlayers([]);
    }
  };

  const loadWeeklyGains = async () => {
    try {
      const response = await fetch('/api/leaderboards/weekly');
      if (response.ok) {
        const data = await response.json();
        setWeeklyGains(data.data || []);
      }
    } catch (error) {
      console.error('Error loading weekly gains:', error);
      setWeeklyGains([]);
    }
  };

  const loadSnapshots = async () => {
    try {
      setSnapshots([]);
    } catch (error) {
      console.error('Error loading snapshots:', error);
      setSnapshots([]);
    }
  };

  const loadCompetitions = async () => {
    try {
      const response = await fetch('/api/competitions');
      if (response.ok) {
        const data = await response.json();
        setCompetitions(data || []);
      }
    } catch (error) {
      console.error('Error loading competitions:', error);
      setCompetitions([]);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([
        loadPlayers(),
        loadWeeklyGains(),
        loadSnapshots(),
        loadCompetitions()
      ]);
      setLoading(false);
    };
    
    loadAllData();
  }, []);

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return;
    
    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: newPlayerName.trim(),
          displayName: newPlayerName.trim()
        })
      });
      
      if (response.ok) {
        const newPlayer = await response.json();
        setNewPlayerName('');
        setIsAddingPlayer(false);
        
        await syncPlayer(newPlayer.username);
        await loadPlayers();
        await loadWeeklyGains();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding player:', error);
      alert('Failed to add player');
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/snapshots/sync', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Sync result:', result);
        await loadPlayers();
        await loadWeeklyGains();
        await loadSnapshots();
      } else {
        const error = await response.json();
        alert(`Sync failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const syncPlayer = async (username) => {
    try {
      const response = await fetch('/api/players/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Player sync result:', result);
        await loadPlayers();
        await loadWeeklyGains();
      }
    } catch (error) {
      console.error('Player sync error:', error);
      alert('Failed to sync player');
    }
  };

  const deletePlayer = async (playerId, username) => {
    if (!confirm(`Are you sure you want to delete ${username}? This will remove all their data and snapshots.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/players/${playerId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadPlayers();
        await loadWeeklyGains();
      } else {
        const error = await response.json();
        alert(`Failed to delete player: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Failed to delete player');
    }
  };

  const viewPlayerDetails = async (player) => {
    setSelectedPlayer(player);
  };

  const createCompetition = async () => {
    if (!newCompetition.name || !newCompetition.startDate || !newCompetition.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCompetition.name,
          description: newCompetition.description,
          start_date: newCompetition.startDate,
          end_date: newCompetition.endDate,
          competition_type: newCompetition.type
        })
      });

      if (response.ok) {
        setIsCreatingCompetition(false);
        setNewCompetition({
          name: '',
          description: '',
          startDate: '',
          endDate: '',
          type: 'total_xp'
        });
        await loadCompetitions();
        alert('Competition created successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to create competition: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating competition:', error);
      alert('Failed to create competition');
    }
  };

  const totalGroupXP = players.reduce((sum, player) => {
    const xp = player.total_xp || 0;
    return sum + xp;
  }, 0);

  const averageLevel = players.length > 0 
    ? Math.round(players.reduce((sum, player) => {
        const level = player.total_level || 0;
        return sum + level;
      }, 0) / players.length)
    : 0;

  const chartData = weeklyGains.map(gain => ({
    player: gain.display_name || gain.username,
    xp_gained: gain.xp_gained || 0
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1410] text-[#e6d5b8] flex items-center justify-center">
        <div className="text-xl font-serif">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1410] stone-bg text-[#e6d5b8]">
      <Navigation />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-[#d4a76a] mb-2 drop-shadow-lg" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>
                OSRS Group Ironman Tracker
              </h1>
              <p className="text-[#b8a890]">Track your group's progress and compete with friends</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setIsAddingPlayer(true)}
                className="flex items-center gap-2 bg-[#3a5f3a] hover:bg-[#4a7f4a] px-4 py-2 rounded border-2 border-[#2a4a2a] shadow-lg transition-all hover:shadow-xl"
              >
                <Plus size={20} />
                Add Player
              </button>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className={`flex items-center gap-2 px-4 py-2 rounded border-2 shadow-lg transition-all ${
                  isSyncing 
                    ? 'bg-[#4a4440] border-[#3a3430] cursor-not-allowed' 
                    : 'bg-[#5a4a3a] hover:bg-[#6a5a4a] border-[#4a3a2a] hover:shadow-xl'
                }`}
              >
                <RotateCw size={20} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Syncing...' : 'Sync All'}
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-[#2a2420] to-[#1f1a16] p-6 rounded-lg border-2 border-[#4a3a2a] shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#b8a890] text-sm mb-1">Total Players</p>
                  <p className="text-4xl font-bold text-[#e6d5b8]">{players.length}</p>
                </div>
                <Users className="text-[#7a9ab8]" size={40} />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-[#2a2420] to-[#1f1a16] p-6 rounded-lg border-2 border-[#4a3a2a] shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#b8a890] text-sm mb-1">Group Total XP</p>
                  <p className="text-4xl font-bold text-[#6ab86a]">{formatXP(totalGroupXP)}</p>
                </div>
                <TrendingUp className="text-[#6ab86a]" size={40} />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-[#2a2420] to-[#1f1a16] p-6 rounded-lg border-2 border-[#4a3a2a] shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#b8a890] text-sm mb-1">Average Level</p>
                  <p className="text-4xl font-bold text-[#d4a76a]">{averageLevel || 0}</p>
                </div>
                <Trophy className="text-[#d4a76a]" size={40} />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-[#2a2420] to-[#1f1a16] p-6 rounded-lg border-2 border-[#4a3a2a] shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#b8a890] text-sm mb-1">Active Competitions</p>
                  <p className="text-4xl font-bold text-[#9a7ab8]">{competitions.length}</p>
                </div>
                <Calendar className="text-[#9a7ab8]" size={40} />
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-[#2a2420] to-[#1f1a16] p-6 rounded-lg border-2 border-[#4a3a2a] shadow-xl">
              <h3 className="text-xl font-semibold mb-4 text-[#d4a76a]">XP Progress (Last 7 Days)</h3>
              <div className="h-64 flex items-center justify-center text-[#b8a890]">
                {snapshots.length === 0 ? 'No historical data yet. Sync players daily to see progress!' : ''}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#2a2420] to-[#1f1a16] p-6 rounded-lg border-2 border-[#4a3a2a] shadow-xl">
              <h3 className="text-xl font-semibold mb-4 text-[#d4a76a]">Weekly XP Gains</h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4a3a2a" />
                    <XAxis dataKey="player" stroke="#b8a890" />
                    <YAxis tickFormatter={formatXP} stroke="#b8a890" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#2a2420',
                        border: '2px solid #4a3a2a',
                        borderRadius: '8px',
                        color: '#e6d5b8'
                      }}
                      formatter={(value) => [formatXP(value), 'XP Gained']}
                    />
                    <Bar dataKey="xp_gained" fill="#6ab86a" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-[#b8a890]">
                  No weekly gains data yet. Sync players to see gains!
                </div>
              )}
            </div>
          </div>

          {/* Player List */}
          <div className="bg-gradient-to-br from-[#2a2420] to-[#1f1a16] p-6 rounded-lg border-2 border-[#4a3a2a] shadow-xl mb-8">
            <h3 className="text-xl font-semibold mb-4 text-[#d4a76a]">Players</h3>
            {players.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#4a3a2a]">
                      <th className="pb-3 text-[#b8a890]">Player</th>
                      <th className="pb-3 text-[#b8a890]">Total XP</th>
                      <th className="pb-3 text-[#b8a890]">Total Level</th>
                      <th className="pb-3 text-[#b8a890]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player) => (
                      <tr key={player.id} className="border-b border-[#3a2a1a]">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <User size={20} className="text-[#b8a890]" />
                            <span className="font-medium text-[#e6d5b8]">{player.display_name || player.username}</span>
                            <span className="text-[#8a7a6a] text-sm">({player.username})</span>
                          </div>
                        </td>
                        <td className="py-3 text-[#6ab86a] font-mono">{formatNumber(player.total_xp || 0)}</td>
                        <td className="py-3 text-[#d4a76a]">{player.total_level || 0}</td>
                        <td className="py-3">
                          <button 
                            onClick={() => syncPlayer(player.username)}
                            className="text-[#7a9ab8] hover:text-[#9abadb] text-sm mr-4"
                          >
                            Sync
                          </button>
                          <button 
                            onClick={() => viewPlayerDetails(player)}
                            className="text-[#7a9ab8] hover:text-[#9abadb] text-sm mr-4"
                          >
                            View Details
                          </button>
                          <button 
                            onClick={() => deletePlayer(player.id, player.display_name || player.username)}
                            className="text-[#b86a6a] hover:text-[#d88a8a] text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-[#b8a890]">
                No players added yet. Click "Add Player" to get started!
              </div>
            )}
          </div>

          {/* Competitions Preview */}
          <div className="bg-gradient-to-br from-[#2a2420] to-[#1f1a16] p-6 rounded-lg border-2 border-[#4a3a2a] shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-[#d4a76a]">Active Competitions</h3>
              <button 
                onClick={() => setIsCreatingCompetition(true)}
                className="bg-[#5a3a5a] hover:bg-[#6a4a6a] px-4 py-2 rounded border-2 border-[#4a2a4a] transition-all"
              >
                Create Competition
              </button>
            </div>
            <div className="text-center py-8 text-[#b8a890]">
              {competitions.length === 0 
                ? "No active competitions. Create one to start competing!"
                : (
                  <div className="space-y-3">
                    {competitions.map((comp) => (
                      <div key={comp.id} className="bg-[#3a2a2a] p-4 rounded-lg border border-[#4a3a2a]">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium text-[#e6d5b8]">{comp.name}</h4>
                            <p className="text-[#b8a890] text-sm">{comp.description || 'No description'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[#9a7ab8] font-medium">
                              {new Date(comp.end_date) > new Date() ? 'Active' : 'Ended'}
                            </p>
                            <p className="text-[#b8a890] text-sm">
                              {comp.start_date} to {comp.end_date}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          </div>
        </div>
      </div>

      {/* Modals remain the same but with updated colors */}
      {isAddingPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-[#2a2420] p-6 rounded-lg w-96 border-2 border-[#4a3a2a]">
            <h3 className="text-xl font-semibold mb-4 text-[#d4a76a]">Add New Player</h3>
            <input
              type="text"
              placeholder="Enter OSRS username"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="w-full p-3 bg-[#1a1410] border-2 border-[#4a3a2a] rounded-lg text-[#e6d5b8] mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer()}
            />
            <div className="flex gap-3">
              <button
                onClick={handleAddPlayer}
                className="flex-1 bg-[#3a5f3a] hover:bg-[#4a7f4a] px-4 py-2 rounded border-2 border-[#2a4a2a] transition-colors"
              >
                Add Player
              </button>
              <button
                onClick={() => {
                  setIsAddingPlayer(false);
                  setNewPlayerName('');
                }}
                className="flex-1 bg-[#5a4a3a] hover:bg-[#6a5a4a] px-4 py-2 rounded border-2 border-[#4a3a2a] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-[#2a2420] p-6 rounded-lg w-96 max-h-96 overflow-y-auto border-2 border-[#4a3a2a]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-[#d4a76a]">{selectedPlayer.display_name || selectedPlayer.username}</h3>
              <button 
                onClick={() => setSelectedPlayer(null)}
                className="text-[#b8a890] hover:text-[#e6d5b8]"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[#b8a890]">Username:</span>
                <span className="text-[#e6d5b8]">{selectedPlayer.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#b8a890]">Total XP:</span>
                <span className="text-[#6ab86a]">{formatNumber(selectedPlayer.total_xp || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#b8a890]">Total Level:</span>
                <span className="text-[#d4a76a]">{selectedPlayer.total_level || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#b8a890]">Added:</span>
                <span className="text-[#e6d5b8]">{new Date(selectedPlayer.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  syncPlayer(selectedPlayer.username);
                  setSelectedPlayer(null);
                }}
                className="flex-1 bg-[#5a4a3a] hover:bg-[#6a5a4a] px-4 py-2 rounded border-2 border-[#4a3a2a] transition-colors"
              >
                Sync Player
              </button>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="flex-1 bg-[#4a4440] hover:bg-[#5a5450] px-4 py-2 rounded border-2 border-[#3a3430] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}