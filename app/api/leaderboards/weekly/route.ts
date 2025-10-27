import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDate = sevenDaysAgo.toISOString().split('T')[0];

    // Get all players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*');

    if (playersError) throw playersError;

    const leaderboard = [];

    for (const player of players || []) {
      // Get snapshots from last 7 days
      const { data: snapshots, error: snapshotsError } = await supabase
        .from('xp_snapshots')
        .select('*')
        .eq('player_id', player.id)
        .gte('snapshot_date', startDate)
        .order('snapshot_date', { ascending: true });

      if (snapshotsError) continue;

      if (snapshots && snapshots.length >= 2) {
        const oldestSnapshot = snapshots[0];
        const newestSnapshot = snapshots[snapshots.length - 1];
        const xpGained = newestSnapshot.total_xp - oldestSnapshot.total_xp;

        leaderboard.push({
          username: player.username,
          display_name: player.display_name,
          xp_gained: xpGained,
        });
      }
    }

    // Sort by XP gained
    leaderboard.sort((a, b) => b.xp_gained - a.xp_gained);

    return NextResponse.json({ data: leaderboard });
  } catch (error) {
    console.error('Error fetching weekly leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}