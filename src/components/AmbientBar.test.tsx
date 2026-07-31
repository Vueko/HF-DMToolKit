import { beforeEach, describe, expect, test, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Sound } from '../types'
import AmbientBar from './AmbientBar'

let allSounds: Sound[] = []
let activeAmbientIds: string[] = []

vi.mock('../audio/useAllSounds', () => ({
    useAllSounds: () => allSounds,
}))

vi.mock('../store/soundboardStore', () => ({
    useSoundboardStore: () => ({ activeAmbientIds }),
}))

vi.mock('../context/SoundboardContext', () => ({
    useSoundboard: () => ({ stopAmbient: vi.fn(), stopAllAmbients: vi.fn() }),
}))

vi.mock('../i18n', () => ({
    useT: () => (key: string) => key,
}))

beforeEach(() => {
    allSounds = []
    activeAmbientIds = []
})

describe('AmbientBar', () => {
    test('does not render when nothing is active', () => {
        expect(renderToStaticMarkup(<AmbientBar />)).toBe('')
    })

    test('renders active starter ambience from all sounds', () => {
        allSounds = [{ id: 'builtin-rain', name: 'Rain', storedId: 'rain.ogg', type: 'ambient', categoryId: '', tags: ['weather'], builtin: true }]
        activeAmbientIds = ['builtin-rain']

        const html = renderToStaticMarkup(<AmbientBar />)

        expect(html).toContain('audio.ambients')
        expect(html).toContain('Rain')
        expect(html).toContain('audio.stopAll')
    })
})