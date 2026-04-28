import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Campaign, Session, Scene, SessionCardInstance, LoreEntry } from '../types'

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

    addLoreEntry: (campaignId: string, entry: LoreEntry) => void
    updateLoreEntry: (campaignId: string, entryId: string, updates: Partial<LoreEntry>) => void
    removeLoreEntry: (campaignId: string, entryId: string) => void

    updateCampaignRules: (campaignId: string, rules: string) => void
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

            addLoreEntry: (campaignId, entry) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        lore: [...(c.lore || []), entry],
                    })),
                })),

            updateLoreEntry: (campaignId, entryId, updates) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        lore: (c.lore || []).map((l) => (l.id === entryId ? { ...l, ...updates } : l)),
                    })),
                })),

            removeLoreEntry: (campaignId, entryId) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        lore: (c.lore || []).filter((l) => l.id !== entryId),
                    })),
                })),

            updateCampaignRules: (campaignId, rules) =>
                set((state) => ({
                    campaigns: updateCampaign(state.campaigns, campaignId, (c) => ({
                        ...c,
                        dmScreenRules: rules,
                    })),
                })),
        }),
        { name: 'dh-campaigns' }
    )
)
