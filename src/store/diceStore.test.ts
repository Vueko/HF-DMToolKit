import { beforeEach, describe, expect, test } from 'vitest'
import { useDiceStore } from './diceStore'

beforeEach(() => {
    useDiceStore.setState({
        history: [],
        trayOpen: false,
        dualityModifier: 0,
        d20Modifier: 0,
        d20Mode: 'normal',
    })
})

describe('diceStore', () => {
    test('logs notation rolls and keeps the newest result first', () => {
        const first = useDiceStore.getState().rollNotation('1d4', { rng: () => 0 })
        const second = useDiceStore.getState().rollNotation('1d4', { rng: () => 0.99 })

        expect(first?.total).toBe(1)
        expect(second?.total).toBe(4)
        expect(useDiceStore.getState().history.map((r) => r.id)).toEqual([second?.id, first?.id])
    })

    test('caps session history at 50 rolls', () => {
        for (let i = 0; i < 55; i++) {
            useDiceStore.getState().rollNotation('1d4', { rng: () => 0 })
        }

        expect(useDiceStore.getState().history).toHaveLength(50)
    })

    test('logs Duality and d20 rolls with Daggerheart roll types', () => {
        const duality = useDiceStore.getState().rollDuality({ modifier: 2, rng: () => 0 })
        const d20 = useDiceStore.getState().rollD20({ modifier: 3, rng: () => 0 })

        expect(duality.kind).toBe('duality')
        expect(d20.kind).toBe('d20')
        expect(useDiceStore.getState().history.map((r) => r.kind)).toEqual(['d20', 'duality'])
    })

    test('clears history and resets transient tray controls when closed', () => {
        useDiceStore.getState().rollNotation('1d4', { rng: () => 0 })
        useDiceStore.getState().setTrayOpen(true)
        useDiceStore.getState().setD20Mode('advantage')
        useDiceStore.getState().setTrayOpen(false)
        useDiceStore.getState().clearHistory()

        expect(useDiceStore.getState().trayOpen).toBe(false)
        expect(useDiceStore.getState().d20Mode).toBe('normal')
        expect(useDiceStore.getState().history).toEqual([])
    })
})
