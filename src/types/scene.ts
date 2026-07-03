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
