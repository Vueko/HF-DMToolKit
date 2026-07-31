import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import type { Campaign } from '../types'
import type { CampaignState, CampaignSet, CampaignGet } from '../store/campaign/types'

vi.mock('../store/campaignStore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../store/campaignStore')>()
    const { createCampaignsSlice } = await import('../store/campaign/slices/campaigns')
    const { createSessionsSlice } = await import('../store/campaign/slices/sessions')
    const { createSessionItemsSlice } = await import('../store/campaign/slices/sessionItems')
    const { createScenesSlice } = await import('../store/campaign/slices/scenes')
    const { createCardInstancesSlice } = await import('../store/campaign/slices/cardInstances')
    const { createPlaylistsSlice } = await import('../store/campaign/slices/playlists')
    const { createMapSlice } = await import('../store/campaign/slices/map')
    const { createEncountersSlice } = await import('../store/campaign/slices/encounters')

    let state: CampaignState
    const set: CampaignSet = (partial, replace) => {
        const next = typeof partial === 'function'
            ? (partial as (s: CampaignState) => Partial<CampaignState> | CampaignState)(state)
            : partial
        state = replace ? (next as CampaignState) : { ...state, ...next }
    }
    const get: CampaignGet = () => state

    state = {
        campaigns: [],
        currentCampaignId: null,
        currentSessionId: null,
        ...createCampaignsSlice(set, get),
        ...createSessionsSlice(set, get),
        ...createSessionItemsSlice(set, get),
        ...createScenesSlice(set, get),
        ...createCardInstancesSlice(set, get),
        ...createPlaylistsSlice(set, get),
        ...createMapSlice(set, get),
        ...createEncountersSlice(set, get),
    }

    function useCampaignStore<T = typeof state>(selector?: (s: typeof state) => T): T {
        return (selector ? selector(state) : state) as T
    }
    useCampaignStore.getState = () => state
    useCampaignStore.setState = set
    useCampaignStore.subscribe = () => () => {}

    return { ...actual, useCampaignStore }
})

const { useCampaignStore } = await import('../store/campaignStore')
const SceneTracker = (await import('./SceneTracker')).default

const campaign = (): Campaign => ({
    id: 'c1',
    name: 'C',
    scenes: [
        { id: 'sc-up', title: 'Moonlit gate', status: 'upcoming', flag: '', count: 0 },
        { id: 'sc-active', title: 'Burning bridge', status: 'active', flag: '', count: 0, countdowns: [
            { id: 'cd1', title: 'Ritual breaks', type: 'progress', value: 4, max: 4 },
        ] },
    ],
    sessions: [{
        id: 's1',
        name: 'Session 1',
        number: 1,
        sceneIds: ['sc-up', 'sc-active'],
        encounterIds: [],
        cardInstances: [],
        items: [{ id: 'i1', kind: 'clue', title: 'The bridge was cut from below', done: false }],
    }],
    playlists: [],
})

beforeEach(() => {
    useCampaignStore.setState({ campaigns: [campaign()], currentCampaignId: 'c1', currentSessionId: 's1' })
})

describe('SceneTracker session log port', () => {
    it('renders the current session log items with the unified scene section', () => {
        const html = renderToStaticMarkup(<MemoryRouter><SceneTracker /></MemoryRouter>)

        expect(html).toContain('Scenes')
        expect(html).toContain('Clues')
        expect(html).toContain('The bridge was cut from below')
        expect(html).toContain('Ritual breaks')
    })

    it('sorts active scenes before upcoming scenes in the unified list', () => {
        const html = renderToStaticMarkup(<MemoryRouter><SceneTracker /></MemoryRouter>)

        expect(html.indexOf('Burning bridge')).toBeLessThan(html.indexOf('Moonlit gate'))
    })
})
