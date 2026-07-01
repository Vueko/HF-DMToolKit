import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { electronStorage } from '../utils/electronStorage'
import type { Campaign, Session, Scene, SessionCardInstance, Track, Playlist, CampaignMapData, Encounter, EncounterCardInstance, PlayerScreenImage, MapLibraryEntry } from '../types'

interface CampaignState {
    campaigns: Campaign[]
    currentCampaignId: string | null
    currentSessionId: string | null

    addCampaign: (campaign: Campaign) => void
    removeCampaign: (id: string) => void
    setCurrentCampaign: (id: string) => void

    addSession: (campaignId: string, session: Session) => void
    removeSession: (campaignId: string, sessionId: string) => void
    setCurrentSession: (campaignId: string, sessionId: string) => void

    addScene: (campaignId: string, scene: Scene) => void
    updateScene: (campaignId: string, sceneId: string, updates: Partial<Scene>) => void
    removeScene: (campaignId: string, sceneId: string) => void
    addSceneToSession: (campaignId: string, sessionId: string, sceneId: string) => void
    removeSceneFromSession: (campaignId: string, sessionId: string, sceneId: string) => void

    addCardToSession: (campaignId: string, sessionId: string, instance: SessionCardInstance) => void
    removeCardFromSession: (campaignId: string, sessionId: string, instanceId: string) => void
    updateCardInstance: (campaignId: string, sessionId: string, instanceId: string, updates: Partial<SessionCardInstance>) => void

    updateCampaignRules: (campaignId: string, rules: string) => void

    addPlaylist: (campaignId: string, playlist: Playlist) => void
    removePlaylist: (campaignId: string, playlistId: string) => void
    renamePlaylist: (campaignId: string, playlistId: string, name: string) => void
    addTrackToPlaylist: (campaignId: string, playlistId: string, track: Track) => void
    removeTrackFromPlaylist: (campaignId: string, playlistId: string, trackId: string) => void
    reorderTracksInPlaylist: (campaignId: string, playlistId: string, tracks: Track[]) => void
    updateTrackInPlaylist: (campaignId: string, playlistId: string, trackId: string, updates: Partial<Track>) => void
    updateCampaignMap: (campaignId: string, map: Partial<CampaignMapData>) => void

    addEncounter: (campaignId: string, encounter: Encounter) => void
    removeEncounter: (campaignId: string, encounterId: string) => void
    updateEncounter: (campaignId: string, encounterId: string, updates: Partial<Encounter>) => void
    setActiveEncounter: (campaignId: string, encounterId: string | null) => void
    updateEncounterInstance: (campaignId: string, encounterId: string, instanceId: string, updates: Partial<EncounterCardInstance>) => void
    addEncounterToSession: (campaignId: string, sessionId: string, encounterId: string) => void
    removeEncounterFromSession: (campaignId: string, sessionId: string, encounterId: string) => void

    addPlayerScreenImage: (campaignId: string, image: PlayerScreenImage) => void
    removePlayerScreenImage: (campaignId: string, imageId: string) => void
    setActiveMap: (campaignId: string, storedId: string | null) => void

    addMapLibraryEntry: (campaignId: string, entry: MapLibraryEntry) => void
    removeMapLibraryEntry: (campaignId: string, entryId: string) => void
    setActiveMapRotation: (campaignId: string, rotation: 0 | 90) => void
}

function updateCampaign(campaigns: Campaign[], id: string, updater: (c: Campaign) => Campaign): Campaign[] {
    return campaigns.map((c) => c.id === id ? updater(c) : c)
}

function updateSession(campaign: Campaign, sessionId: string, updater: (s: Session) => Session): Campaign {
    return {
        ...campaign,
        sessions: campaign.sessions.map((s) => s.id === sessionId ? updater(s) : s),
    }
}

export const useCampaignStore = create<CampaignState>()(
    persist(
        (set) => ({
            campaigns: [],
            currentCampaignId: null,
            currentSessionId: null,

            addCampaign: (campaign) =>
                set((state) => ({ campaigns: [...state.campaigns, campaign] })),

            removeCampaign: (id) =>
                set((state) => ({
                    campaigns: state.campaigns.filter((c) => c.id !== id),
                    currentCampaignId: state.currentCampaignId === id ? null : state.currentCampaignId,
                    currentSessionId: state.currentCampaignId === id ? null : state.currentSessionId,
                })),

            setCurrentCampaign: (id) =>
                set({ currentCampaignId: id, currentSessionId: null }),

            addSession: (campaignId, session) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        sessions: [...c.sessions, session],
                    })),
                })),

            removeSession: (campaignId, sessionId) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        sessions: c.sessions.filter((s) => s.id !== sessionId),
                    })),
                    currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId,
                })),

            setCurrentSession: (campaignId, sessionId) =>
                set({ currentCampaignId: campaignId, currentSessionId: sessionId }),

            addScene: (campaignId, scene) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        scenes: [...c.scenes, scene],
                    })),
                })),

            updateScene: (campaignId, sceneId, updates) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        scenes: c.scenes.map((s) => s.id === sceneId ? { ...s, ...updates } : s),
                    })),
                })),

            removeScene: (campaignId, sceneId) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        scenes: c.scenes.filter((s) => s.id !== sceneId),
                        sessions: c.sessions.map((s) => ({
                            ...s,
                            sceneIds: s.sceneIds.filter((id) => id !== sceneId),
                        })),
                    })),
                })),

            addSceneToSession: (campaignId, sessionId, sceneId) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) =>
                        updateSession(c, sessionId, (s) => ({
                            ...s,
                            sceneIds: s.sceneIds.includes(sceneId) ? s.sceneIds : [...s.sceneIds, sceneId],
                        }))
                    ),
                })),

            removeSceneFromSession: (campaignId, sessionId, sceneId) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) =>
                        updateSession(c, sessionId, (s) => ({
                            ...s,
                            sceneIds: s.sceneIds.filter((id) => id !== sceneId),
                        }))
                    ),
                })),

            addCardToSession: (campaignId, sessionId, instance) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) =>
                        updateSession(c, sessionId, (s) => ({
                            ...s,
                            cardInstances: [...s.cardInstances, instance],
                        }))
                    ),
                })),

            removeCardFromSession: (campaignId, sessionId, instanceId) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) =>
                        updateSession(c, sessionId, (s) => ({
                            ...s,
                            cardInstances: s.cardInstances.filter((i) => i.instanceId !== instanceId),
                        }))
                    ),
                })),

            updateCardInstance: (campaignId, sessionId, instanceId, updates) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) =>
                        updateSession(c, sessionId, (s) => ({
                            ...s,
                            cardInstances: s.cardInstances.map((i) =>
                                i.instanceId === instanceId ? { ...i, ...updates } : i
                            ),
                        }))
                    ),
                })),

            updateCampaignRules: (campaignId, rules) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        dmScreenRules: rules,
                    })),
                })),

            addPlaylist: (campaignId, playlist) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        playlists: [...(c.playlists ?? []), playlist],
                    })),
                })),

            removePlaylist: (campaignId, playlistId) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        playlists: (c.playlists ?? []).filter((p) => p.id !== playlistId),
                    })),
                })),

            renamePlaylist: (campaignId, playlistId, name) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        playlists: (c.playlists ?? []).map((p) =>
                            p.id === playlistId ? { ...p, name } : p
                        ),
                    })),
                })),

            addTrackToPlaylist: (campaignId, playlistId, track) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        playlists: (c.playlists ?? []).map((p) =>
                            p.id === playlistId ? { ...p, tracks: [...p.tracks, track] } : p
                        ),
                    })),
                })),

            removeTrackFromPlaylist: (campaignId, playlistId, trackId) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        playlists: (c.playlists ?? []).map((p) =>
                            p.id === playlistId
                                ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) }
                                : p
                        ),
                    })),
                })),

            reorderTracksInPlaylist: (campaignId, playlistId, tracks) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        playlists: (c.playlists ?? []).map((p) =>
                            p.id === playlistId ? { ...p, tracks } : p
                        ),
                    })),
                })),

            updateTrackInPlaylist: (campaignId, playlistId, trackId, updates) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        playlists: (c.playlists ?? []).map((p) =>
                            p.id === playlistId
                                ? { ...p, tracks: p.tracks.map((t) => t.id === trackId ? { ...t, ...updates } : t) }
                                : p
                        ),
                    })),
                })),

            updateCampaignMap: (campaignId, mapData) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        map: {
                            markers: c.map?.markers || [],
                            path: c.map?.path || [],
                            ...c.map,
                            ...mapData
                        },
                    })),
                })),

            addEncounter: (campaignId, encounter) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        encounters: [...(c.encounters ?? []), encounter],
                    })),
                })),

            removeEncounter: (campaignId, encounterId) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        encounters: (c.encounters ?? []).filter((e) => e.id !== encounterId),
                        activeEncounterId: c.activeEncounterId === encounterId ? undefined : c.activeEncounterId,
                        sessions: c.sessions.map((s) => ({
                            ...s,
                            encounterIds: (s.encounterIds ?? []).filter((id) => id !== encounterId),
                        })),
                    })),
                })),

            updateEncounter: (campaignId, encounterId, updates) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        encounters: (c.encounters ?? []).map((e) =>
                            e.id === encounterId ? { ...e, ...updates } : e
                        ),
                    })),
                })),

            setActiveEncounter: (campaignId, encounterId) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        activeEncounterId: encounterId ?? undefined,
                    })),
                })),

            updateEncounterInstance: (campaignId, encounterId, instanceId, updates) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        encounters: (c.encounters ?? []).map((e) =>
                            e.id === encounterId
                                ? {
                                    ...e,
                                    instances: (e.instances ?? []).map((i) =>
                                        i.instanceId === instanceId ? { ...i, ...updates } : i
                                    ),
                                }
                                : e
                        ),
                    })),
                })),

            addEncounterToSession: (campaignId, sessionId, encounterId) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) =>
                        updateSession(c, sessionId, (s) => {
                            const ids = s.encounterIds ?? []
                            return {
                                ...s,
                                encounterIds: ids.includes(encounterId) ? ids : [...ids, encounterId],
                            }
                        })
                    ),
                })),

            removeEncounterFromSession: (campaignId, sessionId, encounterId) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) =>
                        updateSession(c, sessionId, (s) => ({
                            ...s,
                            encounterIds: (s.encounterIds ?? []).filter((id) => id !== encounterId),
                        }))
                    ),
                })),

            addPlayerScreenImage: (campaignId, image) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        playerScreenImages: [...(c.playerScreenImages ?? []), image],
                    })),
                })),

            removePlayerScreenImage: (campaignId, imageId) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        playerScreenImages: (c.playerScreenImages ?? []).filter((img) => img.id !== imageId),
                    })),
                })),

            setActiveMap: (campaignId, storedId) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        activeMapStoredId: storedId,
                    })),
                })),

            addMapLibraryEntry: (campaignId, entry) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        mapLibrary: [...(c.mapLibrary ?? []), entry],
                    })),
                })),

            removeMapLibraryEntry: (campaignId, entryId) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => {
                        const entry = (c.mapLibrary ?? []).find(e => e.id === entryId)
                        return {
                            ...c,
                            mapLibrary: (c.mapLibrary ?? []).filter(e => e.id !== entryId),
                            activeMapStoredId: c.activeMapStoredId === entry?.storedId ? null : c.activeMapStoredId,
                        }
                    }),
                })),

            setActiveMapRotation: (campaignId, rotation) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        activeMapRotation: rotation,
                    })),
                })),
        }),
        { name: 'dh-campaigns', storage: createJSONStorage(() => electronStorage) }
    )
)
