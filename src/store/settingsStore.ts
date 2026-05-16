import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { electronStorage } from '../utils/electronStorage'

export type FontSize = 'sm' | 'md' | 'lg'

interface SettingsState {
    fontSize: FontSize
    setFontSize: (size: FontSize) => void
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            fontSize: 'md',
            setFontSize: (fontSize) => set({ fontSize }),
        }),
        { name: 'dh-settings', storage: createJSONStorage(() => electronStorage) }
    )
)
