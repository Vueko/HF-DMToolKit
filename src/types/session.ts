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
