import { makeMutate, mutateCampaign } from '../helpers'
import type { CampaignSlice, CampaignState } from '../types'
import { applyRollOutcomeToCountdowns, normalizeSceneCountdowns } from '../../../scene/countdowns'

export const createScenesSlice: CampaignSlice<Pick<CampaignState,
    'addScene' | 'updateScene' | 'updateSceneCountdown' | 'applyRollOutcomeToActiveScenes' | 'removeScene'
>> = (set) => {
    const mutate = makeMutate(set)
    return {
        addScene: (campaignId, scene) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            c.scenes.push(scene)
        })),
        updateScene: (campaignId, sceneId, updates) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            const sc = c.scenes.find((x) => x.id === sceneId)
            if (sc) Object.assign(sc, updates)
        })),
        updateSceneCountdown: (campaignId, sceneId, countdownId, updates) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            const sc = c.scenes.find((x) => x.id === sceneId)
            if (!sc?.countdowns) return
            sc.countdowns = sc.countdowns.map((countdown) => countdown.id === countdownId ? { ...countdown, ...updates } : countdown)
        })),
        applyRollOutcomeToActiveScenes: (campaignId, outcome) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            c.scenes.forEach((sc) => {
                if (sc.status !== 'active') return
                sc.countdowns = applyRollOutcomeToCountdowns(normalizeSceneCountdowns(sc), outcome)
                if (sc.countMax && sc.countdowns.length === 1 && sc.countdowns[0].id === 'legacy') {
                    sc.count = Math.max(0, sc.countMax - sc.countdowns[0].value)
                    sc.countdowns = undefined
                }
            })
        })),
        removeScene: (campaignId, sceneId) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            c.scenes = c.scenes.filter((sc) => sc.id !== sceneId)
            c.sessions.forEach((sess) => {
                sess.sceneIds = sess.sceneIds.filter((id) => id !== sceneId)
            })
        })),
    }
}
