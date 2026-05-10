import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCampaignStore } from '../../store/campaignStore'
import { useCardsStore } from '../../store/cardsStore'
import type { AdversaryCard, EncounterAdjustment } from '../../types'

const ROLE_COST: Record<string, number> = {
    Minion: 1, Social: 1, Support: 1,
    Horde: 2, Ranged: 2, Skulk: 2, Standard: 2,
    Leader: 3, Bruiser: 4, Solo: 5,
}

const ADJUSTMENT_DELTAS: Record<EncounterAdjustment, number> = {
    easy_short: -1, two_plus_solos: -2, bonus_damage: -2,
    lower_tier: 1, no_heavy_roles: 1, dangerous_long: 2,
}

const ACCENT_COLORS = [
    'border-l-hope-primary', 'border-l-hope-secondary',
    'border-l-fear-light', 'border-l-fear-secondary',
]

function getRoleCost(role?: string) { return ROLE_COST[role ?? ''] ?? 2 }

function EncounterWidget() {
    const { campaigns, currentCampaignId, updateEncounterInstance, updateEncounter } = useCampaignStore()
    const { cards } = useCardsStore()

    const adversaryCards = useMemo(
        () => cards.filter((c): c is AdversaryCard => c.type === 'adversary'),
        [cards]
    )

    const campaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const encounter = campaign?.encounters?.find((e) => e.id === campaign.activeEncounterId) ?? null
    const instances = encounter?.instances ?? []

    const totalPoints = useMemo(() => {
        if (!encounter) return 0
        const base = 3 * encounter.pcCount + 2
        const delta = encounter.adjustments.reduce((s, a) => s + (ADJUSTMENT_DELTAS[a] ?? 0), 0)
        return base + delta
    }, [encounter])

    const spentPoints = useMemo(() => {
        if (!encounter) return 0
        return encounter.entries.reduce((sum, entry) => {
            const card = adversaryCards.find((c) => c.id === entry.cardId)
            return sum + getRoleCost(card?.role) * entry.count
        }, 0)
    }, [encounter, adversaryCards])

    const remaining = totalPoints - spentPoints
    const pct = totalPoints > 0 ? Math.min(100, (spentPoints / totalPoints) * 100) : 0
    const barColor = remaining < 0 ? 'bg-red-500' : remaining <= 1 ? 'bg-hope-secondary' : 'bg-green-500'
    const textColor = remaining < 0 ? 'text-red-400' : remaining <= 1 ? 'text-hope-secondary' : 'text-green-400'

    function resetHP() {
        if (!currentCampaignId || !encounter) return
        updateEncounter(currentCampaignId, encounter.id, {
            instances: instances.map((i) => ({ ...i, hpCurrent: 0, stressCurrent: 0 })),
        })
    }

    if (!encounter) {
        return (
            <div className="bg-ui-surface rounded-xl border border-ui-surface2 p-4 flex items-center justify-between">
                <div>
                    <p className="text-ui-text text-sm font-semibold">Encounter Tracker</p>
                    <p className="text-ui-muted text-xs">No active encounter — set one in Encounter Builder</p>
                </div>
                <Link
                    to="/encounter"
                    className="px-3 py-1.5 text-xs bg-fear-light hover:bg-fear-secondary text-ui-text rounded-lg transition-colors font-medium"
                >
                    Open Builder
                </Link>
            </div>
        )
    }

    return (
        <div className="bg-ui-surface rounded-xl border border-ui-surface2 p-4 flex flex-col gap-3">

            {/* Header */}
            <div className="flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-fear-light bg-fear-light/10 px-2 py-0.5 rounded shrink-0">
                        Encounter
                    </span>
                    <span className="text-ui-text text-sm font-semibold truncate">{encounter.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-bold ${textColor}`}>{spentPoints}/{totalPoints} pts</span>
                    <button
                        onClick={resetHP}
                        className="text-xs px-2 py-1 bg-ui-surface2 hover:bg-ui-surface text-ui-muted hover:text-ui-text rounded-lg border border-ui-surface2 transition-colors"
                    >
                        Reset HP
                    </button>
                    <Link to="/encounter" className="text-xs text-ui-muted hover:text-ui-text transition-colors underline">
                        Edit
                    </Link>
                </div>
            </div>

            {/* Points bar */}
            <div className="h-1 bg-ui-surface2 rounded-full overflow-hidden shrink-0">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
            </div>

            {/* Adversary cards */}
            {instances.length === 0 ? (
                <p className="text-ui-muted text-xs italic">
                    {encounter.entries.length > 0
                        ? <>Open the <Link to="/encounter" className="underline hover:text-ui-text">Encounter Builder</Link> once to activate combat tracking.</>
                        : <>No adversaries in this encounter. Add them in the{' '}<Link to="/encounter" className="underline hover:text-ui-text">Encounter Builder</Link>.</>
                    }
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <div className="flex gap-3 pb-1" style={{ width: 'max-content' }}>
                        {instances.map((instance, idx) => {
                            const card = adversaryCards.find((c) => c.id === instance.cardId)
                            if (!card) return null

                            const sameCard = instances.filter((i) => i.cardId === instance.cardId)
                            const label = sameCard.length > 1
                                ? `${card.title} ${sameCard.findIndex((i) => i.instanceId === instance.instanceId) + 1}`
                                : card.title

                            const isDead = instance.hpCurrent >= card.hp.max
                            const accentColor = ACCENT_COLORS[idx % ACCENT_COLORS.length]

                            const hpPct = Math.min((instance.hpCurrent / card.hp.max) * 100, 100)
                            const stressPct = Math.min((instance.stressCurrent / card.stress.max) * 100, 100)

                            function updateHP(delta: number) {
                                if (!currentCampaignId || !encounter) return
                                const next = Math.max(0, Math.min(card!.hp.max, instance.hpCurrent + delta))
                                updateEncounterInstance(currentCampaignId, encounter.id, instance.instanceId, { hpCurrent: next })
                            }
                            function updateStress(delta: number) {
                                if (!currentCampaignId || !encounter) return
                                const next = Math.max(0, Math.min(card!.stress.max, instance.stressCurrent + delta))
                                updateEncounterInstance(currentCampaignId, encounter.id, instance.instanceId, { stressCurrent: next })
                            }

                            return (
                                <div
                                    key={instance.instanceId}
                                    className={`bg-card-bg rounded-lg px-4 py-3 border border-card-border border-l-2 ${accentColor} flex flex-col gap-2.5 w-56 shrink-0 ${isDead ? 'opacity-50' : ''}`}
                                >
                                    {/* Title */}
                                    <div className="flex items-start justify-between gap-1">
                                        <span className="text-card-text text-sm font-bold leading-tight">
                                            {label}
                                            {isDead && <span className="ml-1.5 text-red-500 text-[10px] font-black uppercase">Defeated</span>}
                                        </span>
                                    </div>

                                    {/* Badges */}
                                    <div className="flex gap-1.5 flex-wrap">
                                        {card.tier && (
                                            <span className="text-[10px] font-bold bg-ui-surface2 text-ui-muted px-1.5 py-0.5 rounded uppercase">
                                                T{card.tier}
                                            </span>
                                        )}
                                        {card.role && (
                                            <span className="text-[10px] font-bold bg-ui-surface2 text-ui-muted px-1.5 py-0.5 rounded uppercase">
                                                {card.role}
                                            </span>
                                        )}
                                        <span className="text-[10px] font-bold bg-ui-surface2 text-ui-muted px-1.5 py-0.5 rounded uppercase">
                                            DC {card.difficulty}
                                        </span>
                                    </div>

                                    {/* HP */}
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-card-text text-[10px] font-bold w-10 uppercase">HP</span>
                                            <button onClick={() => updateHP(-1)} disabled={instance.hpCurrent <= 0}
                                                className="w-5 h-5 rounded bg-ui-surface2 hover:bg-red-900/40 text-ui-text text-xs font-bold disabled:opacity-30 transition-colors flex items-center justify-center">−</button>
                                            <div className="flex-1 bg-card-border/30 rounded-full h-1.5 overflow-hidden">
                                                <div className={`h-full rounded-full transition-all ${isDead ? 'bg-red-500' : 'bg-hope-primary'}`} style={{ width: `${hpPct}%` }} />
                                            </div>
                                            <button onClick={() => updateHP(1)} disabled={isDead}
                                                className="w-5 h-5 rounded bg-ui-surface2 hover:bg-hope-primary/40 text-ui-text text-xs font-bold disabled:opacity-30 transition-colors flex items-center justify-center">+</button>
                                            <span className="text-card-text text-[10px] w-8 text-right tabular-nums">{instance.hpCurrent}/{card.hp.max}</span>
                                        </div>

                                        {/* Stress */}
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-card-text text-[10px] font-bold w-10 uppercase">Stress</span>
                                            <button onClick={() => updateStress(-1)} disabled={instance.stressCurrent <= 0}
                                                className="w-5 h-5 rounded bg-ui-surface2 hover:bg-red-900/40 text-ui-text text-xs font-bold disabled:opacity-30 transition-colors flex items-center justify-center">−</button>
                                            <div className="flex-1 bg-card-border/30 rounded-full h-1.5 overflow-hidden">
                                                <div className="h-full rounded-full bg-fear-light transition-all" style={{ width: `${stressPct}%` }} />
                                            </div>
                                            <button onClick={() => updateStress(1)} disabled={instance.stressCurrent >= card.stress.max}
                                                className="w-5 h-5 rounded bg-ui-surface2 hover:bg-fear-light/40 text-ui-text text-xs font-bold disabled:opacity-30 transition-colors flex items-center justify-center">+</button>
                                            <span className="text-card-text text-[10px] w-8 text-right tabular-nums">{instance.stressCurrent}/{card.stress.max}</span>
                                        </div>
                                    </div>

                                    {/* Thresholds */}
                                    <div className="flex gap-1 flex-wrap border-t border-card-border pt-2">
                                        <span className="text-[10px] font-semibold bg-ui-surface2 text-ui-muted px-1.5 py-0.5 rounded">
                                            Minor &lt;{card.thresholds.minor}
                                        </span>
                                        <span className="text-[10px] font-semibold bg-ui-surface2 text-ui-muted px-1.5 py-0.5 rounded">
                                            Major {card.thresholds.minor}–{card.thresholds.severe - 1}
                                        </span>
                                        <span className="text-[10px] font-semibold bg-ui-surface2 text-ui-muted px-1.5 py-0.5 rounded">
                                            Severe {card.thresholds.severe}+
                                        </span>
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

export default EncounterWidget
