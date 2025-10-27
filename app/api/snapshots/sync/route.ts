import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

async function fetchOSRSStats(username: string) {
  const response = await fetch(
    `https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws?player=${username}`
  );

  if (!response.ok) {
    throw new Error('Player not found or API error');
  }

  const text = await response.text();
  const lines = text.trim().split('\n');

  // First line is total stats
  const totalStats = lines[0].split(',');
  const totalLevel = parseInt(totalStats[1]);
  const totalXP = parseInt(totalStats[2]);

  const skills = [
    'overall', 'attack', 'defence', 'strength', 'hitpoints', 'ranged',
    'prayer', 'magic', 'cooking', 'woodcutting', 'fletching', 'fishing',
    'firemaking', 'crafting', 'smithing', 'mining', 'herblore', 'agility',
    'thieving', 'slayer', 'farming', 'runecraft', 'hunter', 'construction'
  ];

  const skillData: any = {};

  for (let i = 0; i < skills.length && i < lines.length; i++) {
    const [rank, level, xp] = lines[i].split(',');
    const skillName = skills[i];
    
    if (skillName !== 'overall') {
      skillData[`${skillName}_level`] = parseInt(level);
      skillData[`${skillName}_xp`] = parseInt(xp);
    }
  }

  return {
    total_level: totalLevel,
    total_xp: totalXP,
    ...skillData,
  };
}

export async function POST() {
  try {
    // Get all players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*');

    if (playersError) throw playersError;

    const results = [];

    for (const player of players || []) {
      try {
        // Fetch stats from OSRS API
        const stats = await fetchOSRSStats(player.username);

        // Update player stats
        const { error: updateError } = await supabase
          .from('players')
          .update({
            total_xp: stats.total_xp,
            total_level: stats.total_level,
          })
          .eq('id', player.id);

        if (updateError) throw updateError;

        // Create snapshot
        const { error: snapshotError } = await supabase
          .from('xp_snapshots')
          .insert([
            {
              player_id: player.id,
              snapshot_date: new Date().toISOString().split('T')[0],
              total_xp: stats.total_xp,
              total_level: stats.total_level,
              ...stats,
            },
          ]);

        if (snapshotError) {
          console.error('Snapshot error:', snapshotError);
        }

        results.push({
          username: player.username,
          success: true,
          stats,
        });
      } catch (error: any) {
        results.push({
          username: player.username,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('Sync all error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync all players' },
      { status: 500 }
    );
  }
}