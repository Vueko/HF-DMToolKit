import { makeMutate, mutateSession } from '../helpers'
import type { CampaignSlice, CampaignState } from '../types'

export const createCardInstancesSlice: CampaignSlice<Pick<CampaignState,
    'addCardToSession' | 'removeCardFromSession' | 'updateCardInstance'
>> = (set) => {
    const mutate = makeMutate(set)
    return {
        addCardToSession: (campaignId, sessionId, instance) => mutate((s) => mutateSession(s, campaignId, sessionId, (sess) => {
            sess.cardInstances.push(instance)
        })),
        removeCardFromSession: (campaignId, sessionId, instanceId) => mutate((s) => mutateSession(s, campaignId, sessionId, (sess) => {
            sess.cardInstances = sess.cardInstances.filter((i) => i.instanceId !== instanceId)
        })),
        updateCardInstance: (campaignId, sessionId, instanceId, updates) => mutate((s) => mutateSession(s, campaignId, sessionId, (sess) => {
            const inst = sess.cardInstances.find((i) => i.instanceId === instanceId)
            if (inst) Object.assign(inst, updates)
        })),
    }
}
