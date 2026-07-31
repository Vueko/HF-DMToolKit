import { describe, expect, test } from 'vitest'
import { parseTrayRollInput } from './trayInputs'

describe('parseTrayRollInput', () => {
    test('treats blank and numeric input as a d20 roll modifier', () => {
        expect(parseTrayRollInput('')).toEqual({ kind: 'd20', modifier: 0 })
        expect(parseTrayRollInput('+4')).toEqual({ kind: 'd20', modifier: 4 })
        expect(parseTrayRollInput('-2')).toEqual({ kind: 'd20', modifier: -2 })
        expect(parseTrayRollInput('6')).toEqual({ kind: 'd20', modifier: 6 })
    })

    test('treats dice notation as a damage roll', () => {
        expect(parseTrayRollInput('d8+3')).toEqual({ kind: 'notation', notation: 'd8+3' })
        expect(parseTrayRollInput('2d10+6')).toEqual({ kind: 'notation', notation: '2d10+6' })
    })

    test('rejects unknown roll text and typed advantage words', () => {
        expect(parseTrayRollInput('bad')).toBeNull()
        expect(parseTrayRollInput('+2 adv')).toBeNull()
        expect(parseTrayRollInput('disadvantage')).toBeNull()
    })
})