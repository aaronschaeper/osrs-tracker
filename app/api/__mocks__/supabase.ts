import { vi } from 'vitest'

export const createMockSupabaseClient = () => {
  const mockSelect = vi.fn().mockReturnThis()
  const mockInsert = vi.fn().mockReturnThis()
  const mockUpdate = vi.fn().mockReturnThis()
  const mockDelete = vi.fn().mockReturnThis()
  const mockUpsert = vi.fn().mockReturnThis()
  const mockEq = vi.fn().mockReturnThis()
  const mockGte = vi.fn().mockReturnThis()
  const mockOrder = vi.fn().mockReturnThis()
  const mockSingle = vi.fn()
  const mockFrom = vi.fn()

  mockFrom.mockImplementation(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    upsert: mockUpsert,
  }))

  return {
    from: mockFrom,
    mockSelect,
    mockInsert,
    mockUpdate,
    mockDelete,
    mockUpsert,
    mockEq,
    mockGte,
    mockOrder,
    mockSingle,
  }
}
