import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all goals for a player
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('player_id');

    if (!playerId) {
      return NextResponse.json({ error: 'player_id required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('skill_goals')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

// POST create new goal
export async function POST(request: Request) {
  try {
    const { player_id, skill_name, target_level } = await request.json();

    if (!player_id || !skill_name || !target_level) {
      return NextResponse.json(
        { error: 'player_id, skill_name, and target_level required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('skill_goals')
      .insert([{ player_id, skill_name, target_level }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Goal already exists for this skill' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}

// DELETE goal
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('id');

    if (!goalId) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('skill_goals')
      .delete()
      .eq('id', goalId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}