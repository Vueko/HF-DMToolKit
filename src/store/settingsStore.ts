import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { electronStorage } from '../utils/electronStorage'
import { createMigrate } from './persistMigration'

export type Theme = 'midnight' | 'ember' | 'slate' | 'daylight'
export const THEMES: Theme[] = ['midnight', 'ember', 'slate', 'daylight']
export const UI_SCALES = [0.9, 1.0, 1.1, 1.25] as const

// v1 (fontSize) → v2 (uiScale + theme). Exportada para tests.
export function migrateSettingsV1toV2(state: unknown): unknown {
    const s = (state && typeof state === 'object' ? { ...(state as Record<string, unknown>) } : {}) as Record<string, unknown>
    const scaleMap: Record<string, number> = { sm: 0.9, md: 1.0, lg: 1.1 }
    const fontSize = s.fontSize
    const uiScale = typeof fontSize === 'string' && fontSize in scaleMap ? scaleMap[fontSize] : 1.0
    const theme = typeof s.theme === 'string' ? s.theme : 'midnight'
    delete s.fontSize
    return { ...s, uiScale, theme }
}

interface SettingsState {
    uiScale: number
    setUiScale: (scale: number) => void
    theme: Theme
    setTheme: (theme: Theme) => void
    vaultPath: string | null
    setVaultPath: (path: string | null) => void
    playerWidgetCollapsed: boolean
    setPlayerWidgetCollapsed: (v: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            uiScale: 1.0,
            setUiScale: (uiScale) => set({ uiScale }),
            theme: 'midnight',
            setTheme: (theme) => set({ theme }),
            vaultPath: null,
            setVaultPath: (vaultPath) => set({ vaultPath }),
            playerWidgetCollapsed: false,
            setPlayerWidgetCollapsed: (playerWidgetCollapsed) => set({ playerWidgetCollapsed }),
        }),
        {
            name: 'dh-settings',
            version: 2,
            migrate: createMigrate<SettingsState>(2, { 2: migrateSettingsV1toV2 }),
            storage: createJSONStorage(() => electronStorage),
        }
    )
)
