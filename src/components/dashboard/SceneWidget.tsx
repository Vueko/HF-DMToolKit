import { useMemo } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import { useFearStore } from '../../store/fearStore'
import type { Scene, SceneFlagType } from '../../types'
import { useT } from '../../i18n'
import { CountdownControls } from '../scenes/CountdownControls'

const FLAG_CONFIG: Record<SceneFlagType, { icon: string; bg: string; border: string; text: string }> = {
    event: { icon: '', bg: 'bg-hope-primary/10', border: 'border-hope-primary/25', text: 'text-hope-primary' },
    fear: { icon: '', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-700' },
    time: { icon: '', bg: 'bg-amber-500/10', border: 'border-amber-400/30', text: 'text-amber-700' },
    decision: { icon: '', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-700' },
}

const STATUS_BADGE: Record<Scene['status'], string> = {
    upcoming: 'bg-ui-surface2 text-ui-muted border border-ui-surface2',
    active: 'bg-hope-primary text-white',
    completed: 'bg-fear-light/20 text-fear-light border border-fear-light/30',
}

const STATUS_LABEL_KEY: Record<Scene['status'], string> = {
    upcoming: 'dashboard.statusNext',
    active: 'dashboard.statusActive',
    completed: 'dashboard.statusDone',
}

const nextStatus: Record<Scene['status'], Scene['status']> = {
    upcoming: 'active',
    active: 'completed',
    completed: 'upcoming',
}

function SceneWidget() {
    const t = useT()
    const {
        campaigns,
        currentCampaignId,
        currentSessionId,
        updateScene,
        addSceneToSession,
        removeSceneFromSession,
    } = useCampaignStore()
    const { fearCount } = useFearStore()

    const currentCampaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const currentSession = currentCampaign?.sessions.find((s) => s.id === currentSessionId) ?? null

    const sessionScenes = useMemo(
        () => currentCampaign?.scenes.filter((s) => currentSession?.sceneIds.includes(s.id)) ?? [],
        [currentCampaign?.scenes, currentSession?.sceneIds]
    )

    const unlinkedScenes = useMemo(
        () => currentCampaign?.scenes.filter((s) => !currentSession?.sceneIds.includes(s.id)) ?? [],
        [currentCampaign?.scenes, currentSession?.sceneIds]
    )

    if (!currentCampaignId || !currentSessionId) {
        return (
            <div className="bg-ui-surface rounded-xl border border-ui-surface2/60 p-5 flex flex-col gap-3">
                <h3 className="text-ui-text font-display font-semibold">{t('dashboard.sceneTracker')}</h3>
                <p className="text-ui-muted text-sm text-center py-4">{t('dashboard.noActiveSessionGoCampaigns')}</p>
            </div>
        )
    }

    function renderFlag(scene: Scene) {
        if (!scene.flag) return null
        const flagType = scene.flagType ?? 'event'
        const cfg = FLAG_CONFIG[flagType]
        const hasThreshold = flagType === 'fear' && (scene.fearThreshold ?? 0) > 0
        const fearPct = hasThreshold ? Math.min(100, (fearCount / scene.fearThreshold!) * 100) : 0
        const fearTriggered = hasThreshold && fearCount >= scene.fearThreshold!

        return (
            <div className={`flex flex-col gap-1.5 ${cfg.bg} ${cfg.border} border rounded-lg px-2.5 py-2`}>
                <div className="flex items-start gap-1.5">
                    <span className={`text-[10px] font-black shrink-0 mt-0.5 ${cfg.text}`}>{cfg.icon}</span>
                    <span className={`text-xs leading-snug ${cfg.text}`}>{scene.flag}</span>
                </div>
                {hasThreshold && (
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                            <span className={`text-[10px] font-bold ${fearTriggered ? 'text-purple-700' : 'text-purple-500/80'}`}>
                                {fearTriggered ? `⚠ ${t('dashboard.triggered')}` : t('dashboard.fearProgress')}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-purple-700">{fearCount} / {scene.fearThreshold}</span>
                        </div>
                        <div className="h-1.5 bg-purple-200/60 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${fearTriggered ? 'bg-purple-700' : 'bg-purple-500'}`}
                                style={{ width: `${fearPct}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="bg-ui-surface rounded-xl border border-ui-surface2/60 p-5 flex flex-col gap-3">

            <div className="flex items-center justify-between">
                <h3 className="text-ui-text font-display font-semibold">{t('dashboard.sceneTracker')}</h3>
                <span className="text-ui-muted text-xs">
                    {t('dashboard.scenesCount', {
                        count: sessionScenes.length,
                        active: sessionScenes.filter((s) => s.status === 'active').length,
                    })}
                </span>
            </div>

            <div className="flex flex-col gap-2">
                {sessionScenes.length === 0 && (
                    <p className="text-ui-muted text-sm text-center py-4">{t('dashboard.noScenesInSession')}</p>
                )}

                {sessionScenes.map((scene) => {
                    const count = scene.count ?? 0
                    const max = scene.countMax ?? 0
                    const hasCountdown = max > 0
                    const isFull = hasCountdown && count >= max

                    return (
                        <div
                            key={scene.id}
                            className={`bg-card-bg rounded-xl border flex flex-col gap-2 p-3 transition-all ${isFull
                                ? 'border-hope-gold/60 shadow-[0_0_0_1px_rgba(var(--color-hope-gold),0.12)]'
                                : 'border-card-border'
                                }`}
                        >
                            {/* Title + status + remove */}
                            <div className="flex items-start justify-between gap-2">
                                <h4 className="text-card-text font-semibold text-sm leading-tight flex-1 min-w-0">{scene.title}</h4>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        onClick={() => updateScene(currentCampaignId, scene.id, { status: nextStatus[scene.status] })}
                                        className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase tracking-wide transition-colors ${STATUS_BADGE[scene.status]}`}
                                    >
                                        {t(STATUS_LABEL_KEY[scene.status])}
                                    </button>
                                    <button
                                        onClick={() => removeSceneFromSession(currentCampaignId, currentSessionId, scene.id)}
                                        className="text-card-text/30 hover:text-red-600 transition-colors text-[11px] font-bold"
                                    >✕</button>
                                </div>
                            </div>

                            {/* Typed flag */}
                            {renderFlag(scene)}

                            {/* Description preview */}
                            {scene.description && (
                                <p className="text-card-text/65 text-xs leading-snug line-clamp-2">
                                    {scene.description.replace(/[#*_`[\]]/g, '').trim()}
                                </p>
                            )}
                            <CountdownControls
                                scene={scene}
                                compact
                                onUpdate={(updates) => updateScene(currentCampaignId, scene.id, updates)}
                            />
                        </div>
                    )
                })}
            </div>

            {unlinkedScenes.length > 0 && (
                <div className="flex flex-col gap-1">
                    <span className="text-ui-muted text-xs">{t('dashboard.addExistingScene')}</span>
                    <div className="flex flex-wrap gap-1">
                        {unlinkedScenes.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => addSceneToSession(currentCampaignId, currentSessionId, s.id)}
                                className="text-xs px-2 py-1 bg-ui-surface2 hover:bg-ui-surface text-ui-muted hover:text-ui-text rounded transition-colors"
                            >
                                + {s.title}
                            </button>
                        ))}
                    </div>
                </div>
            )}

        </div>
    )
}

export default SceneWidget
