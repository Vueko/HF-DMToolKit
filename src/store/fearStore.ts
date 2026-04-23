import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FearState {
    fearCount: number
    addFear: (amount: number) => void
    removeFear: (amount: number) => void
    resetFear: () => void
}

export const useFearStore = create<FearState>()(
    persist(
        (set) => ({
            fearCount: 0,
            addFear: (amount) => set((state) => ({ fearCount: state.fearCount + amount })),
            removeFear: (amount) => set((state) => ({ fearCount: Math.max(0, state.fearCount - amount) })),
            resetFear: () => set({ fearCount: 0 }),
        }),
        { name: 'dh-fear' }
    )
)