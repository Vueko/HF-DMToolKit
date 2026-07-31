import { beforeEach, describe, expect, test, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Sound } from '../types'
import SoundQuickBar from './SoundQuickBar'

let allSounds: Sound[] = []
let activeAmbientIds: string[] = []

vi.mock('./dice/DiceTray', () => ({
    default: () => <button type="button">Dice tray</button>,
}))

vi.mock('../audio/useAllSounds', () => ({
    useAllSounds: () => allSounds,
}))

vi.mock('../audio/filterSounds', () => ({
    allTags: (sounds: Sound[]) => Array.from(new Set(sounds.flatMap((s) => s.tags ?? []))).sort(),
}))

vi.mock('../store/soundboardStore', () => ({
    useSoundboardStore: () => ({ activeAmbientIds }),
}))

vi.mock('../context/SoundboardContext', () => ({
    useSoundboard: () => ({ toggleAmbient: vi.fn(), playOneshot: vi.fn() }),
}))

vi.mock('../i18n', () => ({
    useT: () => (key: string) => key,
}))

beforeEach(() => {
    allSounds = []
    activeAmbientIds = []
})

describe('SoundQuickBar', () => {
    test('renders the dice tray in the quick sound section even without sounds', () => {
        const html = renderToStaticMarkup(<SoundQuickBar />)

        expect(html).toContain('Dice tray')
        expect(html).toContain('bg-ui-surface')
    })

    test('renders tagged starter sounds beside the dice tray', () => {
        allSounds = [{ id: 'builtin-rain', name: 'Rain', storedId: 'rain.ogg', type: 'ambient', categoryId: '', tags: ['weather'], builtin: true }]
        activeAmbientIds = ['builtin-rain']

        const html = renderToStaticMarkup(<SoundQuickBar />)

        expect(html).toContain('weather')
        expect(html).toContain('Rain')
        expect(html).toContain('audio.loop')
        expect(html).toContain('Dice tray')
    })
})