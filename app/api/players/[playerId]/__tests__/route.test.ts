import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DELETE } from '../route'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('DELETE /api/players/[playerId]', () => {
  let supabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    supabase = (await import('@/lib/supabase')).supabase
  })

  it('should delete player and snapshots successfully', async () => {
    let callCount = 0
    supabase.from.mockImplementation(() => {
      callCount++

      if (callCount === 1) {
        // Delete snapshots
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }
      } else {
        // Delete player
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }
      }
    })

    const request = new Request('http://localhost:3000/api/players/123')
    const context = { params: Promise.resolve({ playerId: '123' }) }

    const response = await DELETE(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should return 500 if deleting snapshots fails', async () => {
    supabase.from.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: { message: 'Snapshot delete failed' },
        }),
      }),
    })

    const request = new Request('http://localhost:3000/api/players/123')
    const context = { params: Promise.resolve({ playerId: '123' }) }

    const response = await DELETE(request, context)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to delete player')
  })

  it('should return 500 if deleting player fails', async () => {
    let callCount = 0
    supabase.from.mockImplementation(() => {
      callCount++

      if (callCount === 1) {
        // Delete snapshots succeeds
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }
      } else {
        // Delete player fails
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: { message: 'Player delete failed' },
            }),
          }),
        }
      }
    })

    const request = new Request('http://localhost:3000/api/players/123')
    const context = { params: Promise.resolve({ playerId: '123' }) }

    const response = await DELETE(request, context)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to delete player')
  })

  it('should handle cascading delete correctly', async () => {
    const deletedTables: string[] = []

    supabase.from.mockImplementation((table: string) => {
      deletedTables.push(table)

      return {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      }
    })

    const request = new Request('http://localhost:3000/api/players/123')
    const context = { params: Promise.resolve({ playerId: '123' }) }

    await DELETE(request, context)

    // Verify snapshots deleted before player
    expect(deletedTables[0]).toBe('xp_snapshots')
    expect(deletedTables[1]).toBe('players')
  })

  it('should handle different player IDs', async () => {
    let capturedPlayerId: string | null = null

    supabase.from.mockImplementation(() => {
      return {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation((column: string, value: string) => {
            if (column === 'id') {
              capturedPlayerId = value
            }
            return Promise.resolve({ error: null })
          }),
        }),
      }
    })

    const request = new Request('http://localhost:3000/api/players/456')
    const context = { params: Promise.resolve({ playerId: '456' }) }

    await DELETE(request, context)

    expect(capturedPlayerId).toBe('456')
  })
})
