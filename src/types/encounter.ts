export type EncounterAdjustment =
    | 'easy_short'
    | 'two_plus_solos'
    | 'bonus_damage'
    | 'lower_tier'
    | 'no_heavy_roles'
    | 'dangerous_long'

export interface EncounterEntry {
    cardId: string
    count: number
}

export interface EncounterCardInstance {
    instanceId: string
    cardId: string
    hpCurrent: number
    stressCurrent: number
}

export interface Encounter {
    id: string
    name: string
    pcCount: number
    adjustments: EncounterAdjustment[]
    tier?: 1 | 2 | 3 | 4
    entries: EncounterEntry[]
    instances?: EncounterCardInstance[]
}
