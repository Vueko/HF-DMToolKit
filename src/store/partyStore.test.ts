import { beforeEach, describe, expect, test } from 'vitest'
import { partyOf, usePartyStore } from './partyStore'
import type { PartyMember } from '../types'

const member = (id: string, over: Partial<PartyMember> = {}): PartyMember => ({
    id,
    name: 'PC',
    hp: { current: 4, max: 6 },
    stress: { current: 1, max: 6 },
    armorSlots: { current: 2, max: 3 },
    evasion: 10,
    thresholds: { major: 8, severe: 15 },
    ...over,
})

beforeEach(() => {
    usePartyStore.setState({ membersByCampaign: {} })
})

describe('partyStore', () => {
    test('partyOf returns a stable empty reference for campaigns with no PCs', () => {
        const state = usePartyStore.getState()

        expect(partyOf(state, 'missing')).toBe(partyOf(state, 'other'))
        expect(partyOf(state, null)).toBe(partyOf(state, undefined))
    })

    test('adds updates and removes PCs by campaign', () => {
        usePartyStore.getState().addMember('c1', member('a'))
        usePartyStore.getState().addMember('c2', member('b'))
        usePartyStore.getState().updateMember('c1', 'a', { name: 'Seren', evasion: 13 })

        expect(partyOf(usePartyStore.getState(), 'c1')[0]).toMatchObject({ id: 'a', name: 'Seren', evasion: 13 })
        expect(partyOf(usePartyStore.getState(), 'c2').map((m) => m.id)).toEqual(['b'])

        usePartyStore.getState().removeMember('c1', 'a')
        expect(partyOf(usePartyStore.getState(), 'c1')).toEqual([])
    })

    test('clamps resource current values to their max and zero', () => {
        usePartyStore.getState().addMember('c1', member('a'))

        usePartyStore.getState().updateMember('c1', 'a', {
            hp: { current: 99, max: 8 },
            stress: { current: -3, max: 5 },
            armorSlots: { current: 9, max: 4 },
        })

        expect(partyOf(usePartyStore.getState(), 'c1')[0]).toMatchObject({
            hp: { current: 8, max: 8 },
            stress: { current: 0, max: 5 },
            armorSlots: { current: 4, max: 4 },
        })
    })
})
