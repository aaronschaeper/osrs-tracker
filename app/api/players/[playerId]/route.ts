import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await context.params;

    // Delete snapshots first (foreign key constraint)
    const { error: snapshotsError } = await supabase
      .from('xp_snapshots')
      .delete()
      .eq('player_id', playerId);

    if (snapshotsError) throw snapshotsError;

    // Delete player
    const { error: playerError } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId);

    if (playerError) throw playerError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting player:', error);
    return NextResponse.json(
      { error: 'Failed to delete player' },
      { status: 500 }
    );
  }
}