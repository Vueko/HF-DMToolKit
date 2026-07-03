import type { Campaign } from '../../types'

export interface PrepStep {
    id: string
    label: string
    done: boolean
    link?: string
    linkLabel?: string
}

export function buildPrepSteps(campaign: Campaign | null, vaultPath: string | null): PrepStep[] {
    const hasSession = (campaign?.sessions.length ?? 0) > 0
    const hasEncounters = (campaign?.encounters?.length ?? 0) > 0
    const hasScenes = campaign?.sessions.some((s) => s.sceneIds.length > 0) ?? false
    return [
        { id: 'campaign', label: 'Campaña creada', done: !!campaign, link: '/campaigns', linkLabel: 'Campaigns' },
        { id: 'session', label: 'Sesión creada', done: hasSession, link: '/campaigns', linkLabel: 'Campaigns' },
        { id: 'vault', label: 'Vault conectado', done: !!vaultPath, link: '/settings', linkLabel: 'Settings' },
        { id: 'encounters', label: 'Encuentros preparados', done: hasEncounters, link: '/encounter', linkLabel: 'Encounter Builder' },
        { id: 'scenes', label: 'Escenas configuradas', done: hasScenes, link: '/scenes', linkLabel: 'Scene Tracker' },
    ]
}
