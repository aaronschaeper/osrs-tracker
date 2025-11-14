import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../route'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('Competitions API', () => {
  let supabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    supabase = (await import('@/lib/supabase')).supabase
  })

  describe('GET /api/competitions', () => {
    it('should return all competitions', async () => {
      const mockCompetitions = [
        {
          id: '1',
          name: 'Summer Competition',
          description: 'Summer XP gains',
          start_date: '2024-06-01',
          end_date: '2024-08-31',
          competition_type: 'total_xp',
        },
        {
          id: '2',
          name: 'Winter Competition',
          description: 'Winter XP gains',
          start_date: '2024-12-01',
          end_date: '2025-02-28',
          competition_type: 'skill_xp',
        },
      ]

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockCompetitions,
            error: null,
          }),
        }),
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockCompetitions)
    })

    it('should return empty array if no competitions exist', async () => {
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
      expect(data.error).toBe('Failed to fetch competitions')
    })
  })

  describe('POST /api/competitions', () => {
    it('should return 400 if required fields are missing', async () => {
      const request = new Request('http://localhost:3000/api/competitions', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Competition' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Name, start date, and end date are required')
    })

    it('should create a new competition successfully', async () => {
      const newCompetition = {
        id: '1',
        name: 'New Competition',
        description: 'Test description',
        start_date: '2024-06-01',
        end_date: '2024-08-31',
        competition_type: 'total_xp',
      }

      supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: newCompetition,
              error: null,
            }),
          }),
        }),
      })

      const request = new Request('http://localhost:3000/api/competitions', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Competition',
          description: 'Test description',
          start_date: '2024-06-01',
          end_date: '2024-08-31',
          competition_type: 'total_xp',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(newCompetition)
    })

    it('should default competition_type to total_xp if not provided', async () => {
      let capturedData: any = null

      supabase.from.mockReturnValue({
        insert: vi.fn().mockImplementation((data) => {
          capturedData = data[0]
          return {
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...data[0], id: '1' },
                error: null,
              }),
            }),
          }
        }),
      })

      const request = new Request('http://localhost:3000/api/competitions', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Competition',
          start_date: '2024-06-01',
          end_date: '2024-08-31',
        }),
      })

      await POST(request)

      expect(capturedData.competition_type).toBe('total_xp')
    })

    it('should handle optional description field', async () => {
      const newCompetition = {
        id: '1',
        name: 'New Competition',
        description: null,
        start_date: '2024-06-01',
        end_date: '2024-08-31',
        competition_type: 'total_xp',
      }

      supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: newCompetition,
              error: null,
            }),
          }),
        }),
      })

      const request = new Request('http://localhost:3000/api/competitions', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Competition',
          start_date: '2024-06-01',
          end_date: '2024-08-31',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(newCompetition)
    })

    it('should return 500 if insert fails', async () => {
      supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      })

      const request = new Request('http://localhost:3000/api/competitions', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Competition',
          start_date: '2024-06-01',
          end_date: '2024-08-31',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create competition')
    })
  })
})
