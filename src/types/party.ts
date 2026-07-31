export interface ResourceTrack {
    current: number
    max: number
}

export interface PartyMember {
    id: string
    name: string
    playerName?: string
    hp: ResourceTrack
    stress: ResourceTrack
    armorSlots: ResourceTrack
    evasion: number
    thresholds: {
        major: number
        severe: number
    }
    notes?: string
}
