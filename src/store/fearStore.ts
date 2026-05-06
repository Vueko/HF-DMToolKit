import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { electronStorage } from '../utils/electronStorage'

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
            addFear: (amount) => set((state) => ({ fearCount: Math.min(12, state.fearCount + amount) })),
            removeFear: (amount) => set((state) => ({ fearCount: Math.max(0, state.fearCount - amount) })),
            resetFear: () => set({ fearCount: 0 }),
        }),
        { name: 'dh-fear', storage: createJSONStorage(() => electronStorage) }
    )
)