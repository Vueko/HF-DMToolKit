import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import type { Encounter } from '../types'
import { useCampaignStore } from '../store/campaignStore'

export function useLaunchEncounter() {
    const navigate = useNavigate()

    return useCallback((encounter: Encounter, campaignId: string) => {
        useCampaignStore.getState().setActiveEncounter(campaignId, encounter.id)
        navigate('/encounter')
    }, [navigate])
}
