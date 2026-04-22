import type { EnvironmentCard } from '../../types'


const mockCards: EnvironmentCard[] = [
    { id: '1', title: 'Burning Village', description: 'The village is on fire', type: 'location', tags: [] },
    { id: '2', title: 'Heavy Fog', description: 'Visibility is very low', type: 'event', tags: [] },
]

function ActiveCardsWidget() {
    const cards = mockCards

    return (
        <div className="bg-ui-surface rounded-xl p-5 flex flex-col gap-3">

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span>🃏</span>
                    <h3 className="text-ui-text font-display font-semibold">Active Env Cards</h3>
                </div>
                <span className="text-ui-muted text-xs">{cards.length} in play</span>
            </div>

            <div className="flex flex-row gap-3 overflow-x-auto pb-2">
                {cards.length === 0 && (
                    <p className="text-ui-muted text-sm text-center py-4">
                        No active cards.
                    </p>
                )}

                {cards.map((card) => (
                    <div
                        key={card.id}
                        className="bg-card-bg rounded-lg px-5 py-4 border border-card-border flex flex-col gap-2 min-w-64 shrink-0"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-card-text font-semibold text-sm">{card.title}</span>
                            <span className="text-xs bg-card-border text-card-bg px-2 py-0.5 rounded font-medium capitalize">
                                {card.type}
                            </span>
                        </div>
                        <p className="text-card-text text-sm opacity-80 leading-relaxed">
                            {card.description}
                        </p>
                        {card.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-1">
                                {card.tags.map(tag => (
                                    <span key={tag} className="text-xs bg-card-border/30 text-card-text px-2 py-0.5 rounded">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

            </div>

        </div>
    )
}

export default ActiveCardsWidget
