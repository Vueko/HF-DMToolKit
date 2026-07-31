import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { VaultTree } from './VaultTree'
import type { VaultNode } from '../../types'

vi.mock('../icons', () => ({
    FileTextIcon: ({ className }: { className?: string }) => <span className={className}>file</span>,
    ImageIcon: ({ className }: { className?: string }) => <span className={className}>image</span>,
}))

describe('VaultTree', () => {
    it('shows notes, images, PDFs, and DOCX files as selectable wiki entries', () => {
        const tree = {
            name: 'Vault',
            path: '',
            type: 'folder',
            children: [
                { name: 'Intro.md', path: 'Intro.md', type: 'note' },
                { name: 'Map.png', path: 'Map.png', type: 'image' },
                { name: 'Rules.pdf', path: 'Rules.pdf', type: 'pdf' },
                { name: 'Handout.docx', path: 'Handout.docx', type: 'doc' },
            ],
        } as unknown as VaultNode

        const html = renderToStaticMarkup(<VaultTree node={tree} activePath="Rules.pdf" onSelect={() => {}} />)

        expect(html).toContain('Intro')
        expect(html).toContain('Map.png')
        expect(html).toContain('Rules.pdf')
        expect(html).toContain('Handout.docx')
    })
})
