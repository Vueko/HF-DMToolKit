import { describe, expect, test } from 'vitest'
import {
    criticalDamageNotation,
    formatSpec,
    parseNotation,
    roll,
    rollD20,
    rollDuality,
} from './roll'

const rngFrom = (values: number[]) => {
    let i = 0
    return () => values[i++] ?? 0
}

describe('dice notation', () => {
    test('parses omitted dice counts and signed modifiers', () => {
        const spec = parseNotation('d8 + 3 - 1d4')

        expect(spec).toEqual({
            terms: [
                { count: 1, sides: 8, sign: 1 },
                3,
                { count: 1, sides: 4, sign: -1 },
            ],
        })
        expect(spec ? formatSpec(spec) : null).toBe('1d8+3-1d4')
    })

    test('rejects notation outside bounded dice limits', () => {
        expect(parseNotation('41d6')).toBeNull()
        expect(parseNotation('1d1')).toBeNull()
        expect(parseNotation('1d1001')).toBeNull()
    })

    test('rolls generic damage notation deterministically', () => {
        const spec = parseNotation('2d6+3')
        expect(spec).not.toBeNull()

        const result = roll(spec!, rngFrom([0, 0.99]))

        expect(result.total).toBe(10)
        expect(result.notation).toBe('2d6+3')
        expect(result.terms[0].rolls).toEqual([1, 6])
    })

    test('builds Daggerheart critical damage by adding max dice instead of doubling flat modifiers', () => {
        expect(criticalDamageNotation('2d8+1')).toBe('2d8+1+16')
        expect(criticalDamageNotation('d6+2')).toBe('1d6+2+6')
        expect(criticalDamageNotation('bad')).toBeNull()
    })
})

describe('Daggerheart rolls', () => {
    test('rolls PC Duality with advantage d6 added to the total', () => {
        const result = rollDuality({ modifier: 2, advantage: 1 }, rngFrom([0.25, 0.75, 0.5]))

        expect(result.hope).toBe(4)
        expect(result.fear).toBe(10)
        expect(result.extraDice).toEqual([{ sides: 6, value: 4, sign: 1, label: 'advantage' }])
        expect(result.total).toBe(20)
        expect(result.outcomeTone).toBe('fear')
        expect(result.critical).toBe(false)
    })

    test('rolls PC Duality with disadvantage d6 subtracted from the total', () => {
        const result = rollDuality({ modifier: 1, disadvantage: 1 }, rngFrom([0.9, 0.1, 0.99]))

        expect(result.hope).toBe(11)
        expect(result.fear).toBe(2)
        expect(result.total).toBe(8)
        expect(result.extraDice).toEqual([{ sides: 6, value: 6, sign: -1, label: 'disadvantage' }])
        expect(result.outcomeTone).toBe('hope')
    })

    test('cancels PC advantage and disadvantage one for one', () => {
        const result = rollDuality({ advantage: 2, disadvantage: 1 }, rngFrom([0, 0.5, 0.25]))

        expect(result.extraDice).toEqual([{ sides: 6, value: 2, sign: 1, label: 'advantage' }])
        expect(result.total).toBe(10)
    })

    test('marks matching Duality Dice as a critical success with Hope tone', () => {
        const result = rollDuality({}, rngFrom([0.25, 0.25]))

        expect(result.hope).toBe(4)
        expect(result.fear).toBe(4)
        expect(result.critical).toBe(true)
        expect(result.outcomeTone).toBe('hope')
    })

    test('rolls GM d20 attacks with high and low keep modes', () => {
        expect(rollD20({ modifier: 4 }, rngFrom([0.45])).total).toBe(14)

        const high = rollD20({ modifier: 4, mode: 'advantage' }, rngFrom([0.05, 0.95]))
        expect(high.rolls).toEqual([2, 20])
        expect(high.kept).toBe(20)
        expect(high.total).toBe(24)
        expect(high.critical).toBe(true)

        const low = rollD20({ modifier: -1, mode: 'disadvantage' }, rngFrom([0.05, 0.95]))
        expect(low.kept).toBe(2)
        expect(low.total).toBe(1)
    })
})

