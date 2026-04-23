export interface Scene {
    id: string
    title: string
    status: 'upcoming' | 'active' | 'completed'
    flag: string
    count: number
}

export interface Track {
    id: string
    title: string
    artist: string
    url: string
    mood?: 'calm' | 'tense' | 'epic' | 'mystery' | 'ambient'
}

interface BaseCard {
    id: string
    title: string
    tags: string[]
}

export interface EnvironmentCard extends BaseCard {
    type: 'environment'
    description: string
    category: 'location' | 'event' | 'weather' | 'hazard'
}

export interface AdversaryCard extends BaseCard {
    type: 'adversary'
    description: string
    difficulty: number
    hp: { max: number }
    stress: { max: number }
    thresholds: {
        minor: number
        major: number
        severe: number
    }
}

export type Card = EnvironmentCard | AdversaryCard

export interface SessionCardInstance {
    instanceId: string
    cardId: string
    hpCurrent: number
    stressCurrent: number
}

export interface Session {
    id: string
    name: string
    number: number
    sceneIds: string[]
    cardInstances: SessionCardInstance[]
}

export interface Campaign {
    id: string
    name: string
    scenes: Scene[]
    sessions: Session[]
}

export interface JournalEntry {
    id: string
    title: string
    content: string
    createdAt: string
    tags: string[]
}