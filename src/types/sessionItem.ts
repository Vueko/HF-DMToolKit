export type SessionItemKind = 'clue' | 'loot' | 'message' | 'note'

export interface SessionItem {
    id: string
    kind: SessionItemKind
    title: string
    body?: string
    done: boolean
}
