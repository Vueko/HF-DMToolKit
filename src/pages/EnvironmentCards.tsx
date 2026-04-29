import { useState } from 'react'
import { useCardsStore } from '../store/cardsStore'
import { useCampaignStore } from '../store/campaignStore'
import ReactMarkdown from 'react-markdown'
import type { SessionCardInstance } from '../types'

type Tab = 'environment' | 'adversary'

function EnvironmentCards() {
    const { cards, addEnvironmentCard, addAdversaryCard, removeCard, updateCard } = useCardsStore()
    const { campaigns, currentCampaignId, currentSessionId, addCardToSession, removeCardFromSession } = useCampaignStore()

    const [activeTab, setActiveTab] = useState<Tab>('environment')
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const filteredCards = cards.filter((c) => c.type === activeTab)

    const currentCampaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const currentSession = currentCampaign?.sessions.find((s) => s.id === currentSessionId) ?? null
    const hasActiveSession = !!currentCampaignId && !!currentSessionId

    function instanceCount(cardId: string): number {
        return currentSession?.cardInstances.filter((i) => i.cardId === cardId).length ?? 0
    }

    function isInSession(cardId: string): boolean {
        return instanceCount(cardId) > 0
    }

    function handleAddToSession(cardId: string, type: 'environment' | 'adversary') {
        if (!currentCampaignId || !currentSessionId) return
        const card = cards.find((c) => c.id === cardId)
        if (!card || card.type !== type) return

        const instance: SessionCardInstance = {
            instanceId: crypto.randomUUID(),
            cardId,
            hpCurrent: 0,
            stressCurrent: 0,
        }
        addCardToSession(currentCampaignId, currentSessionId, instance)
    }

    function handleRemoveFromSession(cardId: string) {
        if (!currentCampaignId || !currentSessionId) return
        const instance = currentSession?.cardInstances.find((i) => i.cardId === cardId)
        if (!instance) return
        removeCardFromSession(currentCampaignId, currentSessionId, instance.instanceId)
    }

    function handleAddEnvCard() {
        const newCard = {
            id: crypto.randomUUID(),
            type: 'environment' as const,
            title: 'New Environment',
            description: '',
            category: 'Exploration',
            tier: 1 as const,
            tags: [],
        }
        addEnvironmentCard(newCard)
        setExpandedId(newCard.id)
    }

    function handleAddAdversary() {
        const newCard = {
            id: crypto.randomUUID(),
            type: 'adversary' as const,
            title: 'New Adversary',
            description: '',
            difficulty: 10,
            tier: 1 as const,
            role: 'Standard',
            tags: [],
            hp: { max: 10 },
            stress: { max: 5 },
            thresholds: { minor: 5, severe: 15 },
        }
        addAdversaryCard(newCard)
        setExpandedId(newCard.id)
    }

    return (
        <div className="flex flex-col gap-6">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-ui-text font-display text-2xl font-bold">Cards</h1>
                    <p className="text-ui-muted text-sm">Manage your environment and adversary cards</p>
                </div>
                {!hasActiveSession && (
                    <span className="text-ui-muted text-xs px-3 py-2 bg-ui-surface rounded-lg">
                        No active session — cards cannot be added to the Dashboard
                    </span>
                )}
            </div>

            <div className="flex gap-2 border-b border-ui-surface2">
                {(['environment', 'adversary'] as Tab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                            activeTab === tab
                                ? 'bg-ui-surface text-ui-text border-b-2 border-fear-light'
                                : 'text-ui-muted hover:text-ui-text'
                        }`}
                    >
                        {tab === 'environment' ? 'Environment' : 'Adversary'}
                    </button>
                ))}
            </div>

            <button
                onClick={activeTab === 'environment' ? handleAddEnvCard : handleAddAdversary}
                className="self-start px-4 py-2 bg-fear-light hover:bg-fear-secondary text-ui-text text-sm rounded-lg transition-colors"
            >
                + Add {activeTab === 'environment' ? 'Environment Card' : 'Adversary'}
            </button>

            <div className="flex flex-col gap-3">
                {filteredCards.length === 0 && (
                    <p className="text-ui-muted text-sm text-center py-8">No {activeTab} cards yet.</p>
                )}

                {filteredCards.map((card) => {
                    const isExpanded = expandedId === card.id
                    const inSession = isInSession(card.id)

                    return (
                        <div key={card.id} className="bg-ui-surface rounded-xl p-4 flex flex-col gap-3">

                            <div className="flex items-center justify-between gap-3">
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : card.id)}
                                    className="text-ui-text font-medium text-left flex-1 hover:text-hope-yellow transition-colors"
                                >
                                    {isExpanded ? '▾' : '▸'} {card.title}
                                </button>
                                <div className="flex items-center gap-2">
                                    {hasActiveSession && card.type === 'environment' && (
                                        <button
                                            onClick={() => inSession
                                                ? handleRemoveFromSession(card.id)
                                                : handleAddToSession(card.id, card.type)
                                            }
                                            className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                                                inSession
                                                    ? 'bg-hope-primary text-white'
                                                    : 'bg-ui-surface2 text-ui-muted hover:text-ui-text'
                                            }`}
                                        >
                                            {inSession ? 'In Session' : '+ Add to Session'}
                                        </button>
                                    )}
                                    {hasActiveSession && card.type === 'adversary' && (
                                        <div className="flex items-center gap-1">
                                            {instanceCount(card.id) > 0 && (
                                                <>
                                                    <span className="text-xs text-ui-muted">{instanceCount(card.id)}x</span>
                                                    <button
                                                        onClick={() => handleRemoveFromSession(card.id)}
                                                        className="w-6 h-6 bg-ui-surface2 hover:bg-red-900 text-ui-muted hover:text-red-200 rounded text-xs transition-colors"
                                                    >
                                                        -
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleAddToSession(card.id, card.type)}
                                                className="text-xs px-2 py-1 bg-ui-surface2 hover:bg-fear-light text-ui-muted hover:text-ui-text rounded-lg transition-colors"
                                            >
                                                + Add
                                            </button>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => removeCard(card.id)}
                                        className="text-ui-muted hover:text-red-400 transition-colors text-xs"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {!isExpanded && card.type === 'environment' && (
                                <>
                                    <div className="flex gap-2 text-xs uppercase font-bold text-ui-muted mb-2">
                                        <span className="bg-ui-surface2 px-2 py-1 rounded">Tier {card.tier || 1}</span>
                                        {card.category && <span className="bg-ui-surface2 px-2 py-1 rounded">{card.category}</span>}
                                    </div>
                                    {card.description && (
                                        <div className="text-ui-muted text-sm [&_strong]:text-ui-text [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_h1]:text-ui-text [&_h1]:font-bold [&_h2]:text-ui-text [&_h2]:font-semibold">
                                            <ReactMarkdown>{card.description}</ReactMarkdown>
                                        </div>
                                    )}
                                </>
                            )}

                            {!isExpanded && card.type === 'adversary' && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2 text-xs uppercase font-bold text-ui-muted">
                                        <span className="bg-ui-surface2 px-2 py-1 rounded">Tier {card.tier || 1}</span>
                                        {card.role && <span className="bg-ui-surface2 px-2 py-1 rounded">{card.role}</span>}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs text-ui-muted">
                                        <span>Difficulty: {card.difficulty}</span>
                                        <span>HP Max: {card.hp.max}</span>
                                        <span>Stress Max: {card.stress.max}</span>
                                        <span>Minor: &lt;{card.thresholds.minor}</span>
                                        <span>Major: {card.thresholds.minor}-{card.thresholds.severe - 1}</span>
                                        <span>Severe: {card.thresholds.severe}+</span>
                                    </div>
                                </div>
                            )}

                            {isExpanded && (
                                <div className="flex flex-col gap-4 border-t border-ui-surface2 pt-3">

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="flex flex-col gap-1 md:col-span-1">
                                            <label className="text-ui-muted text-xs">Title</label>
                                            <input
                                                type="text"
                                                value={card.title}
                                                onChange={(e) => updateCard(card.id, { title: e.target.value })}
                                                className="bg-ui-surface2 text-ui-text text-sm px-3 py-2 rounded-lg outline-none border border-ui-surface2 focus:border-fear-light"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-ui-muted text-xs">Tier</label>
                                            <select
                                                value={card.tier || 1}
                                                onChange={(e) => updateCard(card.id, { tier: +e.target.value as 1|2|3|4 })}
                                                className="bg-ui-surface2 text-ui-text text-sm px-3 py-2 rounded-lg outline-none border border-ui-surface2 focus:border-fear-light"
                                            >
                                                <option value={1}>Tier 1</option>
                                                <option value={2}>Tier 2</option>
                                                <option value={3}>Tier 3</option>
                                                <option value={4}>Tier 4</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-ui-muted text-xs">Type</label>
                                            {card.type === 'environment' ? (
                                                <select
                                                    value={card.category || 'Exploration'}
                                                    onChange={(e) => updateCard(card.id, { category: e.target.value })}
                                                    className="bg-ui-surface2 text-ui-text text-sm px-3 py-2 rounded-lg outline-none border border-ui-surface2 focus:border-fear-light"
                                                >
                                                    <option value="Exploration">Exploration</option>
                                                    <option value="Social">Social</option>
                                                    <option value="Traversal">Traversal</option>
                                                    <option value="Event">Event</option>
                                                </select>
                                            ) : (
                                                <select
                                                    value={card.role || 'Standard'}
                                                    onChange={(e) => updateCard(card.id, { role: e.target.value })}
                                                    className="bg-ui-surface2 text-ui-text text-sm px-3 py-2 rounded-lg outline-none border border-ui-surface2 focus:border-fear-light"
                                                >
                                                    <option value="Bruiser">Bruiser</option>
                                                    <option value="Horde">Horde</option>
                                                    <option value="Leader">Leader</option>
                                                    <option value="Minion">Minion</option>
                                                    <option value="Ranged">Ranged</option>
                                                    <option value="Skulk">Skulk</option>
                                                    <option value="Social">Social</option>
                                                    <option value="Solo">Solo</option>
                                                    <option value="Standard">Standard</option>
                                                    <option value="Support">Support</option>
                                                </select>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-ui-muted text-xs">
                                            {card.type === 'adversary' ? 'Abilities & Description' : 'Description (Markdown)'}
                                        </label>
                                        <textarea
                                            value={card.description}
                                            onChange={(e) => updateCard(card.id, { description: e.target.value })}
                                            rows={4}
                                            className="bg-ui-surface2 text-ui-text text-sm px-3 py-2 rounded-lg outline-none border border-ui-surface2 focus:border-fear-light resize-none font-mono"
                                        />
                                        {card.type === 'environment' && card.description && (
                                            <div className="mt-2 p-3 bg-ui-bg rounded-lg text-ui-muted text-sm [&_strong]:text-ui-text [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_h1]:text-ui-text [&_h1]:font-bold [&_h2]:text-ui-text [&_h2]:font-semibold">
                                                <ReactMarkdown>{card.description}</ReactMarkdown>
                                            </div>
                                        )}
                                    </div>

                                    {card.type === 'adversary' && (
                                        <>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-ui-muted text-xs">Difficulty</label>
                                                    <input
                                                        type="number"
                                                        value={card.difficulty}
                                                        onChange={(e) => updateCard(card.id, { difficulty: +e.target.value })}
                                                        className="bg-ui-surface2 text-ui-text text-sm px-3 py-2 rounded-lg outline-none border border-ui-surface2 focus:border-fear-light"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-ui-muted text-xs">HP Max</label>
                                                    <input
                                                        type="number"
                                                        value={card.hp.max}
                                                        onChange={(e) => updateCard(card.id, { hp: { max: +e.target.value } })}
                                                        className="bg-ui-surface2 text-ui-text text-sm px-3 py-2 rounded-lg outline-none border border-ui-surface2 focus:border-fear-light"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-ui-muted text-xs">Stress Max</label>
                                                    <input
                                                        type="number"
                                                        value={card.stress.max}
                                                        onChange={(e) => updateCard(card.id, { stress: { max: +e.target.value } })}
                                                        className="bg-ui-surface2 text-ui-text text-sm px-3 py-2 rounded-lg outline-none border border-ui-surface2 focus:border-fear-light"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-ui-muted text-xs">Minor Threshold (&lt;X)</label>
                                                    <input
                                                        type="number"
                                                        value={card.thresholds.minor}
                                                        onChange={(e) => updateCard(card.id, { thresholds: { ...card.thresholds, minor: +e.target.value } })}
                                                        className="bg-ui-surface2 text-ui-text text-sm px-3 py-2 rounded-lg outline-none border border-ui-surface2 focus:border-fear-light"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-ui-muted text-xs">Severe Threshold (X+)</label>
                                                    <input
                                                        type="number"
                                                        value={card.thresholds.severe}
                                                        onChange={(e) => updateCard(card.id, { thresholds: { ...card.thresholds, severe: +e.target.value } })}
                                                        className="bg-ui-surface2 text-ui-text text-sm px-3 py-2 rounded-lg outline-none border border-ui-surface2 focus:border-fear-light"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default EnvironmentCards
