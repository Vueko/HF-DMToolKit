import { describe, expect, it } from 'vitest'
import { isAllowedVaultBinaryExtension, isAllowedVaultImageExtension, VAULT_BINARY_EXT } from './mainSecurity'

describe('main process vault security helpers', () => {
    it('rejects SVG vault images because SVG can execute active content', () => {
        for (const ext of ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.PNG']) {
            expect(isAllowedVaultImageExtension(ext)).toBe(true)
        }

        for (const ext of ['.svg', '.html', '.js', '', 12, null, undefined]) {
            expect(isAllowedVaultImageExtension(ext as unknown)).toBe(false)
        }
    })

    it('allows only images, PDF, and DOCX through binary vault reads', () => {
        for (const ext of ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf', '.docx', '.PDF', '.DOCX']) {
            expect(isAllowedVaultBinaryExtension(ext)).toBe(true)
        }

        for (const ext of ['.md', '.txt', '.doc', '.svg', '.exe', '.js', '', 12, null, undefined]) {
            expect(isAllowedVaultBinaryExtension(ext as unknown)).toBe(false)
        }

        expect(VAULT_BINARY_EXT.has('.pdf')).toBe(true)
        expect(VAULT_BINARY_EXT.has('.svg')).toBe(false)
    })
})
