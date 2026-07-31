import { describe, expect, it } from 'vitest'
import type { SessionItem } from '../../types'
import { groupSessionItems } from './groupSessionItems'

const item = (id: string, kind: SessionItem['kind'], title: string): SessionItem => ({
    id,
    kind,
    title,
    done: false,
})

describe('groupSessionItems', () => {
    it('groups session items by kind while preserving order within each group', () => {
        const grouped = groupSessionItems([
            item('c1', 'clue', 'Rune names the traitor'),
            item('l1', 'loot', 'Moon key'),
            item('c2', 'clue', 'Ash on the sill'),
            item('m1', 'message', 'The door whispers back'),
            item('n1', 'note', 'Ask who holds the lantern'),
        ])

        expect(grouped.clues.map((i) => i.title)).toEqual(['Rune names the traitor', 'Ash on the sill'])
        expect(grouped.loot.map((i) => i.title)).toEqual(['Moon key'])
        expect(grouped.messages.map((i) => i.title)).toEqual(['The door whispers back'])
        expect(grouped.notes.map((i) => i.title)).toEqual(['Ask who holds the lantern'])
    })
})
