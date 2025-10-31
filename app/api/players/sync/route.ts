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

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Get player from database
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('username', username)
      .single();

    if (playerError || !player) {
      return NextResponse.json(
        { error: 'Player not found in database' },
        { status: 404 }
      );
    }

    // Fetch stats from OSRS API
    const stats = await fetchOSRSStats(username);

    // Update player stats
    const { error: updateError } = await supabase
      .from('players')
      .update({
        total_xp: stats.total_xp,
        total_level: stats.total_level,
      })
      .eq('id', player.id);

    if (updateError) throw updateError;

    // UPSERT snapshot (update if exists, insert if not)
    // This allows multiple syncs per day to update the same snapshot
    const today = new Date().toISOString().split('T')[0];
    
    const { error: snapshotError } = await supabase
      .from('xp_snapshots')
      .upsert(
        {
          player_id: player.id,
          snapshot_date: today,
          total_xp: stats.total_xp,
          total_level: stats.total_level,
          ...stats,
        },
        {
          onConflict: 'player_id,snapshot_date', // Update on conflict
        }
      );

    if (snapshotError) {
      console.error('Snapshot error:', snapshotError);
      throw snapshotError; // Now we throw instead of silently failing
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${username}`,
      stats,
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync player' },
      { status: 500 }
    );
  }
}