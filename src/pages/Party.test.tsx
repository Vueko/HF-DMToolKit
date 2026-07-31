import { describe, expect, test, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import Party from './Party'

vi.mock('../store/campaignStore', () => ({
    useCampaignStore: () => ({
        campaigns: [{ id: 'c1', name: 'Bright March', scenes: [], sessions: [], playlists: [] }],
        currentCampaignId: 'c1',
    }),
}))

vi.mock('../store/partyStore', () => ({
    partyOf: () => [{
        id: 'pc1',
        name: 'Seren',
        playerName: 'Mara',
        hp: { current: 4, max: 6 },
        stress: { current: 1, max: 6 },
        armorSlots: { current: 2, max: 3 },
        evasion: 12,
        thresholds: { major: 8, severe: 15 },
    }],
    usePartyStore: () => ({
        addMember: vi.fn(),
        updateMember: vi.fn(),
        removeMember: vi.fn(),
    }),
}))

describe('Party page', () => {
    test('renders Daggerheart PC resources without combat tracker fields', () => {
        const html = renderToStaticMarkup(<Party />)

        expect(html).toContain('PC Resources')
        expect(html).toContain('Seren')
        expect(html).toContain('HP')
        expect(html).toContain('Stress')
        expect(html).toContain('Armor Slots')
        expect(html).toContain('Evasion')
        expect(html).toContain('Major')
        expect(html).not.toContain('Initiative')
    })
})
