import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../route'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('Players API', () => {
  let supabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    supabase = (await import('@/lib/supabase')).supabase
  })

  describe('GET /api/players', () => {
    it('should return all players', async () => {
      const mockPlayers = [
        { id: '1', username: 'player1', display_name: 'Player One' },
        { id: '2', username: 'player2', display_name: 'Player Two' },
      ]

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockPlayers,
            error: null,
          }),
        }),
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockPlayers)
    })

    it('should return empty array if no players exist', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('should return 500 if database error occurs', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch players')
    })
  })

  describe('POST /api/players', () => {
    it('should return 400 if username is missing', async () => {
      const request = new Request('http://localhost:3000/api/players', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Username is required')
    })

    it('should return 409 if player already exists', async () => {
      const existingPlayer = {
        id: '1',
        username: 'existingplayer',
        display_name: 'Existing Player',
      }

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: existingPlayer,
              error: null,
            }),
          }),
        }),
      })

      const request = new Request('http://localhost:3000/api/players', {
        method: 'POST',
        body: JSON.stringify({ username: 'existingplayer' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Player already exists')
    })

    it('should create a new player with username and displayName', async () => {
      const newPlayer = {
        id: '1',
        username: 'newplayer',
        display_name: 'New Player',
      }

      let callCount = 0
      supabase.from.mockImplementation(() => {
        callCount++

        if (callCount === 1) {
          // Check if player exists
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }
        } else {
          // Insert new player
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: newPlayer,
                  error: null,
                }),
              }),
            }),
          }
        }
      })

      const request = new Request('http://localhost:3000/api/players', {
        method: 'POST',
        body: JSON.stringify({
          username: 'newplayer',
          displayName: 'New Player',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(newPlayer)
    })

    it('should use username as display_name if not provided', async () => {
      const newPlayer = {
        id: '1',
        username: 'newplayer',
        display_name: 'newplayer',
      }

      let callCount = 0
      supabase.from.mockImplementation(() => {
        callCount++

        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }
        } else {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: newPlayer,
                  error: null,
                }),
              }),
            }),
          }
        }
      })

      const request = new Request('http://localhost:3000/api/players', {
        method: 'POST',
        body: JSON.stringify({ username: 'newplayer' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.display_name).toBe('newplayer')
    })

    it('should return 500 if insert fails', async () => {
      let callCount = 0
      supabase.from.mockImplementation(() => {
        callCount++

        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }
        } else {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' },
                }),
              }),
            }),
          }
        }
      })

      const request = new Request('http://localhost:3000/api/players', {
        method: 'POST',
        body: JSON.stringify({ username: 'newplayer' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to add player')
    })
  })
})
