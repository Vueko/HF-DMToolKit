import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import { useCardsStore } from '../../store/cardsStore'
import { useFearStore } from '../../store/fearStore'
import type { EnvironmentCard, EnvironmentFeatureType } from '../../types'
import { renderBold } from '../../utils/renderBold'
import { SwordIcon, BoltIcon } from '../icons'
import { useT } from '../../i18n'

const FEATURE_STYLES: Record<EnvironmentFeatureType, { label: string; icon: ReactNode; text: string; border: string }> = {
    action:  { label: 'Action',       icon: <SwordIcon className="w-3 h-3" />, text: 'text-orange-700', border: 'border-l-orange-600' },
    passive: { label: 'Passive',      icon: '◈', text: 'text-blue-700',   border: 'border-l-blue-600'   },
    fear:    { label: 'Fear Feature', icon: <BoltIcon className="w-3 h-3" />, text: 'text-purple-700', border: 'border-l-purple-600' },
}

function ActiveCardsWidget() {
    const t = useT()
    const { campaigns, currentCampaignId, currentSessionId, removeCardFromSession } = useCampaignStore()
    const { cards } = useCardsStore()
    const { fearCount, removeFear } = useFearStore()

    const currentCampaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const currentSession = currentCampaign?.sessions.find((s) => s.id === currentSessionId) ?? null
    const instances = useMemo(
        () => currentSession?.cardInstances ?? [],
        [currentSession]
    )

    const envInstances = useMemo(
        () => instances.filter((i) => cards.find((c) => c.id === i.cardId)?.type === 'environment'),
        [instances, cards]
    )

    if (!currentCampaignId || !currentSessionId) {
        return (
            <div className="bg-ui-surface rounded-xl border border-ui-surface2/60 p-5 flex flex-col gap-3">
                <h3 className="text-ui-text font-display font-semibold">{t('dashboard.activeCards')}</h3>
                <p className="text-ui-muted text-sm text-center py-4">{t('dashboard.noActiveSessionGoCampaigns')}</p>
            </div>
        )
    }

    return (
        <div className="bg-ui-surface rounded-xl border border-ui-surface2/60 p-5 flex flex-col gap-4">

            <div className="flex items-center justify-between">
                <h3 className="text-ui-text font-display font-semibold">{t('dashboard.activeCards')}</h3>
                <span className="text-ui-muted text-xs">{t(envInstances.length === 1 ? 'dashboard.envCardsInPlayOne' : 'dashboard.envCardsInPlayOther', { count: envInstances.length })}</span>
            </div>

            {envInstances.length === 0 ? (
                <p className="text-ui-muted text-sm text-center py-4">{t('dashboard.noEnvCards')}</p>
            ) : (
                <div className="flex flex-row flex-wrap gap-3 items-start">
                    {envInstances.map((instance) => {
                        const card = cards.find((c) => c.id === instance.cardId)
                        if (!card || card.type !== 'environment') return null
                        const envCard = card as EnvironmentCard
                        const hasFeatures = (envCard.features?.length ?? 0) > 0

                        return (
                            <div key={instance.instanceId} className="bg-card-bg rounded-xl border border-card-border overflow-hidden flex-1 min-w-[260px]">

                                {/* Card identity */}
                                <div className="px-4 pt-3 pb-1 flex flex-col gap-1">
                                    <h3 className="text-card-text font-display text-base font-black uppercase tracking-wide leading-tight">
                                        {envCard.title}
                                    </h3>
                                    <p className="text-card-text/65 text-[11px] italic">
                                        {[envCard.tier ? `Tier ${envCard.tier}` : null, envCard.category].filter(Boolean).join(' · ')}
                                    </p>
                                    {envCard.description && (
                                        <p className="text-card-text/80 text-[11px] italic leading-snug">{renderBold(envCard.description)}</p>
                                    )}
                                    {envCard.impulses && (
                                        <p className="text-card-text/85 text-[11px] leading-snug">
                                            <span className="font-bold">Impulses:</span> {envCard.impulses}
                                        </p>
                                    )}
                                </div>

                                {/* Stats box */}
                                {envCard.difficulty !== undefined && (
                                    <div className="mx-4 my-2 border border-card-border/70 rounded-lg px-3 py-2">
                                        <p className="text-[11px] text-card-text">
                                            <span className="font-bold">Difficulty:</span> {envCard.difficulty}
                                        </p>
                                    </div>
                                )}

                                {/* Features */}
                                {hasFeatures && (
                                    <div className="px-4 pb-3">
                                        <p className="text-card-text font-black text-[10px] uppercase tracking-widest mb-2">{t('dashboard.features')}</p>
                                        <div className="flex flex-col gap-2">
                                            {(['action', 'passive', 'fear'] as EnvironmentFeatureType[]).map((type) => {
                                                const group = (envCard.features ?? []).filter((f) => f.type === type)
                                                if (group.length === 0) return null
                                                const s = FEATURE_STYLES[type]
                                                return group.map((feature) => (
                                                    <div key={feature.id} className={`text-[11px] leading-snug text-card-text pl-2.5 border-l-2 ${s.border} flex items-start justify-between gap-2`}>
                                                        <p className="flex-1">
                                                            <span className={`font-black italic ${s.text}`}>{feature.name}</span>
                                                            {' — '}
                                                            <span className={`font-bold italic ${s.text}`}>{s.icon} {s.label}:</span>
                                                            {' '}
                                                            <span className="text-card-text/85">{renderBold(feature.description)}</span>
                                                        </p>
                                                        {!!feature.fearCost && feature.fearCost > 0 && (
                                                            <button
                                                                onClick={() => removeFear(feature.fearCost!)}
                                                                disabled={fearCount < feature.fearCost}
                                                                title={t('dashboard.spendFear', { cost: feature.fearCost })}
                                                                className={`shrink-0 flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded border transition-colors ${
                                                                    fearCount >= feature.fearCost
                                                                        ? 'text-purple-700 bg-purple-100/60 border-purple-300/60 hover:bg-purple-200/80 cursor-pointer'
                                                                        : 'text-card-text/30 bg-card-border/20 border-card-border/30 cursor-not-allowed'
                                                                }`}
                                                            >
                                                                💀 {feature.fearCost}
                                                            </button>
                                                        )}
                                                    </div>
                                                ))
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Remove button */}
                                <div className="border-t border-card-border/50 px-3 py-1.5 flex justify-end">
                                    <button
                                        onClick={() => removeCardFromSession(currentCampaignId, currentSessionId, instance.instanceId)}
                                        className="text-[10px] text-card-text/40 hover:text-red-600 transition-colors font-semibold uppercase tracking-wide"
                                    >
                                        {t('dashboard.remove')}
                                    </button>
                                </div>

                            </div>
                        )
                    })}
                </div>
            )}

        </div>
    )
}

export default ActiveCardsWidget
