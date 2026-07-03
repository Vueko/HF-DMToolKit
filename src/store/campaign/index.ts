import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { electronStorage } from '../../utils/electronStorage'
import { createMigrate } from '../persistMigration'
import type { CampaignState } from './types'
import { createCampaignsSlice } from './slices/campaigns'
import { createSessionsSlice } from './slices/sessions'
import { createScenesSlice } from './slices/scenes'
import { createCardInstancesSlice } from './slices/cardInstances'
import { createPlaylistsSlice } from './slices/playlists'
import { createMapSlice } from './slices/map'
import { createEncountersSlice } from './slices/encounters'

export const useCampaignStore = create<CampaignState>()(
    persist(
        (set, get) => ({
            campaigns: [],
            currentCampaignId: null,
            currentSessionId: null,
            ...createCampaignsSlice(set, get),
            ...createSessionsSlice(set, get),
            ...createScenesSlice(set, get),
            ...createCardInstancesSlice(set, get),
            ...createPlaylistsSlice(set, get),
            ...createMapSlice(set, get),
            ...createEncountersSlice(set, get),
        }),
        { name: 'dh-campaigns', version: 1, migrate: createMigrate<CampaignState>(1, {}), storage: createJSONStorage(() => electronStorage) }
    )
)

export type { CampaignState } from './types'
