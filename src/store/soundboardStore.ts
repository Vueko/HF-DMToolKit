import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { electronStorage } from '../utils/electronStorage'
import { createMigrate } from './persistMigration'
import { generateId } from '../utils/generateId'
import type { Sound, SoundCategory } from '../types'

interface SoundboardState {
    categories: SoundCategory[]
    sounds: Sound[]
    activeAmbientIds: string[]
    hiddenBuiltinIds: string[]

    addCategory: (name: string) => void
    removeCategory: (id: string) => void
    renameCategory: (id: string, name: string) => void
    addSound: (sound: Sound) => void
    removeSound: (id: string) => void
    updateSound: (id: string, updates: Partial<Sound>) => void
    setActiveAmbientIds: (ids: string[]) => void
    hideBuiltin: (id: string) => void
    unhideBuiltin: (id: string) => void
}

function migrateV1toV2(state: unknown): unknown {
    if (!state || typeof state !== 'object') {
        return { categories: [], sounds: [], hiddenBuiltinIds: [] }
    }
    const s = state as Partial<Pick<SoundboardState, 'categories' | 'sounds' | 'hiddenBuiltinIds'>>
    return {
        categories: Array.isArray(s.categories) ? s.categories : [],
        sounds: Array.isArray(s.sounds) ? s.sounds : [],
        hiddenBuiltinIds: Array.isArray(s.hiddenBuiltinIds) ? s.hiddenBuiltinIds : [],
    }
}

export const useSoundboardStore = create<SoundboardState>()(
    persist(
        (set) => ({
            categories: [],
            sounds: [],
            activeAmbientIds: [],
            hiddenBuiltinIds: [],

            addCategory: (name) =>
                set((s) => ({
                    categories: [
                        ...s.categories,
                        { id: generateId(), name, order: s.categories.length },
                    ],
                })),

            removeCategory: (id) =>
                set((s) => ({
                    categories: s.categories.filter((c) => c.id !== id),
                    sounds: s.sounds.filter((snd) => snd.categoryId !== id),
                })),

            renameCategory: (id, name) =>
                set((s) => ({
                    categories: s.categories.map((c) => (c.id === id ? { ...c, name } : c)),
                })),

            addSound: (sound) =>
                set((s) => ({ sounds: [...s.sounds, sound] })),

            removeSound: (id) =>
                set((s) => ({
                    sounds: s.sounds.filter((snd) => snd.id !== id),
                    activeAmbientIds: s.activeAmbientIds.filter((aid) => aid !== id),
                })),

            updateSound: (id, updates) =>
                set((s) => ({
                    sounds: s.sounds.map((snd) => (snd.id === id ? { ...snd, ...updates } : snd)),
                })),

            setActiveAmbientIds: (ids) => set({ activeAmbientIds: ids }),

            hideBuiltin: (id) =>
                set((s) => ({
                    hiddenBuiltinIds: s.hiddenBuiltinIds.includes(id)
                        ? s.hiddenBuiltinIds
                        : [...s.hiddenBuiltinIds, id],
                    activeAmbientIds: s.activeAmbientIds.filter((aid) => aid !== id),
                })),

            unhideBuiltin: (id) =>
                set((s) => ({
                    hiddenBuiltinIds: s.hiddenBuiltinIds.filter((hiddenId) => hiddenId !== id),
                })),
        }),
        {
            name: 'dh-soundboard',
            version: 2,
            migrate: createMigrate<SoundboardState>(2, { 2: migrateV1toV2 }),
            storage: createJSONStorage(() => electronStorage),
            partialize: (s) => ({
                categories: s.categories,
                sounds: s.sounds,
                hiddenBuiltinIds: s.hiddenBuiltinIds,
            }),
        }
    )
)