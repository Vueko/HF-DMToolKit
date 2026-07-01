import { describe, it, expect, beforeEach } from 'vitest'
import { useCardsStore } from './cardsStore'
import type { AdversaryCard, EnvironmentCard } from '../types'

const env = (id: string): EnvironmentCard => ({ id, type: 'environment', title: 'E', tags: [], description: '', category: 'Event' })
const adv = (id: string): AdversaryCard => ({
    id, type: 'adversary', title: 'A', tags: [], description: '',
    difficulty: 10, hp: { max: 5 }, stress: { max: 3 }, thresholds: { minor: 3, severe: 7 },
})

beforeEach(() => useCardsStore.setState({ cards: [] }))

describe('cardsStore', () => {
    it('adds environment and adversary cards', () => {
        useCardsStore.getState().addEnvironmentCard(env('e1'))
        useCardsStore.getState().addAdversaryCard(adv('a1'))
        expect(useCardsStore.getState().cards.map((c) => c.id)).toEqual(['e1', 'a1'])
    })
    it('bulkAddCards appends all', () => {
        useCardsStore.getState().bulkAddCards([env('e1'), adv('a1')])
        expect(useCardsStore.getState().cards).toHaveLength(2)
    })
    it('updateCard and removeCard', () => {
        useCardsStore.getState().addAdversaryCard(adv('a1'))
        useCardsStore.getState().updateCard('a1', { title: 'Boss' })
        expect(useCardsStore.getState().cards[0].title).toBe('Boss')
        useCardsStore.getState().removeCard('a1')
        expect(useCardsStore.getState().cards).toEqual([])
    })
})
