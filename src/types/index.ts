export interface Scene {
    id: string
    title: string
    status: 'upcoming' | 'active' | 'completed'
    flag: string
    count: number
}

export interface Track {
    id: string;
    title: string;
    artist: string
    url: string;
    mood?: 'calm' | 'tense' | 'epic' | 'mystery' | 'ambient'
}

export interface EnvironmentCard {
    id: string;
    title: string;
    description: string;
    type: 'location' | 'encounter' | 'event' | 'npc'
    tags: string[];
}

export interface JournalEntry {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    tags: string[];
}