import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST, DELETE } from '../route'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('Goals API', () => {
  let supabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    supabase = (await import('@/lib/supabase')).supabase
  })

  describe('GET /api/goals', () => {
    it('should return 400 if player_id is missing', async () => {
      const request = new Request('http://localhost:3000/api/goals')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('player_id required')
    })

    it('should return goals for a player', async () => {
      const mockGoals = [
        { id: '1', player_id: '123', skill_name: 'attack', target_level: 99 },
        { id: '2', player_id: '123', skill_name: 'strength', target_level: 90 },
      ]

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockGoals,
              error: null,
            }),
          }),
        }),
      })

      const request = new Request('http://localhost:3000/api/goals?player_id=123')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockGoals)
    })

    it('should return empty array if no goals found', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      })

      const request = new Request('http://localhost:3000/api/goals?player_id=123')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('should return 500 if database error occurs', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      })

      const request = new Request('http://localhost:3000/api/goals?player_id=123')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch goals')
    })
  })

  describe('POST /api/goals', () => {
    it('should return 400 if required fields are missing', async () => {
      const request = new Request('http://localhost:3000/api/goals', {
        method: 'POST',
        body: JSON.stringify({ player_id: '123' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('player_id, skill_name, and target_level required')
    })

    it('should create a new goal successfully', async () => {
      const mockGoal = {
        id: '1',
        player_id: '123',
        skill_name: 'attack',
        target_level: 99,
      }

      supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockGoal,
              error: null,
            }),
          }),
        }),
      })

      const request = new Request('http://localhost:3000/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          player_id: '123',
          skill_name: 'attack',
          target_level: 99,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockGoal)
    })

    it('should return 409 if goal already exists', async () => {
      supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '23505', message: 'Duplicate key' },
            }),
          }),
        }),
      })

      const request = new Request('http://localhost:3000/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          player_id: '123',
          skill_name: 'attack',
          target_level: 99,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Goal already exists for this skill')
    })

    it('should return 500 for other database errors', async () => {
      supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '42000', message: 'Database error' },
            }),
          }),
        }),
      })

      const request = new Request('http://localhost:3000/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          player_id: '123',
          skill_name: 'attack',
          target_level: 99,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create goal')
    })
  })

  describe('DELETE /api/goals', () => {
    it('should return 400 if id is missing', async () => {
      const request = new Request('http://localhost:3000/api/goals')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('id required')
    })

    it('should delete a goal successfully', async () => {
      supabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      })

      const request = new Request('http://localhost:3000/api/goals?id=123')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 500 if database error occurs', async () => {
      supabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Database error' },
          }),
        }),
      })

      const request = new Request('http://localhost:3000/api/goals?id=123')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to delete goal')
    })
  })
})
