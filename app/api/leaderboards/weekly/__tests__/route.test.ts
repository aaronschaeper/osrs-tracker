import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('GET /api/leaderboards/weekly', () => {
  let supabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    supabase = (await import('@/lib/supabase')).supabase
  })

  it('should return 500 if fetching players fails', async () => {
    supabase.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch leaderboard')
  })

  it('should return empty leaderboard when no players exist', async () => {
    supabase.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toEqual([])
  })

  it('should calculate XP gained correctly', async () => {
    const mockPlayers = [
      { id: '1', username: 'player1', display_name: 'Player One' },
      { id: '2', username: 'player2', display_name: 'Player Two' },
    ]

    const mockSnapshots1 = [
      { player_id: '1', total_xp: 1000000, snapshot_date: '2024-01-01' },
      { player_id: '1', total_xp: 1500000, snapshot_date: '2024-01-07' },
    ]

    const mockSnapshots2 = [
      { player_id: '2', total_xp: 2000000, snapshot_date: '2024-01-01' },
      { player_id: '2', total_xp: 2100000, snapshot_date: '2024-01-07' },
    ]

    let callCount = 0
    supabase.from.mockImplementation(() => {
      callCount++

      if (callCount === 1) {
        // Get players
        return {
          select: vi.fn().mockResolvedValue({
            data: mockPlayers,
            error: null,
          }),
        }
      } else if (callCount === 2) {
        // Get snapshots for player1
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockSnapshots1,
                  error: null,
                }),
              }),
            }),
          }),
        }
      } else {
        // Get snapshots for player2
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockSnapshots2,
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(2)

    // Should be sorted by XP gained (player1 has more)
    expect(data.data[0].username).toBe('player1')
    expect(data.data[0].xp_gained).toBe(500000)
    expect(data.data[1].username).toBe('player2')
    expect(data.data[1].xp_gained).toBe(100000)
  })

  it('should exclude players with insufficient snapshot data', async () => {
    const mockPlayers = [
      { id: '1', username: 'player1', display_name: 'Player One' },
      { id: '2', username: 'player2', display_name: 'Player Two' },
    ]

    const mockSnapshots1 = [
      { player_id: '1', total_xp: 1000000, snapshot_date: '2024-01-01' },
      { player_id: '1', total_xp: 1500000, snapshot_date: '2024-01-07' },
    ]

    const mockSnapshots2 = [
      { player_id: '2', total_xp: 2000000, snapshot_date: '2024-01-07' },
    ]

    let callCount = 0
    supabase.from.mockImplementation(() => {
      callCount++

      if (callCount === 1) {
        return {
          select: vi.fn().mockResolvedValue({
            data: mockPlayers,
            error: null,
          }),
        }
      } else if (callCount === 2) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockSnapshots1,
                  error: null,
                }),
              }),
            }),
          }),
        }
      } else {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockSnapshots2,
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].username).toBe('player1')
  })

  it('should sort leaderboard by XP gained (highest first)', async () => {
    const mockPlayers = [
      { id: '1', username: 'player1', display_name: 'Player One' },
      { id: '2', username: 'player2', display_name: 'Player Two' },
      { id: '3', username: 'player3', display_name: 'Player Three' },
    ]

    let callCount = 0
    supabase.from.mockImplementation(() => {
      callCount++

      if (callCount === 1) {
        return {
          select: vi.fn().mockResolvedValue({
            data: mockPlayers,
            error: null,
          }),
        }
      } else if (callCount === 2) {
        // player1: 100k gained
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [
                    { total_xp: 1000000 },
                    { total_xp: 1100000 },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        }
      } else if (callCount === 3) {
        // player2: 500k gained (highest)
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [
                    { total_xp: 2000000 },
                    { total_xp: 2500000 },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        }
      } else {
        // player3: 200k gained
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [
                    { total_xp: 3000000 },
                    { total_xp: 3200000 },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(3)
    expect(data.data[0].username).toBe('player2')
    expect(data.data[0].xp_gained).toBe(500000)
    expect(data.data[1].username).toBe('player3')
    expect(data.data[1].xp_gained).toBe(200000)
    expect(data.data[2].username).toBe('player1')
    expect(data.data[2].xp_gained).toBe(100000)
  })

  it('should handle negative XP gains (data correction)', async () => {
    const mockPlayers = [
      { id: '1', username: 'player1', display_name: 'Player One' },
    ]

    supabase.from.mockImplementation(() => {
      return {
        select: vi.fn()
          .mockReturnValueOnce({
            data: mockPlayers,
            error: null,
          })
          .mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [
                    { total_xp: 2000000 },
                    { total_xp: 1500000 }, // Negative gain
                  ],
                  error: null,
                }),
              }),
            }),
          }),
      }
    })

    let callCount = 0
    supabase.from.mockImplementation(() => {
      callCount++

      if (callCount === 1) {
        return {
          select: vi.fn().mockResolvedValue({
            data: mockPlayers,
            error: null,
          }),
        }
      } else {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [
                    { total_xp: 2000000 },
                    { total_xp: 1500000 },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].xp_gained).toBe(-500000)
  })

  it('should handle snapshot fetch errors for individual players', async () => {
    const mockPlayers = [
      { id: '1', username: 'player1', display_name: 'Player One' },
      { id: '2', username: 'player2', display_name: 'Player Two' },
    ]

    let callCount = 0
    supabase.from.mockImplementation(() => {
      callCount++

      if (callCount === 1) {
        return {
          select: vi.fn().mockResolvedValue({
            data: mockPlayers,
            error: null,
          }),
        }
      } else if (callCount === 2) {
        // Error fetching player1 snapshots
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Snapshot error' },
                }),
              }),
            }),
          }),
        }
      } else {
        // player2 succeeds
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [
                    { total_xp: 1000000 },
                    { total_xp: 1200000 },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].username).toBe('player2')
  })
})
