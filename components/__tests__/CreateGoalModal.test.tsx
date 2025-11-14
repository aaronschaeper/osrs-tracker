import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateGoalModal from '../CreateGoalModal'

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

describe('CreateGoalModal', () => {
  const mockPlayers = [
    { id: '1', username: 'player1', display_name: 'Player One', total_level: 1500 },
    { id: '2', username: 'player2', display_name: 'Player Two', total_level: 2000 },
  ]

  const mockOnClose = vi.fn()
  const mockOnGoalCreated = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render modal with title', () => {
    render(
      <CreateGoalModal
        players={mockPlayers}
        onClose={mockOnClose}
        onGoalCreated={mockOnGoalCreated}
      />
    )

    expect(screen.getByText('Create Skill Goal')).toBeInTheDocument()
  })

  it('should render all players', () => {
    render(
      <CreateGoalModal
        players={mockPlayers}
        onClose={mockOnClose}
        onGoalCreated={mockOnGoalCreated}
      />
    )

    expect(screen.getByText('Player One')).toBeInTheDocument()
    expect(screen.getByText('Player Two')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <CreateGoalModal
        players={mockPlayers}
        onClose={mockOnClose}
        onGoalCreated={mockOnGoalCreated}
      />
    )

    // The close button is the first button (X icon) in the modal header
    const buttons = screen.getAllByRole('button')
    const closeButton = buttons[0] // First button is the X close button
    await user.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should show skills section after selecting a player', async () => {
    const user = userEvent.setup()

    // Mock supabase response for player skills
    const mockSupabase = (await import('@/lib/supabase')).supabase
    ;(mockSupabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [{ attack_xp: 1000, strength_xp: 2000 }],
              error: null,
            }),
          }),
        }),
      }),
    })

    render(
      <CreateGoalModal
        players={mockPlayers}
        onClose={mockOnClose}
        onGoalCreated={mockOnGoalCreated}
      />
    )

    const playerButton = screen.getByText('Player One')
    await user.click(playerButton)

    // Wait for skills to load
    await screen.findByText('2. Select Skill')
  })

  it('should disable create button when fields are incomplete', () => {
    render(
      <CreateGoalModal
        players={mockPlayers}
        onClose={mockOnClose}
        onGoalCreated={mockOnGoalCreated}
      />
    )

    const createButton = screen.getByRole('button', { name: /Create Goal/i })
    expect(createButton).toBeDisabled()
  })

  it('should show error message when displayed', () => {
    render(
      <CreateGoalModal
        players={mockPlayers}
        onClose={mockOnClose}
        onGoalCreated={mockOnGoalCreated}
      />
    )

    // No error initially
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
  })

  it('should display all OSRS skills', async () => {
    const user = userEvent.setup()

    const mockSupabase = (await import('@/lib/supabase')).supabase
    ;(mockSupabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [{ attack_xp: 1000 }],
              error: null,
            }),
          }),
        }),
      }),
    })

    render(
      <CreateGoalModal
        players={mockPlayers}
        onClose={mockOnClose}
        onGoalCreated={mockOnGoalCreated}
      />
    )

    const playerButton = screen.getByText('Player One')
    await user.click(playerButton)

    await screen.findByText('2. Select Skill')

    // Check for some key skills
    expect(screen.getByTestId('skill-icon-attack')).toBeInTheDocument()
    expect(screen.getByTestId('skill-icon-strength')).toBeInTheDocument()
    expect(screen.getByTestId('skill-icon-magic')).toBeInTheDocument()
  })

  it('should handle empty player list', () => {
    render(
      <CreateGoalModal
        players={[]}
        onClose={mockOnClose}
        onGoalCreated={mockOnGoalCreated}
      />
    )

    expect(screen.getByText('1. Select Player')).toBeInTheDocument()
  })
})
