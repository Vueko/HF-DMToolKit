import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore, migrateSettingsV1toV2 } from './settingsStore'

beforeEach(() => useSettingsStore.setState({ uiScale: 1.0, theme: 'midnight', vaultPath: null }))

describe('settingsStore', () => {
    it('setUiScale', () => {
        useSettingsStore.getState().setUiScale(1.25)
        expect(useSettingsStore.getState().uiScale).toBe(1.25)
    })
    it('setTheme', () => {
        useSettingsStore.getState().setTheme('daylight')
        expect(useSettingsStore.getState().theme).toBe('daylight')
    })
    it('setVaultPath', () => {
        useSettingsStore.getState().setVaultPath('C:/vault')
        expect(useSettingsStore.getState().vaultPath).toBe('C:/vault')
    })
})

describe('migrateSettingsV1toV2', () => {
    it('maps fontSize to uiScale and keeps vaultPath', () => {
        const out = migrateSettingsV1toV2({ fontSize: 'lg', vaultPath: 'C:/v' }) as Record<string, unknown>
        expect(out.uiScale).toBe(1.1)
        expect(out.vaultPath).toBe('C:/v')
        expect(out.theme).toBe('midnight')
        expect('fontSize' in out).toBe(false)
    })
    it('defaults unknown fontSize to 1.0', () => {
        expect((migrateSettingsV1toV2({ fontSize: 'xx' }) as Record<string, unknown>).uiScale).toBe(1.0)
    })
    it('handles undefined state', () => {
        expect((migrateSettingsV1toV2(undefined) as Record<string, unknown>).uiScale).toBe(1.0)
    })
})
