import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui'
import { useCampaignStore } from '../../store/campaignStore'
import { useCardsStore } from '../../store/cardsStore'
import { useFearStore } from '../../store/fearStore'
import type { AdversaryCard, EncounterAdjustment, AbilityType } from '../../types'
import { renderBold } from '../../utils/renderBold'

const ROLE_COST: Record<string, number> = {
    Minion: 1, Social: 1, Support: 1,
    Horde: 2, Ranged: 2, Skulk: 2, Standard: 2,
    Leader: 3, Bruiser: 4, Solo: 5,
}

const ADJUSTMENT_DELTAS: Record<EncounterAdjustment, number> = {
    easy_short: -1, two_plus_solos: -2, bonus_damage: -2,
    lower_tier: 1, no_heavy_roles: 1, dangerous_long: 2,
}

// Colors for dark text on parchment background
const ABILITY_STYLES: Record<AbilityType, { icon: string; label: string; text: string; border: string; dot: string }> = {
    action: { icon: '⚔', label: 'Action', text: 'text-orange-700', border: 'border-l-orange-600', dot: 'bg-orange-600' },
    reaction: { icon: '↩', label: 'Reaction', text: 'text-amber-700', border: 'border-l-amber-600', dot: 'bg-amber-600' },
    fear: { icon: '⚡', label: 'Fear Feature', text: 'text-purple-700', border: 'border-l-purple-600', dot: 'bg-purple-600' },
}

function getRoleCost(role?: string) { return ROLE_COST[role ?? ''] ?? 2 }

function EncounterWidget() {
    const { campaigns, currentCampaignId, currentSessionId, updateEncounterInstance, updateEncounter, setActiveEncounter } = useCampaignStore()
    const { cards } = useCardsStore()
    const { fearCount, removeFear } = useFearStore()

    const adversaryCards = useMemo(
        () => cards.filter((c): c is AdversaryCard => c.type === 'adversary'),
        [cards]
    )

    const campaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const encounter = campaign?.encounters?.find((e) => e.id === campaign.activeEncounterId) ?? null
    const instances = encounter?.instances ?? []

    const currentSession = campaign?.sessions.find((s) => s.id === currentSessionId) ?? null
    const sessionEncounterIds = currentSession?.encounterIds ?? []
    const sessionEncounters = (campaign?.encounters ?? []).filter((e) => sessionEncounterIds.includes(e.id))

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

    const cardGroups = useMemo(() => {
        const seen = new Set<string>()
        const groups: { card: AdversaryCard; groupInstances: typeof instances }[] = []
        for (const inst of instances) {
            if (!seen.has(inst.cardId)) {
                const card = adversaryCards.find((c) => c.id === inst.cardId)
                if (card) {
                    seen.add(inst.cardId)
                    groups.push({ card, groupInstances: instances.filter((i) => i.cardId === inst.cardId) })
                }
            }
        }
        return groups
    }, [instances, adversaryCards])

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
            <div className="bg-ui-surface rounded-xl border border-ui-surface2/60 p-4 flex items-center justify-between">
                <div>
                    <p className="text-ui-text text-sm font-semibold">Encounter Tracker</p>
                    <p className="text-ui-muted text-xs">No active encounter — set one in Encounter Builder</p>
                </div>
                <Link to="/encounter" className="px-3 py-1.5 text-xs bg-fear-light hover:bg-fear-secondary text-ui-text rounded-lg transition-colors font-medium">
                    Open Builder
                </Link>
            </div>
        )
    }

    return (
        <div className="bg-ui-surface rounded-xl border border-ui-surface2/60 p-4 flex flex-col gap-3">

            {sessionEncounters.length > 1 && (
                <div className="flex gap-1.5 flex-wrap shrink-0">
                    {sessionEncounters.map((e) => (
                        <button
                            key={e.id}
                            onClick={() => setActiveEncounter(currentCampaignId!, e.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${e.id === campaign!.activeEncounterId
                                    ? 'bg-fear-light text-ui-canvas'
                                    : 'bg-ui-surface2 text-ui-muted hover:text-ui-text'
                                }`}
                        >
                            {e.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Widget header */}
            <div className="flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-fear-light bg-fear-light/10 px-2 py-0.5 rounded shrink-0">Encounter</span>
                    <span className="text-ui-text text-sm font-semibold truncate">{encounter.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-bold ${textColor}`}>{spentPoints}/{totalPoints} pts</span>
                    <Button variant="secondary" size="sm" onClick={resetHP}>Reset HP</Button>
                    <Link to="/encounter" className="text-xs text-ui-muted hover:text-ui-text transition-colors underline">Edit</Link>
                </div>
            </div>

            <div className="h-1 bg-ui-surface2 rounded-full overflow-hidden shrink-0">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
            </div>

            {/* Adversary groups */}
            {instances.length === 0 ? (
                <p className="text-ui-muted text-xs italic">
                    {encounter.entries.length > 0
                        ? <>Open the <Link to="/encounter" className="underline hover:text-ui-text">Encounter Builder</Link> once to activate combat tracking.</>
                        : <>No adversaries yet. Add them in the <Link to="/encounter" className="underline hover:text-ui-text">Encounter Builder</Link>.</>
                    }
                </p>
            ) : (
                <div className="flex flex-row flex-wrap gap-3 items-start">
                    {cardGroups.map(({ card, groupInstances }) => {
                        const hasAbilities = card.abilities && card.abilities.length > 0

                        return (
                            <div key={card.id} className="bg-card-bg rounded-xl border border-card-border overflow-hidden flex-1 min-w-[260px]">

                                {/* ── Card identity ── */}
                                <div className="px-4 pt-3 pb-1 flex flex-col gap-1">
                                    <div>
                                        <h3 className="text-card-text font-display text-base font-black uppercase tracking-wide leading-tight">
                                            {card.title}
                                        </h3>
                                        {(card.tier || card.role) && (
                                            <p className="text-card-text/65 text-xs italic mt-0.5">
                                                {[card.tier ? `Tier ${card.tier}` : null, card.role].filter(Boolean).join(' ')}
                                            </p>
                                        )}
                                    </div>
                                    {card.description && (
                                        <p className="text-card-text/80 text-xs italic leading-snug">{renderBold(card.description)}</p>
                                    )}
                                    {card.motives && (
                                        <p className="text-card-text/85 text-xs leading-snug">
                                            <span className="font-bold">Motives:</span> {renderBold(card.motives)}
                                        </p>
                                    )}
                                    {card.tactics && (
                                        <p className="text-card-text/85 text-xs leading-snug">
                                            <span className="font-bold">Tactics:</span> {renderBold(card.tactics)}
                                        </p>
                                    )}
                                </div>

                                {/* ── Stats box ── */}
                                <div className="mx-4 my-2 border border-card-border/70 rounded-lg px-3 py-2 flex flex-col gap-1.5">
                                    {/* Core numbers row */}
                                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-card-text">
                                        <span><span className="font-bold">Difficulty:</span> {card.difficulty}</span>
                                        <span className="text-card-border/50 select-none">│</span>
                                        <span>
                                            <span className="font-bold">Thresholds:</span>{' '}
                                            <span className="text-green-700 font-semibold">{card.thresholds.minor}</span>
                                            {card.thresholds.major !== undefined && (
                                                <><span className="text-card-text/50">/</span><span className="text-amber-700 font-semibold">{card.thresholds.major}</span></>
                                            )}
                                            <span className="text-card-text/50">/</span>
                                            <span className="text-red-700 font-semibold">{card.thresholds.severe}</span>
                                        </span>
                                        <span className="text-card-border/50 select-none">│</span>
                                        <span><span className="font-bold">HP:</span> {card.hp.max}</span>
                                        <span className="text-card-border/50 select-none">│</span>
                                        <span><span className="font-bold">Stress:</span> {card.stress.max}</span>
                                    </div>
                                    {/* ATK row */}
                                    {(card.attackModifier || card.attackName || card.attackDamage) && (
                                        <div className="flex items-center gap-1.5 flex-wrap text-xs">
                                            <span className="font-black text-red-700 shrink-0">ATK:</span>
                                            {card.attackModifier && <span className="text-card-text font-bold">{card.attackModifier}</span>}
                                            {(card.attackName || card.attackDistance) && (
                                                <>
                                                    {card.attackModifier && <span className="text-card-border/50 select-none">|</span>}
                                                    <span className="text-card-text">{[card.attackName, card.attackDistance].filter(Boolean).join(' · ')}</span>
                                                </>
                                            )}
                                            {card.attackDamage && (
                                                <>
                                                    <span className="text-card-border/50 select-none">|</span>
                                                    <span className="text-card-text font-mono">{card.attackDamage}</span>
                                                    {card.attackDamageType && (
                                                        <span className={`font-semibold ${card.attackDamageType === 'physical' ? 'text-orange-700' : 'text-blue-700'}`}>
                                                            {card.attackDamageType === 'physical' ? 'phys' : 'magic'}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {/* Experience row */}
                                    {card.experience && (
                                        <div className="flex items-start gap-2 text-xs">
                                            <span className="font-bold text-card-text shrink-0">Experience:</span>
                                            <span className="text-card-text/80">{card.experience}</span>
                                        </div>
                                    )}
                                </div>

                                {/* ── Features / Abilities ── */}
                                {hasAbilities && (
                                    <div className="px-4 pb-3">
                                        <p className="text-card-text font-black text-[10px] uppercase tracking-widest mb-2">Features</p>
                                        <div className="flex flex-col gap-2">
                                            {(['action', 'reaction', 'fear'] as AbilityType[]).map((type) => {
                                                const group = card.abilities!.filter((a) => a.type === type)
                                                if (group.length === 0) return null
                                                const s = ABILITY_STYLES[type]
                                                return group.map((ability) => (
                                                    <div key={ability.id} className={`text-xs leading-snug text-card-text pl-2.5 border-l-2 ${s.border} flex items-start justify-between gap-2`}>
                                                        <p className="flex-1">
                                                            <span className={`font-black italic ${s.text}`}>{ability.name}</span>
                                                            {' '}
                                                            <span className={`font-bold italic ${s.text}`}>- {s.label}:</span>
                                                            {' '}
                                                            <span className="text-card-text/85">{renderBold(ability.description)}</span>
                                                        </p>
                                                        {!!ability.fearCost && ability.fearCost > 0 && (
                                                            <button
                                                                onClick={() => removeFear(ability.fearCost!)}
                                                                disabled={fearCount < ability.fearCost}
                                                                title={`Spend ${ability.fearCost} Fear`}
                                                                className={`shrink-0 flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded border transition-colors ${fearCount >= ability.fearCost
                                                                        ? 'text-purple-700 bg-purple-100/60 border-purple-300/60 hover:bg-purple-200/80 cursor-pointer'
                                                                        : 'text-card-text/30 bg-card-border/20 border-card-border/30 cursor-not-allowed'
                                                                    }`}
                                                            >
                                                                💀 {ability.fearCost}
                                                            </button>
                                                        )}
                                                    </div>
                                                ))
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* ── HP / Stress tracker per instance ── */}
                                <div className={`border-t border-card-border/50 divide-y divide-card-border/30 bg-fear-secondary/10 ${hasAbilities ? '' : 'mt-1'}`}>
                                    {groupInstances.map((instance, i) => {
                                        const isDead = instance.hpCurrent >= card.hp.max
                                        const hpPct = Math.min((instance.hpCurrent / card.hp.max) * 100, 100)
                                        const stressPct = Math.min((instance.stressCurrent / card.stress.max) * 100, 100)

                                        function updateHP(delta: number) {
                                            if (!currentCampaignId || !encounter) return
                                            const next = Math.max(0, Math.min(card.hp.max, instance.hpCurrent + delta))
                                            updateEncounterInstance(currentCampaignId, encounter.id, instance.instanceId, { hpCurrent: next })
                                        }
                                        function updateStress(delta: number) {
                                            if (!currentCampaignId || !encounter) return
                                            const next = Math.max(0, Math.min(card.stress.max, instance.stressCurrent + delta))
                                            updateEncounterInstance(currentCampaignId, encounter.id, instance.instanceId, { stressCurrent: next })
                                        }

                                        return (
                                            <div key={instance.instanceId} className={`px-3 py-2.5 flex items-center gap-2 ${isDead ? 'opacity-40' : ''}`}>

                                                {/* Index + status */}
                                                <span className={`text-[10px] font-black w-5 shrink-0 tabular-nums ${isDead ? 'text-red-600' : 'text-card-text/45'}`}>
                                                    {isDead ? '✕' : `#${i + 1}`}
                                                </span>

                                                {/* HP tracker */}
                                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                                    <span className="text-[10px] font-black text-card-text/70 uppercase shrink-0 w-5">HP</span>
                                                    <button
                                                        onClick={() => updateHP(-1)}
                                                        disabled={instance.hpCurrent <= 0}
                                                        className="w-6 h-6 rounded bg-card-border/40 hover:bg-red-300/60 text-card-text text-sm font-bold disabled:opacity-25 transition-colors flex items-center justify-center shrink-0"
                                                    >−</button>
                                                    <div className="flex-1 bg-card-border/30 rounded-full h-3 min-w-0">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${isDead ? 'bg-red-500' : 'bg-hope-primary'}`}
                                                            style={{ width: `${hpPct}%` }}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => updateHP(1)}
                                                        disabled={isDead}
                                                        className="w-6 h-6 rounded bg-card-border/40 hover:bg-hope-primary/40 text-card-text text-sm font-bold disabled:opacity-25 transition-colors flex items-center justify-center shrink-0"
                                                    >+</button>
                                                    <span className="text-xs text-card-text/80 tabular-nums shrink-0 w-9 text-right">{instance.hpCurrent}/{card.hp.max}</span>
                                                </div>

                                                {/* Stress tracker */}
                                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                                    <span className="text-[10px] font-black text-card-text/70 uppercase shrink-0 w-6">STR</span>
                                                    <button
                                                        onClick={() => updateStress(-1)}
                                                        disabled={instance.stressCurrent <= 0}
                                                        className="w-6 h-6 rounded bg-card-border/40 hover:bg-red-300/60 text-card-text text-sm font-bold disabled:opacity-25 transition-colors flex items-center justify-center shrink-0"
                                                    >−</button>
                                                    <div className="flex-1 bg-card-border/30 rounded-full h-3 min-w-0">
                                                        <div
                                                            className="h-full rounded-full bg-fear-light transition-all"
                                                            style={{ width: `${stressPct}%` }}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => updateStress(1)}
                                                        disabled={instance.stressCurrent >= card.stress.max}
                                                        className="w-6 h-6 rounded bg-fear-secondary/20 hover:bg-fear-light/40 text-card-text text-sm font-bold disabled:opacity-25 transition-colors flex items-center justify-center shrink-0"
                                                    >+</button>
                                                    <span className="text-xs text-card-text/80 tabular-nums shrink-0 w-9 text-right">{instance.stressCurrent}/{card.stress.max}</span>
                                                </div>

                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default EncounterWidget
