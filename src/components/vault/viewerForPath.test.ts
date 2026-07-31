import { describe, expect, it } from 'vitest'
import { viewerForPath } from './viewerForPath'

describe('viewerForPath', () => {
    it('maps wiki vault files to the correct viewer by extension', () => {
        expect(viewerForPath('Notes/Intro.md')).toBe('markdown')
        expect(viewerForPath('maps/City.PNG')).toBe('image')
        expect(viewerForPath('portraits/hero.webp')).toBe('image')
        expect(viewerForPath('Handouts/Countdown.pdf')).toBe('pdf')
        expect(viewerForPath('Lore/Session Brief.docx')).toBe('doc')
    })

    it('keeps unknown files on the markdown path', () => {
        expect(viewerForPath('README')).toBe('markdown')
        expect(viewerForPath('archive/notes.txt')).toBe('markdown')
    })
})
