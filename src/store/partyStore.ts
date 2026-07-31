import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { electronStorage } from '../utils/electronStorage'
import { createMigrate } from './persistMigration'
import type { PartyMember, ResourceTrack } from '../types'

export interface PartyState {
    membersByCampaign: Record<string, PartyMember[]>
    addMember: (campaignId: string, member: PartyMember) => void
    updateMember: (campaignId: string, id: string, updates: Partial<PartyMember>) => void
    removeMember: (campaignId: string, id: string) => void
}

const EMPTY_MEMBERS: PartyMember[] = []

function clampTrack(track: ResourceTrack): ResourceTrack {
    const max = Math.max(0, Math.trunc(track.max || 0))
    const current = Math.max(0, Math.min(max, Math.trunc(track.current || 0)))
    return { current, max }
}

function normalizeMember(member: PartyMember): PartyMember {
    return {
        ...member,
        hp: clampTrack(member.hp),
        stress: clampTrack(member.stress),
        armorSlots: clampTrack(member.armorSlots),
        evasion: Math.max(0, Math.trunc(member.evasion || 0)),
        thresholds: {
            major: Math.max(0, Math.trunc(member.thresholds.major || 0)),
            severe: Math.max(0, Math.trunc(member.thresholds.severe || 0)),
        },
    }
}

export function partyOf(
    state: Pick<PartyState, 'membersByCampaign'>,
    campaignId: string | null | undefined,
): PartyMember[] {
    return (campaignId ? state.membersByCampaign[campaignId] : undefined) ?? EMPTY_MEMBERS
}

export const usePartyStore = create<PartyState>()(
    persist(
        (set) => {
            const mutate = (campaignId: string, fn: (members: PartyMember[]) => PartyMember[]) =>
                set((state) => ({
                    membersByCampaign: {
                        ...state.membersByCampaign,
                        [campaignId]: fn(state.membersByCampaign[campaignId] ?? []),
                    },
                }))

            return {
                membersByCampaign: {},
                addMember: (campaignId, member) => mutate(campaignId, (members) => [...members, normalizeMember(member)]),
                updateMember: (campaignId, id, updates) => mutate(campaignId, (members) =>
                    members.map((member) => member.id === id ? normalizeMember({ ...member, ...updates }) : member)),
                removeMember: (campaignId, id) => mutate(campaignId, (members) => members.filter((member) => member.id !== id)),
            }
        },
        { name: 'dh-party', version: 1, migrate: createMigrate<PartyState>(1, {}), storage: createJSONStorage(() => electronStorage) },
    ),
)
