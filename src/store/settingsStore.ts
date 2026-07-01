import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { electronStorage } from '../utils/electronStorage'
import { createMigrate } from './persistMigration'

export type FontSize = 'sm' | 'md' | 'lg'

interface SettingsState {
    fontSize: FontSize
    setFontSize: (size: FontSize) => void
    vaultPath: string | null
    setVaultPath: (path: string | null) => void
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            fontSize: 'md',
            setFontSize: (fontSize) => set({ fontSize }),
            vaultPath: null,
            setVaultPath: (vaultPath) => set({ vaultPath }),
        }),
        { name: 'dh-settings', version: 1, migrate: createMigrate<SettingsState>(1, {}), storage: createJSONStorage(() => electronStorage) }
    )
)
