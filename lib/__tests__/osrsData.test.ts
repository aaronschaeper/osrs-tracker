import { describe, it, expect } from 'vitest'
import {
  XP_TABLE,
  getLevelFromXP,
  getXPForLevel,
  getXPToGoal,
  getProgressToGoal
} from '../osrsData'

describe('osrsData', () => {
  describe('XP_TABLE', () => {
    it('should have 100 entries', () => {
      expect(XP_TABLE).toHaveLength(100)
    })

    it('should start at 0 XP for level 1', () => {
      expect(XP_TABLE[0]).toBe(0)
    })

    it('should end at 13034431 XP for level 99', () => {
      expect(XP_TABLE[98]).toBe(13034431)
    })

    it('should be in ascending order', () => {
      for (let i = 1; i < XP_TABLE.length; i++) {
        expect(XP_TABLE[i]).toBeGreaterThan(XP_TABLE[i - 1])
      }
    })
  })

  describe('getLevelFromXP', () => {
    it('should return level 1 for 0 XP', () => {
      expect(getLevelFromXP(0)).toBe(1)
    })

    it('should return level 1 for XP below level 2 threshold', () => {
      expect(getLevelFromXP(82)).toBe(1)
    })

    it('should return level 2 for exactly 83 XP', () => {
      expect(getLevelFromXP(83)).toBe(2)
    })

    it('should return level 2 for XP between level 2 and 3', () => {
      expect(getLevelFromXP(100)).toBe(2)
    })

    it('should return level 50 for 101333 XP', () => {
      expect(getLevelFromXP(101333)).toBe(50)
    })

    it('should return level 99 for exactly 13034431 XP', () => {
      expect(getLevelFromXP(13034431)).toBe(99)
    })

    it('should return level 100 for XP above level 99', () => {
      expect(getLevelFromXP(20000000)).toBe(100)
    })

    it('should handle negative XP gracefully', () => {
      expect(getLevelFromXP(-1)).toBe(1)
    })

    it('should correctly identify all level thresholds', () => {
      // Test exact XP values for a few key levels
      expect(getLevelFromXP(174)).toBe(3)
      expect(getLevelFromXP(2411)).toBe(15)
      expect(getLevelFromXP(41171)).toBe(41)
      expect(getLevelFromXP(737627)).toBe(70)
      expect(getLevelFromXP(1986068)).toBe(80)
      expect(getLevelFromXP(5346332)).toBe(90)
    })

    it('should handle XP just below level threshold', () => {
      expect(getLevelFromXP(82)).toBe(1) // 1 below level 2
      expect(getLevelFromXP(173)).toBe(2) // 1 below level 3
      expect(getLevelFromXP(13034430)).toBe(98) // 1 below level 99
    })
  })

  describe('getXPForLevel', () => {
    it('should return 0 XP for level 1', () => {
      expect(getXPForLevel(1)).toBe(0)
    })

    it('should return 83 XP for level 2', () => {
      expect(getXPForLevel(2)).toBe(83)
    })

    it('should return correct XP for level 50', () => {
      expect(getXPForLevel(50)).toBe(101333)
    })

    it('should return 13034431 XP for level 99', () => {
      expect(getXPForLevel(99)).toBe(13034431)
    })

    it('should return 0 for level 0', () => {
      expect(getXPForLevel(0)).toBe(0)
    })

    it('should return 0 for negative levels', () => {
      expect(getXPForLevel(-5)).toBe(0)
    })

    it('should return max XP for level 100', () => {
      expect(getXPForLevel(100)).toBe(13034431)
    })

    it('should return max XP for levels above 99', () => {
      expect(getXPForLevel(120)).toBe(13034431)
    })

    it('should return correct XP for all valid levels', () => {
      for (let level = 1; level <= 99; level++) {
        expect(getXPForLevel(level)).toBe(XP_TABLE[level - 1])
      }
    })
  })

  describe('getXPToGoal', () => {
    it('should return 0 when current XP meets goal', () => {
      expect(getXPToGoal(13034431, 99)).toBe(0)
    })

    it('should return 0 when current XP exceeds goal', () => {
      expect(getXPToGoal(20000000, 99)).toBe(0)
    })

    it('should calculate correct XP needed from level 1 to level 2', () => {
      expect(getXPToGoal(0, 2)).toBe(83)
    })

    it('should calculate correct XP needed from level 1 to level 99', () => {
      expect(getXPToGoal(0, 99)).toBe(13034431)
    })

    it('should calculate XP needed with current progress', () => {
      // Currently at 1000 XP (level 10), goal is level 50
      const currentXP = 1000
      const goalXP = getXPForLevel(50) // 101333
      expect(getXPToGoal(currentXP, 50)).toBe(goalXP - currentXP)
    })

    it('should handle exact level XP', () => {
      // Currently at exactly level 40 (37224 XP), goal is level 50
      expect(getXPToGoal(37224, 50)).toBe(101333 - 37224)
    })

    it('should return 0 for invalid goal level (0)', () => {
      expect(getXPToGoal(1000, 0)).toBe(0) // goalXP would be 0, so 0 - 1000 = -1000, max(0, -1000) = 0
    })

    it('should handle negative current XP', () => {
      expect(getXPToGoal(-100, 50)).toBe(101333 - (-100))
    })
  })

  describe('getProgressToGoal', () => {
    it('should return 0% when no progress made', () => {
      expect(getProgressToGoal(0, 50, 1, 0)).toBe(0)
    })

    it('should return 100% when goal is reached', () => {
      const goalXP = getXPForLevel(50)
      expect(getProgressToGoal(goalXP, 50, 1, 0)).toBe(100)
    })

    it('should return 100% when current XP exceeds goal', () => {
      const goalXP = getXPForLevel(50)
      expect(getProgressToGoal(goalXP + 10000, 50, 1, 0)).toBe(100)
    })

    it('should calculate 50% progress correctly', () => {
      const startXP = 0
      const goalXP = getXPForLevel(50) // 101333
      const halfwayXP = goalXP / 2 // 50666.5

      expect(getProgressToGoal(halfwayXP, 50, 1, startXP)).toBe(50)
    })

    it('should use starting level XP when startingXP not provided', () => {
      // Starting at level 40, goal is level 50
      const startLevel = 40
      const startXP = getXPForLevel(40) // 37224
      const goalXP = getXPForLevel(50) // 101333
      const currentXP = 50000

      const expectedProgress = ((currentXP - startXP) / (goalXP - startXP)) * 100
      expect(getProgressToGoal(currentXP, 50, startLevel)).toBeCloseTo(expectedProgress, 5)
    })

    it('should use provided startingXP when given', () => {
      // Started with exact XP in middle of level 40
      const startXP = 38000 // Between level 40 (37224) and 41 (41171)
      const goalXP = getXPForLevel(50) // 101333
      const currentXP = 50000

      const expectedProgress = ((currentXP - startXP) / (goalXP - startXP)) * 100
      expect(getProgressToGoal(currentXP, 50, 40, startXP)).toBeCloseTo(expectedProgress, 5)
    })

    it('should return 100% when starting level equals goal level', () => {
      expect(getProgressToGoal(101333, 50, 50)).toBe(100)
    })

    it('should clamp negative progress to 0%', () => {
      // Current XP is less than starting XP (e.g., data error)
      const startXP = 10000
      const currentXP = 5000
      expect(getProgressToGoal(currentXP, 50, 1, startXP)).toBe(0)
    })

    it('should handle starting level higher than goal (edge case)', () => {
      // This shouldn't happen in practice, but should return 100%
      expect(getProgressToGoal(200000, 50, 60)).toBe(100)
    })

    it('should calculate accurate progress for real scenario', () => {
      // Started at level 70 (737627 XP), goal is level 80, currently have 1000000 XP
      const startXP = 737627
      const goalXP = 1986068
      const currentXP = 1000000

      const expectedProgress = ((currentXP - startXP) / (goalXP - startXP)) * 100
      expect(getProgressToGoal(currentXP, 80, 70, startXP)).toBeCloseTo(expectedProgress, 5)
      expect(getProgressToGoal(currentXP, 80, 70, startXP)).toBeCloseTo(21.02, 1)
    })

    it('should handle fractional progress correctly', () => {
      const startXP = 0
      const goalXP = getXPForLevel(10) // 1154
      const currentXP = 100

      const expectedProgress = (100 / 1154) * 100
      expect(getProgressToGoal(currentXP, 10, 1, startXP)).toBeCloseTo(expectedProgress, 5)
    })

    it('should clamp values between 0 and 100', () => {
      // Test clamping to 0
      expect(getProgressToGoal(0, 50, 40, 50000)).toBe(0)

      // Test clamping to 100
      expect(getProgressToGoal(200000, 50, 1, 0)).toBe(100)
    })

    it('should handle level 1 to 99 goal tracking', () => {
      const startXP = 0
      const goalXP = getXPForLevel(99)
      const currentXP = goalXP / 4 // 25% progress

      expect(getProgressToGoal(currentXP, 99, 1, startXP)).toBeCloseTo(25, 5)
    })
  })
})
