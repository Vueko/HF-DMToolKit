import { describe, it, expect } from 'vitest'
import {
    ADJUSTMENT_DELTAS, MANUAL_ADJUSTMENTS, AUTO_ADJUSTMENTS,
    soloCount, lowerTierCount, computeAutoAdjustments, activeAdjustments, calcBattlePoints,
    type RosterCard,
} from './encounterBudget'

const cards = new Map<string, RosterCard>([
    ['solo1', { role: 'Solo', tier: 3 }],
    ['solo2', { role: 'Solo', tier: 2 }],
    ['bruiser', { role: 'Bruiser', tier: 3 }],
    ['t1', { role: 'Standard', tier: 1 }],
    ['notier', { role: 'Minion' }],
])

describe('deltas & sets', () => {
    it('has the exact deltas', () => {
        expect(ADJUSTMENT_DELTAS).toEqual({
            easy_short: -1, dangerous_long: 2, no_heavy_roles: 1,
            bonus_damage: -2, two_plus_solos: -2, lower_tier: 1,
        })
    })
    it('categorises manual vs auto', () => {
        expect(MANUAL_ADJUSTMENTS).toEqual(['easy_short', 'dangerous_long', 'no_heavy_roles', 'bonus_damage'])
        expect(AUTO_ADJUSTMENTS).toEqual(['two_plus_solos', 'lower_tier'])
    })
})

describe('soloCount', () => {
    it('counts Solo instances by their count', () => {
        expect(soloCount([{ cardId: 'solo1', count: 2 }, { cardId: 'bruiser', count: 1 }], cards)).toBe(2)
    })
    it('is 0 with no solos', () => {
        expect(soloCount([{ cardId: 'bruiser', count: 3 }], cards)).toBe(0)
    })
})

describe('lowerTierCount', () => {
    it('counts adversaries below the encounter tier', () => {
        expect(lowerTierCount([{ cardId: 't1', count: 2 }, { cardId: 'bruiser', count: 1 }], cards, 3)).toBe(2)
    })
    it('is 0 when encounterTier is undefined', () => {
        expect(lowerTierCount([{ cardId: 't1', count: 1 }], cards, undefined)).toBe(0)
    })
    it('ignores cards without a tier', () => {
        expect(lowerTierCount([{ cardId: 'notier', count: 5 }], cards, 3)).toBe(0)
    })
})

describe('computeAutoAdjustments', () => {
    it('adds two_plus_solos at >=2 solos and lower_tier at >=1 lower', () => {
        expect(computeAutoAdjustments([{ cardId: 'solo1', count: 1 }, { cardId: 'solo2', count: 1 }, { cardId: 't1', count: 1 }], cards, 3))
            .toEqual(['two_plus_solos', 'lower_tier'])
    })
    it('adds neither below thresholds', () => {
        expect(computeAutoAdjustments([{ cardId: 'solo1', count: 1 }, { cardId: 'bruiser', count: 1 }], cards, 3))
            .toEqual([])
    })
})

describe('activeAdjustments', () => {
    it('keeps only manual stored keys and appends auto', () => {
        expect(activeAdjustments(['easy_short', 'two_plus_solos', 'no_heavy_roles'], ['lower_tier']))
            .toEqual(['easy_short', 'no_heavy_roles', 'lower_tier'])
    })
})

describe('calcBattlePoints', () => {
    it('base is (3*PCs)+2 with no adjustments', () => {
        expect(calcBattlePoints(4, [])).toBe(14)
    })
    it('applies deltas on top of base', () => {
        expect(calcBattlePoints(4, ['bonus_damage', 'lower_tier'])).toBe(13)
    })
})
