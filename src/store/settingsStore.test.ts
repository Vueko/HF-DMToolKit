import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from './settingsStore'

beforeEach(() => useSettingsStore.setState({ fontSize: 'md', vaultPath: null }))

describe('settingsStore', () => {
    it('setFontSize', () => {
        useSettingsStore.getState().setFontSize('lg')
        expect(useSettingsStore.getState().fontSize).toBe('lg')
    })
    it('setVaultPath', () => {
        useSettingsStore.getState().setVaultPath('C:/vault')
        expect(useSettingsStore.getState().vaultPath).toBe('C:/vault')
    })
})
