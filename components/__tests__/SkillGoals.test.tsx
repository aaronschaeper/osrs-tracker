import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SkillGoals from '../SkillGoals'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

// Mock SkillIcon component
vi.mock('@/components/SkillIcon', () => ({
  default: ({ skill }: { skill: string }) => <div data-testid={`skill-icon-${skill}`}>{skill}</div>,
}))

// Mock window.confirm
global.confirm = vi.fn(() => true)

describe('SkillGoals', () => {
  const mockPlayerSkills = {
    attack_xp: 1000000,
    strength_xp: 2000000,
    defence_xp: 500000,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading state initially', async () => {
    const mockSupabase = (await import('@/lib/supabase')).supabase
    ;(mockSupabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    })

    render(<SkillGoals playerId="123" playerSkills={{}} />)

    expect(screen.getByText('Loading goals...')).toBeInTheDocument()
  })

  it('should show empty state when no goals exist', async () => {
    const mockSupabase = (await import('@/lib/supabase')).supabase
    ;(mockSupabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    })

    render(<SkillGoals playerId="123" playerSkills={mockPlayerSkills} />)

    await waitFor(() => {
      expect(screen.getByText(/No skill goals set yet/i)).toBeInTheDocument()
    })
  })

  it('should display goals when they exist', async () => {
    const mockGoals = [
      {
        id: '1',
        player_id: '123',
        skill: 'Attack',
        target_level: 99,
        starting_level: 75,
        starting_xp: 1210421,
        created_at: '2024-01-01',
      },
    ]

    const mockSupabase = (await import('@/lib/supabase')).supabase
    ;(mockSupabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockGoals,
            error: null,
          }),
        }),
      }),
    })

    render(<SkillGoals playerId="123" playerSkills={mockPlayerSkills} />)

    await waitFor(() => {
      expect(screen.getByText('Attack')).toBeInTheDocument()
    })

    expect(screen.getByText(/Level.*→.*99/)).toBeInTheDocument()
  })

  it('should display progress bar for goals', async () => {
    const mockGoals = [
      {
        id: '1',
        player_id: '123',
        skill: 'Attack',
        target_level: 99,
        starting_level: 75,
        starting_xp: 1210421,
        created_at: '2024-01-01',
      },
    ]

    const mockSupabase = (await import('@/lib/supabase')).supabase
    ;(mockSupabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockGoals,
            error: null,
          }),
        }),
      }),
    })

    render(<SkillGoals playerId="123" playerSkills={mockPlayerSkills} />)

    await waitFor(() => {
      expect(screen.getByText('Attack')).toBeInTheDocument()
    })

    // Progress bar should exist
    const progressBars = document.querySelectorAll('[style*="width"]')
    expect(progressBars.length).toBeGreaterThan(0)
  })

  it('should call delete goal when delete button is clicked', async () => {
    const user = userEvent.setup()
    const mockGoals = [
      {
        id: '1',
        player_id: '123',
        skill: 'Attack',
        target_level: 99,
        starting_level: 75,
        starting_xp: 1210421,
        created_at: '2024-01-01',
      },
    ]

    let deleteCalled = false
    const mockSupabase = (await import('@/lib/supabase')).supabase

    ;(mockSupabase.from as any).mockImplementation(() => {
      if (deleteCalled) {
        // After delete, return empty list
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }
      } else {
        // First call: return goals
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockGoals,
                error: null,
              }),
            }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation(() => {
              deleteCalled = true
              return Promise.resolve({ error: null })
            }),
          }),
        }
      }
    })

    render(<SkillGoals playerId="123" playerSkills={mockPlayerSkills} />)

    await waitFor(() => {
      expect(screen.getByText('Attack')).toBeInTheDocument()
    })

    const deleteButton = screen.getByTitle('Delete goal')
    await user.click(deleteButton)

    expect(global.confirm).toHaveBeenCalled()
  })

  it('should handle multiple goals', async () => {
    const mockGoals = [
      {
        id: '1',
        player_id: '123',
        skill: 'Attack',
        target_level: 99,
        starting_level: 75,
        starting_xp: 1210421,
        created_at: '2024-01-01',
      },
      {
        id: '2',
        player_id: '123',
        skill: 'Strength',
        target_level: 90,
        starting_level: 80,
        starting_xp: 1986068,
        created_at: '2024-01-02',
      },
    ]

    const mockSupabase = (await import('@/lib/supabase')).supabase
    ;(mockSupabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockGoals,
            error: null,
          }),
        }),
      }),
    })

    render(<SkillGoals playerId="123" playerSkills={mockPlayerSkills} />)

    await waitFor(() => {
      expect(screen.getByText('Attack')).toBeInTheDocument()
      expect(screen.getByText('Strength')).toBeInTheDocument()
    })
  })

  it('should display XP remaining and levels remaining', async () => {
    const mockGoals = [
      {
        id: '1',
        player_id: '123',
        skill: 'Attack',
        target_level: 99,
        starting_level: 75,
        starting_xp: 1210421,
        created_at: '2024-01-01',
      },
    ]

    const mockSupabase = (await import('@/lib/supabase')).supabase
    ;(mockSupabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockGoals,
            error: null,
          }),
        }),
      }),
    })

    render(<SkillGoals playerId="123" playerSkills={mockPlayerSkills} />)

    await waitFor(() => {
      expect(screen.getByText('XP Left')).toBeInTheDocument()
      expect(screen.getByText('Levels')).toBeInTheDocument()
    })
  })

  it('should call onGoalsChange when goal is deleted', async () => {
    const user = userEvent.setup()
    const mockOnGoalsChange = vi.fn()
    const mockGoals = [
      {
        id: '1',
        player_id: '123',
        skill: 'Attack',
        target_level: 99,
        starting_level: 75,
        starting_xp: 1210421,
        created_at: '2024-01-01',
      },
    ]

    const mockSupabase = (await import('@/lib/supabase')).supabase
    ;(mockSupabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockGoals,
            error: null,
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })

    render(
      <SkillGoals
        playerId="123"
        playerSkills={mockPlayerSkills}
        onGoalsChange={mockOnGoalsChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Attack')).toBeInTheDocument()
    })

    const deleteButton = screen.getByTitle('Delete goal')
    await user.click(deleteButton)

    await waitFor(() => {
      expect(mockOnGoalsChange).toHaveBeenCalled()
    })
  })
})
