import { SharedMarkdown } from '../SharedMarkdown'
import { useCampaignStore } from '../../store/campaignStore'
import { useCardsStore } from '../../store/cardsStore'

function ActiveCardsWidget() {
    const { campaigns, currentCampaignId, currentSessionId, removeCardFromSession } = useCampaignStore()
    const { cards } = useCardsStore()

    const currentCampaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const currentSession = currentCampaign?.sessions.find((s) => s.id === currentSessionId) ?? null
    const instances = currentSession?.cardInstances ?? []

    const envInstances = instances.filter((i) => cards.find((c) => c.id === i.cardId)?.type === 'environment')

    if (!currentCampaignId || !currentSessionId) {
        return (
            <div className="bg-ui-surface rounded-xl p-5 flex flex-col gap-3">
                <h3 className="text-ui-text font-display font-semibold">Active Cards</h3>
                <p className="text-ui-muted text-sm text-center py-4">No active session. Go to Campaigns to set one.</p>
            </div>
        )
    }

    return (
        <div className="bg-ui-surface rounded-xl p-5 flex flex-col gap-4">

            <div className="flex items-center justify-between">
                <h3 className="text-ui-text font-display font-semibold">Active Cards</h3>
                <span className="text-ui-muted text-xs">{envInstances.length} environment cards in play</span>
            </div>

            {envInstances.length === 0 ? (
                <p className="text-ui-muted text-sm text-center py-4">No environment cards in this session. Add from the Cards page.</p>
            ) : (
                <div className="overflow-x-auto">
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
                                    <div className="flex gap-2 text-xs uppercase font-bold text-ui-muted">
                                        <span className="bg-ui-surface2 px-2 py-1 rounded">Tier {card.tier || 1}</span>
                                        {card.category && <span className="bg-ui-surface2 px-2 py-1 rounded">{card.category}</span>}
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

        </div>
    )
}

export default ActiveCardsWidget
