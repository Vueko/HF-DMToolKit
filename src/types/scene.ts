export type SceneFlagType = 'event' | 'fear' | 'time' | 'decision'
export type SceneCountdownType = 'standard' | 'progress' | 'consequence' | 'loop' | 'long-term'

export interface SceneCountdown {
    id: string
    title: string
    type: SceneCountdownType
    value: number
    max: number
}

export interface Scene {
    id: string
    title: string
    status: 'upcoming' | 'active' | 'completed'
    flag: string
    flagType?: SceneFlagType
    fearThreshold?: number
    count: number
    countMax?: number
    countdowns?: SceneCountdown[]
    description?: string
    readAloud?: string
    encounterId?: string
}
