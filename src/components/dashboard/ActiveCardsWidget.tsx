import { SharedMarkdown } from '../SharedMarkdown'
import { useCampaignStore } from '../../store/campaignStore'
import { useCardsStore } from '../../store/cardsStore'

function ActiveCardsWidget() {
    const { campaigns, currentCampaignId, currentSessionId, updateCardInstance, removeCardFromSession } = useCampaignStore()
    const { cards } = useCardsStore()

    const currentCampaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const currentSession = currentCampaign?.sessions.find((s) => s.id === currentSessionId) ?? null
    const instances = currentSession?.cardInstances ?? []

    const envInstances = instances.filter((i) => cards.find((c) => c.id === i.cardId)?.type === 'environment')
    const adversaryInstances = instances.filter((i) => cards.find((c) => c.id === i.cardId)?.type === 'adversary')

    if (!currentCampaignId || !currentSessionId) {
        return (
            <div className="bg-ui-surface rounded-xl p-5 flex flex-col gap-3">
                <h3 className="text-ui-text font-display font-semibold">Active Cards</h3>
                <p className="text-ui-muted text-sm text-center py-4">No active session. Go to Campaigns to set one.</p>
            </div>
        )
    }

    const hasBoth = envInstances.length > 0 && adversaryInstances.length > 0

    return (
        <div className="bg-ui-surface rounded-xl p-5 flex flex-col gap-4">

            <div className="flex items-center justify-between">
                <h3 className="text-ui-text font-display font-semibold">Active Cards</h3>
                <span className="text-ui-muted text-xs">{instances.length} in play</span>
            </div>

            {instances.length === 0 && (
                <p className="text-ui-muted text-sm text-center py-4">No cards in this session. Add from the Cards page.</p>
            )}

            {instances.length > 0 && (
                <div
                    className="grid gap-4 items-start"
                    style={{
                        gridTemplateColumns: hasBoth ? 'auto 1fr' : '1fr',
                    }}
                >
                    {envInstances.length > 0 && (
                        <div className="overflow-x-auto min-w-0">
                            <div className="flex gap-3 items-start pb-1" style={{ width: 'max-content' }}>
                                {envInstances.map((instance) => {
                                    const card = cards.find((c) => c.id === instance.cardId)
                                    if (!card || card.type !== 'environment') return null
                                    return (
                                        <div key={instance.instanceId} className="bg-card-bg rounded-lg px-4 py-4 border border-card-border flex flex-col gap-2 w-64">
                                            <div className="flex items-center justify-between">
                                                <span className="text-card-text font-semibold text-sm">{card.title}</span>
                                                <button onClick={() => removeCardFromSession(currentCampaignId, currentSessionId, instance.instanceId)} className="text-ui-muted hover:text-red-400 transition-colors text-xs">✕</button>
                                            </div>
                                            <div className="text-card-text text-sm opacity-80 [&_strong]:opacity-100 [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_h1]:font-bold [&_h2]:font-semibold leading-relaxed">
                                                <SharedMarkdown>{card.description || '_No description_'}</SharedMarkdown>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {adversaryInstances.length > 0 && (
                        <div className="flex flex-wrap gap-3 content-start">
                            {adversaryInstances.map((instance) => {
                                const card = cards.find((c) => c.id === instance.cardId)
                                if (!card || card.type !== 'adversary') return null
                                const isDead = instance.hpCurrent >= card.hp.max
                                const sameCardInstances = adversaryInstances.filter(i => i.cardId === instance.cardId)
                                const instanceIndex = sameCardInstances.findIndex(i => i.instanceId === instance.instanceId) + 1
                                const isMultiple = sameCardInstances.length > 1
                                const accentColors = ['border-l-hope-primary', 'border-l-hope-gold', 'border-l-fear-light', 'border-l-fear-secondary']
                                const accentColor = isMultiple ? accentColors[(instanceIndex - 1) % accentColors.length] : ''

                                return (
                                    <div
                                        key={instance.instanceId}
                                        className={`bg-card-bg rounded-lg px-4 py-4 border border-card-border flex flex-col gap-3 border-l-2 ${accentColor || 'border-l-card-border'} ${isDead ? 'opacity-60' : ''}`}
                                        style={{ flex: '1 1 220px' }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-card-text font-semibold text-sm">
                                                {isMultiple ? `${card.title} ${instanceIndex}` : card.title}
                                                {isDead && <span className="ml-2 text-red-400 text-xs">DEFEATED</span>}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs bg-red-900 text-red-200 px-2 py-0.5 rounded font-medium">adversary</span>
                                                <button onClick={() => removeCardFromSession(currentCampaignId, currentSessionId, instance.instanceId)} className="text-ui-muted hover:text-red-400 transition-colors text-xs">✕</button>
                                            </div>
                                        </div>

                                        {card.description && (
                                            <div className="text-card-text text-sm opacity-80 leading-relaxed [&_strong]:opacity-100 [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4">
                                                <SharedMarkdown>{card.description}</SharedMarkdown>
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-card-text text-xs w-12">HP</span>
                                                <button disabled={instance.hpCurrent <= 0} onClick={() => updateCardInstance(currentCampaignId, currentSessionId, instance.instanceId, { hpCurrent: instance.hpCurrent - 1 })} className="w-6 h-6 bg-ui-surface2 hover:bg-ui-surface rounded text-ui-text text-xs disabled:opacity-30 transition-colors">-</button>
                                                <div className="flex-1 bg-ui-bg rounded-full h-1.5 overflow-hidden">
                                                    <div className={`h-1.5 rounded-full transition-all ${isDead ? 'bg-red-600' : 'bg-hope-primary'}`} style={{ width: `${Math.min((instance.hpCurrent / card.hp.max) * 100, 100)}%` }} />
                                                </div>
                                                <button disabled={isDead} onClick={() => updateCardInstance(currentCampaignId, currentSessionId, instance.instanceId, { hpCurrent: instance.hpCurrent + 1 })} className="w-6 h-6 bg-ui-surface2 hover:bg-ui-surface rounded text-ui-text text-xs disabled:opacity-30 transition-colors">+</button>
                                                <span className="text-card-text text-xs w-10 text-right">{instance.hpCurrent}/{card.hp.max}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-card-text text-xs w-12">Stress</span>
                                                <button disabled={instance.stressCurrent <= 0} onClick={() => updateCardInstance(currentCampaignId, currentSessionId, instance.instanceId, { stressCurrent: instance.stressCurrent - 1 })} className="w-6 h-6 bg-ui-surface2 hover:bg-ui-surface rounded text-ui-text text-xs disabled:opacity-30 transition-colors">-</button>
                                                <div className="flex-1 bg-ui-bg rounded-full h-1.5 overflow-hidden">
                                                    <div className="h-1.5 rounded-full bg-fear-light transition-all" style={{ width: `${Math.min((instance.stressCurrent / card.stress.max) * 100, 100)}%` }} />
                                                </div>
                                                <button disabled={instance.stressCurrent >= card.stress.max} onClick={() => updateCardInstance(currentCampaignId, currentSessionId, instance.instanceId, { stressCurrent: instance.stressCurrent + 1 })} className="w-6 h-6 bg-ui-surface2 hover:bg-ui-surface rounded text-ui-text text-xs disabled:opacity-30 transition-colors">+</button>
                                                <span className="text-card-text text-xs w-10 text-right">{instance.stressCurrent}/{card.stress.max}</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-1 text-xs text-card-text opacity-60 pt-1 border-t border-card-border">
                                                <span>Difficulty: {card.difficulty}</span>
                                                <span>Min: {card.thresholds.minor} / Maj: {card.thresholds.major} / Sev: {card.thresholds.severe}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

        </div>
    )
}

export default ActiveCardsWidget
