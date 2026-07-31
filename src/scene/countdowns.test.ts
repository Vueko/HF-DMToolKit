import { describe, expect, test } from 'vitest'
import type { Scene } from '../types'
import {
    applyRollOutcomeToCountdowns,
    normalizeSceneCountdowns,
    tickCountdown,
    type CountdownRollOutcome,
} from './countdowns'

const scene = (over: Partial<Scene>): Scene => ({
    id: 's1',
    title: 'Scene',
    status: 'active',
    flag: '',
    count: 0,
    ...over,
})

describe('scene countdowns', () => {
    test('normalizes legacy count/countMax as one standard countdown with remaining segments', () => {
        expect(normalizeSceneCountdowns(scene({ count: 2, countMax: 6 }))).toEqual([{
            id: 'legacy',
            title: 'Clock',
            type: 'standard',
            value: 4,
            max: 6,
        }])
    })

    test('prefers explicit multiple countdowns over legacy fields', () => {
        const countdowns = [{ id: 'a', title: 'Gate', type: 'progress' as const, value: 3, max: 4 }]

        expect(normalizeSceneCountdowns(scene({ count: 2, countMax: 6, countdowns }))).toEqual(countdowns)
    })

    test('ticks countdowns down without going below zero', () => {
        expect(tickCountdown({ id: 'a', title: 'Gate', type: 'standard', value: 1, max: 4 }, 3).value).toBe(0)
    })

    test.each([
        [{ outcome: 'failure', tone: 'fear' }, { consequence: 3, progress: 0 }],
        [{ outcome: 'failure', tone: 'hope' }, { consequence: 2, progress: 0 }],
        [{ outcome: 'success', tone: 'fear' }, { consequence: 1, progress: 1 }],
        [{ outcome: 'success', tone: 'hope' }, { consequence: 0, progress: 2 }],
        [{ outcome: 'success', tone: 'hope', critical: true }, { consequence: 0, progress: 3 }],
    ] as [CountdownRollOutcome, { consequence: number; progress: number }][])(
        'applies dynamic outcome %#',
        (outcome, expected) => {
            const next = applyRollOutcomeToCountdowns([
                { id: 'p', title: 'Open the gate', type: 'progress', value: 6, max: 6 },
                { id: 'c', title: 'Alarm', type: 'consequence', value: 6, max: 6 },
                { id: 's', title: 'Torch', type: 'standard', value: 6, max: 6 },
            ], outcome)

            expect(next.find((c) => c.id === 'p')?.value).toBe(6 - expected.progress)
            expect(next.find((c) => c.id === 'c')?.value).toBe(6 - expected.consequence)
            expect(next.find((c) => c.id === 's')?.value).toBe(5)
        },
    )
})
