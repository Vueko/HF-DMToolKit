export type SceneFlagType = 'event' | 'fear' | 'time' | 'decision'

export interface Scene {
    id: string
    title: string
    status: 'upcoming' | 'active' | 'completed'
    flag: string
    flagType?: SceneFlagType
    fearThreshold?: number
    count: number
    countMax?: number
    description?: string
}

export interface Track {
    id: string
    title: string
    artist: string
    storedId: string
    duration?: number
    mood?: 'calm' | 'tense' | 'epic' | 'mystery' | 'ambient'
}

export interface Playlist {
    id: string
    name: string
    tracks: Track[]
}

interface BaseCard {
    id: string
    title: string
    tags: string[]
    tier?: 1 | 2 | 3 | 4
}

export interface EnvironmentCard extends BaseCard {
    type: 'environment'
    description: string
    category: 'Exploration' | 'Social' | 'Traversal' | 'Event' | string // fallback for old data
    impulses?: string
    difficulty?: number
    features?: EnvironmentFeature[]
}

export type AbilityType = 'action' | 'reaction' | 'fear'
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

export interface SessionCardInstance {
    instanceId: string
    cardId: string
    hpCurrent: number
    stressCurrent: number
    sceneId?: string
}

export interface Session {
    id: string
    name: string
    number: number
    sceneIds: string[]
    encounterIds: string[]
    cardInstances: SessionCardInstance[]
}

export interface MapPoint {
    x: number
    y: number
}

export interface MapMarker extends MapPoint {
    id: string
    label: string
    loreId?: string
    color?: string
}

export interface FogZone {
    id: string
    x: number   // left edge as % of image width  (0–100)
    y: number   // top edge as % of image height (0–100)
    w: number   // width  as % of image width     (0–100)
    h: number   // height as % of image height    (0–100)
}

export interface PlayerViewport {
    offsetX: number  // pixel offset X (same coordinate system as DM local state)
    offsetY: number  // pixel offset Y
    scale: number    // zoom multiplier; 1.0 = natural image size
}

export interface CampaignMapData {
    image?: string
    markers: MapMarker[]
    path: MapPoint[]
    fogZones?: FogZone[]
    playerViewport?: PlayerViewport
}

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
    entries: EncounterEntry[]
    instances?: EncounterCardInstance[]
}

export interface PlayerScreenImage {
    id: string
    name: string
    storedId: string
}

export interface Campaign {
    id: string
    name: string
    scenes: Scene[]
    sessions: Session[]
    lore: LoreEntry[]
    playlists: Playlist[]
    map?: CampaignMapData
    dmScreenRules?: string
    encounters?: Encounter[]
    activeEncounterId?: string
    playerScreenImages?: PlayerScreenImage[]
    activeMapStoredId?: string | null
}

export type LoreCategory = 'continent' | 'city' | 'faction' | 'npc' | 'character_journal' | 'handout'

export interface LoreEntry {
    id: string
    title: string
    category: LoreCategory

    continentId?: string
    cityId?: string
    factionId?: string
    relatedLocationIds?: string[]

    sceneId?: string
    imageUrl?: string

    publicContent: string
    secretContent: string
    createdAt: string
    tags: string[]
}

export interface Sound {
    id: string
    name: string
    storedId: string
    type: 'oneshot' | 'ambient'
    categoryId: string
    mood?: 'calm' | 'tense' | 'epic' | 'mystery' | 'ambient'
}

export interface SoundCategory {
    id: string
    name: string
    order: number
}