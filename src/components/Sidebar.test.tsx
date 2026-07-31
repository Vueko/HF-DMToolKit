import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'

vi.mock('../store/campaignStore', () => ({
    useCampaignStore: () => ({ campaigns: [], currentCampaignId: null }),
}))

const Sidebar = (await import('./Sidebar')).default

describe('Sidebar navigation', () => {
    it('does not expose the deleted GM Tools page', () => {
        const html = renderToStaticMarkup(<MemoryRouter><Sidebar /></MemoryRouter>)

        expect(html).not.toContain('GM Tools')
        expect(html).not.toContain('/dm-screen')
    })
})
