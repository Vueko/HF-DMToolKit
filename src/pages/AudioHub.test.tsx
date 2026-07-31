import { describe, expect, test, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import AudioHub from './AudioHub'

vi.mock('../components/audio/MusicSection', () => ({
    default: () => <section>Music tab content</section>,
}))

vi.mock('../components/soundboard/SoundsSection', () => ({
    default: () => <section>Sounds tab content</section>,
}))

vi.mock('../i18n', () => ({
    useT: () => (key: string) => key,
}))

const render = (entry: string) => renderToStaticMarkup(
    <MemoryRouter initialEntries={[entry]}>
        <AudioHub />
    </MemoryRouter>,
)

describe('AudioHub', () => {
    test('defaults to the music tab', () => {
        const html = render('/audio')

        expect(html).toContain('audio.title')
        expect(html).toContain('audio.tabMusic')
        expect(html).toContain('Music tab content')
    })

    test('renders sounds tab from the query string', () => {
        const html = render('/audio?tab=sounds')

        expect(html).toContain('audio.tabSounds')
        expect(html).toContain('Sounds tab content')
    })
})