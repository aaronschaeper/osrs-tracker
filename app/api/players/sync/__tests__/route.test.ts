import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { NextResponse } from 'next/server'

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

describe('POST /api/players/sync', () => {
  let supabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    supabase = (await import('@/lib/supabase')).supabase
  })

  it('should return 400 if username is missing', async () => {
    const request = new Request('http://localhost:3000/api/players/sync', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Username is required')
  })

  it('should return 404 if player not found in database', async () => {
    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockReturnThis()
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })

    supabase.from.mockReturnValue({
      select: mockSelect,
    })
    mockSelect.mockReturnValue({
      eq: mockEq,
    })
    mockEq.mockReturnValue({
      single: mockSingle,
    })

    const request = new Request('http://localhost:3000/api/players/sync', {
      method: 'POST',
      body: JSON.stringify({ username: 'nonexistent' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Player not found in database')
  })

  it('should return 500 if OSRS API fails', async () => {
    const mockPlayer = { id: '1', username: 'testuser' }

    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockReturnThis()
    const mockSingle = vi.fn().mockResolvedValue({ data: mockPlayer, error: null })

    supabase.from.mockReturnValue({
      select: mockSelect,
    })
    mockSelect.mockReturnValue({
      eq: mockEq,
    })
    mockEq.mockReturnValue({
      single: mockSingle,
    })

    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
    })

    const request = new Request('http://localhost:3000/api/players/sync', {
      method: 'POST',
      body: JSON.stringify({ username: 'testuser' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('Player not found or API error')
  })

  it('should successfully sync player stats', async () => {
    const mockPlayer = { id: '123', username: 'testuser' }

    // Mock database queries
    let callCount = 0
    supabase.from.mockImplementation((table: string) => {
      callCount++

      if (callCount === 1) {
        // First call: select player
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockPlayer, error: null }),
            }),
          }),
        }
      } else if (callCount === 2) {
        // Second call: update player
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      } else {
        // Third call: upsert snapshot
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }
      }
    })

    // Mock OSRS API
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      text: async () => mockOSRSResponse,
    })

    const request = new Request('http://localhost:3000/api/players/sync', {
      method: 'POST',
      body: JSON.stringify({ username: 'testuser' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Synced testuser')
    expect(data.stats).toBeDefined()
    expect(data.stats.total_level).toBe(2277)
    expect(data.stats.total_xp).toBe(299791913)
  })

  it('should handle snapshot upsert errors', async () => {
    const mockPlayer = { id: '123', username: 'testuser' }

    let callCount = 0
    supabase.from.mockImplementation((table: string) => {
      callCount++

      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockPlayer, error: null }),
            }),
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
          upsert: vi.fn().mockResolvedValue({ error: { message: 'Database error' } }),
        }
      }
    })

    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      text: async () => mockOSRSResponse,
    })

    const request = new Request('http://localhost:3000/api/players/sync', {
      method: 'POST',
      body: JSON.stringify({ username: 'testuser' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBeDefined()
  })

  it('should parse OSRS API response correctly', async () => {
    const mockPlayer = { id: '123', username: 'testuser' }

    let capturedStats: any = null
    let callCount = 0

    supabase.from.mockImplementation((table: string) => {
      callCount++

      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockPlayer, error: null }),
            }),
          }),
        }
      } else if (callCount === 2) {
        return {
          update: vi.fn().mockImplementation((stats) => {
            capturedStats = stats
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            }
          }),
        }
      } else {
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }
      }
    })

    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      text: async () => mockOSRSResponse,
    })

    const request = new Request('http://localhost:3000/api/players/sync', {
      method: 'POST',
      body: JSON.stringify({ username: 'testuser' }),
    })

    await POST(request)

    expect(capturedStats).toBeDefined()
    expect(capturedStats.total_level).toBe(2277)
    expect(capturedStats.total_xp).toBe(299791913)
  })
})
