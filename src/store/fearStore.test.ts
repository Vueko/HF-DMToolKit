import { describe, it, expect, beforeEach } from 'vitest'
import { useFearStore } from './fearStore'

beforeEach(() => useFearStore.setState({ fearCount: 0 }))

describe('fearStore', () => {
    it('addFear clamps at 12', () => {
        useFearStore.getState().addFear(5)
        expect(useFearStore.getState().fearCount).toBe(5)
        useFearStore.getState().addFear(10)
        expect(useFearStore.getState().fearCount).toBe(12)
    })
    it('removeFear clamps at 0', () => {
        useFearStore.getState().addFear(3)
        useFearStore.getState().removeFear(10)
        expect(useFearStore.getState().fearCount).toBe(0)
    })
    it('resetFear sets it to 0', () => {
        useFearStore.getState().addFear(4)
        useFearStore.getState().resetFear()
        expect(useFearStore.getState().fearCount).toBe(0)
    })
})
