import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { electronStorage } from '../utils/electronStorage'
import { createMigrate } from './persistMigration'
import type { Card, EnvironmentCard, AdversaryCard } from '../types'

interface CardsState {
    cards: Card[]
    addEnvironmentCard: (card: EnvironmentCard) => void
    addAdversaryCard: (card: AdversaryCard) => void
    bulkAddCards: (newCards: Card[]) => void
    removeCard: (id: string) => void
    updateCard: (id: string, updates: Partial<Card>) => void
}

export const useCardsStore = create<CardsState>()(
    persist(
        (set) => ({
            cards: [],

            addEnvironmentCard: (card) =>
                set((state) => ({ cards: [...state.cards, card] })),

            addAdversaryCard: (card) =>
                set((state) => ({ cards: [...state.cards, card] })),

            bulkAddCards: (newCards) =>
                set((state) => ({ cards: [...state.cards, ...newCards] })),

            removeCard: (id) =>
                set((state) => ({ cards: state.cards.filter((c) => c.id !== id) })),

            updateCard: (id, updates) =>
                set((state) => ({
                    cards: state.cards.map((c) => c.id === id ? { ...c, ...updates } : c) as typeof state.cards,
                })),
        }),
        { name: 'dh-cards', version: 1, migrate: createMigrate<CardsState>(1, {}), storage: createJSONStorage(() => electronStorage) }
    )
)
