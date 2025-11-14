import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

// Mock fetch
global.fetch = vi.fn()

const mockOSRSResponse = `100,2277,299791913
1,99,13034431
2,99,13034431
3,99,13034431
4,99,13034431
5,99,13034431
6,99,13034431
7,99,13034431
8,99,13034431
9,99,13034431
10,99,13034431
11,99,13034431
12,99,13034431
13,99,13034431
14,99,13034431
15,99,13034431
16,99,13034431
17,99,13034431
18,99,13034431
19,99,13034431
20,99,13034431
21,99,13034431
22,99,13034431
23,99,13034431`

describe('POST /api/snapshots/sync', () => {
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

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBeDefined()
  })

  it('should handle empty player list', async () => {
    supabase.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    })

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.results).toEqual([])
  })

  it('should sync all players successfully', async () => {
    const mockPlayers = [
      { id: '1', username: 'player1' },
      { id: '2', username: 'player2' },
    ]

    let callCount = 0
    supabase.from.mockImplementation(() => {
      callCount++

      if (callCount === 1) {
        // First call: get players
        return {
          select: vi.fn().mockResolvedValue({
            data: mockPlayers,
            error: null,
          }),
        }
      } else if (callCount % 2 === 0) {
        // Even calls (2, 4): update player calls
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      } else {
        // Odd calls (3, 5): insert snapshot calls
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        }
      }
    })

    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      text: async () => mockOSRSResponse,
    })

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.results).toHaveLength(2)
    expect(data.results[0].success).toBe(true)
    expect(data.results[1].success).toBe(true)
    expect(data.results[0].username).toBe('player1')
    expect(data.results[1].username).toBe('player2')
  })

  it('should handle partial failures', async () => {
    const mockPlayers = [
      { id: '1', username: 'player1' },
      { id: '2', username: 'player2' },
    ]

    let fetchCallCount = 0
    ;(global.fetch as any).mockImplementation(() => {
      fetchCallCount++
      if (fetchCallCount === 1) {
        return Promise.resolve({
          ok: true,
          text: async () => mockOSRSResponse,
        })
      } else {
        return Promise.resolve({
          ok: false,
          status: 404,
        })
      }
    })

    let dbCallCount = 0
    supabase.from.mockImplementation(() => {
      dbCallCount++

      if (dbCallCount === 1) {
        return {
          select: vi.fn().mockResolvedValue({
            data: mockPlayers,
            error: null,
          }),
        }
      } else if (dbCallCount === 2) {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      } else {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        }
      }
    })

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.results).toHaveLength(2)
    expect(data.results[0].success).toBe(true)
    expect(data.results[1].success).toBe(false)
    expect(data.results[1].error).toBeDefined()
  })

  it('should continue syncing after individual player failures', async () => {
    const mockPlayers = [
      { id: '1', username: 'player1' },
      { id: '2', username: 'player2' },
      { id: '3', username: 'player3' },
    ]

    let fetchCallCount = 0
    ;(global.fetch as any).mockImplementation(() => {
      fetchCallCount++
      if (fetchCallCount === 2) {
        // Second player fails
        return Promise.resolve({
          ok: false,
          status: 404,
        })
      }
      return Promise.resolve({
        ok: true,
        text: async () => mockOSRSResponse,
      })
    })

    let dbCallCount = 0
    supabase.from.mockImplementation(() => {
      dbCallCount++

      if (dbCallCount === 1) {
        return {
          select: vi.fn().mockResolvedValue({
            data: mockPlayers,
            error: null,
          }),
        }
      } else if (dbCallCount % 2 === 0) {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      } else {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        }
      }
    })

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.results).toHaveLength(3)
    expect(data.results[0].success).toBe(true)
    expect(data.results[1].success).toBe(false)
    expect(data.results[2].success).toBe(true)
  })

  it('should handle snapshot insertion errors gracefully', async () => {
    const mockPlayers = [{ id: '1', username: 'player1' }]

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
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      } else {
        return {
          insert: vi.fn().mockResolvedValue({
            error: { message: 'Duplicate snapshot' },
          }),
        }
      }
    })

    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      text: async () => mockOSRSResponse,
    })

    const response = await POST()
    const data = await response.json()

    // Should still succeed even if snapshot insertion fails
    expect(response.status).toBe(200)
    expect(data.results[0].success).toBe(true)
  })
})
