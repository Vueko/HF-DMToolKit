import { create } from 'zustand'

interface FearState {
    fearCount: number;
    addFear: (amount: number) => void;
    removeFear: (amount: number) => void;
    resetFear: () => void;
}

export const useFearStore = create<FearState>((set) => ({
    fearCount: 0,
    addFear: (amount: number) => set((state) => ({ fearCount: state.fearCount + amount })),
    removeFear: (amount: number) => set((state) => ({ fearCount: Math.max(0, state.fearCount - amount) })),
    resetFear: () => set({ fearCount: 0 }),
}));