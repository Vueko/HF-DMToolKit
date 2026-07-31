import { create } from 'zustand'
import {
    parseNotation,
    roll,
    rollD20 as rollD20Core,
    rollDuality as rollDualityCore,
    type D20RollResult,
    type DualityRollResult,
    type RollMode,
    type RollResult,
    type RollSpec,
} from '../dice/roll'

const HISTORY_CAP = 50

interface DiceState {
    history: RollResult[]
    trayOpen: boolean
    dualityModifier: number
    dualityAdvantage: number
    dualityDisadvantage: number
    dualityDifficulty?: number
    d20Modifier: number
    d20Mode: RollMode
    notationInput: string

    rollNotation: (notation: string, opts?: { label?: string; rng?: () => number }) => RollResult | null
    rollSpec: (spec: RollSpec, opts?: { label?: string; rng?: () => number }) => RollResult
    rollDuality: (opts?: { modifier?: number; advantage?: number; disadvantage?: number; difficulty?: number; label?: string; rng?: () => number }) => DualityRollResult
    rollD20: (opts?: { modifier?: number; mode?: RollMode; label?: string; rng?: () => number }) => D20RollResult
    logRoll: (result: RollResult) => void
    clearHistory: () => void
    setTrayOpen: (open: boolean) => void
    setDualityModifier: (modifier: number) => void
    setDualityAdvantage: (advantage: number) => void
    setDualityDisadvantage: (disadvantage: number) => void
    setDualityDifficulty: (difficulty?: number) => void
    setD20Modifier: (modifier: number) => void
    setD20Mode: (mode: RollMode) => void
    setNotationInput: (input: string) => void
}

export const useDiceStore = create<DiceState>()((set, get) => ({
    history: [],
    trayOpen: false,
    dualityModifier: 0,
    dualityAdvantage: 0,
    dualityDisadvantage: 0,
    dualityDifficulty: undefined,
    d20Modifier: 0,
    d20Mode: 'normal',
    notationInput: '',

    rollSpec: (spec, opts = {}) => {
        const result = { ...roll(spec, opts.rng), label: opts.label }
        get().logRoll(result)
        return result
    },

    rollNotation: (notation, opts = {}) => {
        const spec = parseNotation(notation)
        if (!spec) return null
        return get().rollSpec(spec, opts)
    },

    rollDuality: (opts = {}) => {
        const state = get()
        const result = rollDualityCore({
            modifier: opts.modifier ?? state.dualityModifier,
            advantage: opts.advantage ?? state.dualityAdvantage,
            disadvantage: opts.disadvantage ?? state.dualityDisadvantage,
            difficulty: opts.difficulty ?? state.dualityDifficulty,
            label: opts.label,
        }, opts.rng)
        get().logRoll(result)
        return result
    },

    rollD20: (opts = {}) => {
        const state = get()
        const result = rollD20Core({
            modifier: opts.modifier ?? state.d20Modifier,
            mode: opts.mode ?? state.d20Mode,
            label: opts.label,
        }, opts.rng)
        get().logRoll(result)
        return result
    },

    logRoll: (result) => set((state) => ({ history: [result, ...state.history].slice(0, HISTORY_CAP) })),
    clearHistory: () => set({ history: [] }),
    setTrayOpen: (open) => set((state) => ({
        trayOpen: open,
        d20Mode: open ? state.d20Mode : 'normal',
        dualityAdvantage: open ? state.dualityAdvantage : 0,
        dualityDisadvantage: open ? state.dualityDisadvantage : 0,
    })),
    setDualityModifier: (dualityModifier) => set({ dualityModifier }),
    setDualityAdvantage: (dualityAdvantage) => set({ dualityAdvantage }),
    setDualityDisadvantage: (dualityDisadvantage) => set({ dualityDisadvantage }),
    setDualityDifficulty: (dualityDifficulty) => set({ dualityDifficulty }),
    setD20Modifier: (d20Modifier) => set({ d20Modifier }),
    setD20Mode: (d20Mode) => set({ d20Mode }),
    setNotationInput: (notationInput) => set({ notationInput }),
}))
