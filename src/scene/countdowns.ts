import type { Scene, SceneCountdown } from '../types'

export interface CountdownRollOutcome {
    outcome: 'success' | 'failure'
    tone: 'hope' | 'fear'
    critical?: boolean
}

export function normalizeSceneCountdowns(scene: Scene): SceneCountdown[] {
    if (scene.countdowns && scene.countdowns.length > 0) return scene.countdowns
    const max = scene.countMax ?? 0
    if (max <= 0) return []
    return [{
        id: 'legacy',
        title: 'Clock',
        type: 'standard',
        value: Math.max(0, max - (scene.count ?? 0)),
        max,
    }]
}

export function tickCountdown(countdown: SceneCountdown, amount = 1): SceneCountdown {
    const max = Math.max(0, Math.trunc(countdown.max || 0))
    return {
        ...countdown,
        max,
        value: Math.max(0, Math.min(max, Math.trunc(countdown.value || 0)) - Math.max(0, amount)),
    }
}

export function applyRollOutcomeToCountdowns(
    countdowns: SceneCountdown[],
    outcome: CountdownRollOutcome,
): SceneCountdown[] {
    const progressDelta = outcome.critical ? 3 :
        outcome.outcome === 'success' && outcome.tone === 'hope' ? 2 :
        outcome.outcome === 'success' && outcome.tone === 'fear' ? 1 :
        0
    const consequenceDelta = outcome.critical ? 0 :
        outcome.outcome === 'failure' && outcome.tone === 'fear' ? 3 :
        outcome.outcome === 'failure' && outcome.tone === 'hope' ? 2 :
        outcome.outcome === 'success' && outcome.tone === 'fear' ? 1 :
        0

    return countdowns.map((countdown) => {
        if (countdown.type === 'standard') return tickCountdown(countdown, 1)
        if (countdown.type === 'progress') return tickCountdown(countdown, progressDelta)
        if (countdown.type === 'consequence') return tickCountdown(countdown, consequenceDelta)
        return countdown
    })
}
