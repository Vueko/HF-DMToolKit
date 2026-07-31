import { describe, expect, test } from 'vitest'
import { parseAttackModifier, rollableDamageNotation } from './cardRolls'

describe('card roll helpers', () => {
    test('parses signed adversary attack modifiers', () => {
        expect(parseAttackModifier('+4')).toBe(4)
        expect(parseAttackModifier('-2')).toBe(-2)
        expect(parseAttackModifier('0')).toBe(0)
    })

    test('rejects non-numeric attack modifiers', () => {
        expect(parseAttackModifier('Close +4')).toBeNull()
        expect(parseAttackModifier('')).toBeNull()
    })

    test('accepts bounded damage notation and preserves original text', () => {
        expect(rollableDamageNotation('2d10+6')).toBe('2d10+6')
        expect(rollableDamageNotation(' d8 + 3 ')).toBe('d8 + 3')
        expect(rollableDamageNotation('not damage')).toBeNull()
    })
})
