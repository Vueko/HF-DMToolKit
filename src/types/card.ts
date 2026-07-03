interface BaseCard {
    id: string
    title: string
    tags: string[]
    tier?: 1 | 2 | 3 | 4
}

export type AbilityType = 'action' | 'reaction' | 'fear' | 'passive'
export type EnvironmentFeatureType = 'action' | 'passive' | 'fear'

export interface AdversaryAbility {
    id: string
    type: AbilityType
    name: string
    description: string
    fearCost?: number
}

export interface EnvironmentFeature {
    id: string
    type: EnvironmentFeatureType
    name: string
    description: string
    fearCost?: number
}

export interface EnvironmentCard extends BaseCard {
    type: 'environment'
    description: string
    category: 'Exploration' | 'Social' | 'Traversal' | 'Event' | string // fallback for old data
    impulses?: string
    difficulty?: number
    features?: EnvironmentFeature[]
}

export interface AdversaryCard extends BaseCard {
    type: 'adversary'
    description: string
    motives?: string
    tactics?: string
    attackModifier?: string
    attackName?: string
    attackDistance?: string
    attackDamage?: string
    attackDamageType?: 'physical' | 'magical'
    experience?: string
    abilities?: AdversaryAbility[]
    difficulty: number
    role?: 'Bruiser' | 'Horde' | 'Leader' | 'Minion' | 'Ranged' | 'Skulk' | 'Social' | 'Solo' | 'Standard' | 'Support' | string
    hp: { max: number }
    stress: { max: number }
    thresholds: {
        minor: number
        major?: number
        severe: number
    }
}

export type Card = EnvironmentCard | AdversaryCard
