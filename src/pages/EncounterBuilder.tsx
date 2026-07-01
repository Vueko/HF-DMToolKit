import { useState, useMemo } from 'react'
import { useCampaignStore } from '../store/campaignStore'
import { useCardsStore } from '../store/cardsStore'
import type { AbilityType, AdversaryCard, Encounter, EncounterAdjustment, EncounterCardInstance, EncounterEntry } from '../types'
import { Button, Input, Select } from '../components/ui'
import { renderBold } from '../utils/renderBold'
import {
    ADJUSTMENT_DELTAS, MANUAL_ADJUSTMENTS, AUTO_ADJUSTMENTS,
    computeAutoAdjustments, activeAdjustments, calcBattlePoints,
    soloCount, lowerTierCount,
} from '../utils/encounterBudget'


const ROLE_COST: Record<string, number> = {
    Minion: 1, Social: 1, Support: 1,
    Horde: 2, Ranged: 2, Skulk: 2, Standard: 2,
    Leader: 3, Bruiser: 4, Solo: 5,
}

const ROLE_COLORS: Record<string, string> = {
    Minion:   'bg-gray-500/20 text-gray-300 border-gray-500/40',
    Social:   'bg-blue-500/20 text-blue-300 border-blue-500/40',
    Support:  'bg-green-500/20 text-green-300 border-green-500/40',
    Horde:    'bg-orange-500/20 text-orange-300 border-orange-500/40',
    Ranged:   'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    Skulk:    'bg-purple-500/20 text-purple-300 border-purple-500/40',
    Standard: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    Leader:   'bg-amber-500/20 text-amber-300 border-amber-500/40',
    Bruiser:  'bg-red-500/20 text-red-300 border-red-500/40',
    Solo:     'bg-pink-500/20 text-pink-300 border-pink-500/40',
}

const ROLE_COLORS_CARD: Record<string, string> = {
    Minion:   'bg-gray-100/60 text-gray-600 border-gray-400/60',
    Social:   'bg-blue-100/60 text-blue-700 border-blue-400/60',
    Support:  'bg-green-100/60 text-green-700 border-green-400/60',
    Horde:    'bg-orange-100/60 text-orange-700 border-orange-400/60',
    Ranged:   'bg-cyan-100/60 text-cyan-700 border-cyan-400/60',
    Skulk:    'bg-purple-100/60 text-purple-700 border-purple-400/60',
    Standard: 'bg-amber-100/60 text-amber-700 border-amber-400/60',
    Leader:   'bg-amber-200/60 text-amber-800 border-amber-500/60',
    Bruiser:  'bg-red-100/60 text-red-700 border-red-400/60',
    Solo:     'bg-pink-100/60 text-pink-700 border-pink-400/60',
}

const ABILITY_CARD_STYLES: Record<AbilityType, { label: string; icon: string; text: string; border: string }> = {
    action:   { label: 'Action',       icon: '⚔', text: 'text-orange-700', border: 'border-l-orange-600' },
    reaction: { label: 'Reaction',     icon: '↩', text: 'text-amber-700',  border: 'border-l-amber-600'  },
    fear:     { label: 'Fear Feature', icon: '⚡', text: 'text-purple-700', border: 'border-l-purple-600' },
    passive:  { label: 'Passive',      icon: '◈', text: 'text-blue-700',   border: 'border-l-blue-600'   },
}

const ADJUSTMENT_META: { key: EncounterAdjustment; label: string; hint: string }[] = [
    { key: 'easy_short',     label: 'Easy / Short fight',          hint: 'Fight should be less difficult or shorter' },
    { key: 'two_plus_solos', label: '2+ Solo adversaries',         hint: 'Using two or more Solo adversaries' },
    { key: 'bonus_damage',   label: 'Bonus damage (+1d4 / +2)',     hint: 'Adding +1d4 or +2 to any adversary damage roll' },
    { key: 'lower_tier',     label: 'Lower-tier adversary',         hint: 'Selecting an adversary from a lower tier' },
    { key: 'no_heavy_roles', label: 'No Bruiser/Horde/Leader/Solo', hint: 'Encounter contains none of these heavy roles' },
    { key: 'dangerous_long', label: 'Dangerous / Long fight',       hint: 'Fight should be more dangerous or last longer' },
]


function getRoleCost(role?: string): number {
    return ROLE_COST[role ?? ''] ?? 2
}

function syncInstances(
    entries: EncounterEntry[],
    current: EncounterCardInstance[],
): EncounterCardInstance[] {
    const result: EncounterCardInstance[] = []
    for (const entry of entries) {
        const existing = current.filter((i) => i.cardId === entry.cardId)
        for (let n = 0; n < entry.count; n++) {
            result.push(existing[n] ?? {
                instanceId: crypto.randomUUID(),
                cardId: entry.cardId,
                hpCurrent: 0,
                stressCurrent: 0,
            })
        }
    }
    return result
}

function calcSpent(entries: Encounter['entries'], cards: AdversaryCard[]): number {
    return entries.reduce((sum, entry) => {
        const card = cards.find((c) => c.id === entry.cardId)
        return sum + getRoleCost(card?.role) * entry.count
    }, 0)
}


function EncounterBuilder() {
    const {
        campaigns, currentCampaignId,
        addEncounter, removeEncounter, updateEncounter, setActiveEncounter,
        addEncounterToSession, removeEncounterFromSession,
    } = useCampaignStore()

    const { cards } = useCardsStore()
    const adversaryCards = useMemo(
        () => cards.filter((c): c is AdversaryCard => c.type === 'adversary'),
        [cards]
    )

    const currentCampaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const encounters = useMemo(
        () => currentCampaign?.encounters ?? [],
        [currentCampaign]
    )
    const activeEncounterId = currentCampaign?.activeEncounterId

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('All')
    const [tierFilter, setTierFilter] = useState<string>('All')
    const [collapsedSessions, setCollapsedSessions] = useState<Set<string>>(new Set())
    const [detailCardId, setDetailCardId] = useState<string | null>(null)

    const encounter = encounters.find((e) => e.id === selectedId) ?? null

    const displayEncounter = encounter ?? (encounters.length > 0 && !selectedId ? encounters[encounters.length - 1] : null)
    const displayId = displayEncounter?.id ?? null

    const cardsById = useMemo(
        () => new Map(adversaryCards.map((c) => [c.id, c])),
        [adversaryCards]
    )
    const encounterTier = displayEncounter?.tier ?? 1

    const autoAdjustments = useMemo(
        () => displayEncounter ? computeAutoAdjustments(displayEncounter.entries, cardsById, encounterTier) : [],
        [displayEncounter, cardsById, encounterTier]
    )
    const active = useMemo(
        () => displayEncounter ? activeAdjustments(displayEncounter.adjustments, autoAdjustments) : [],
        [displayEncounter, autoAdjustments]
    )
    const nSolos = displayEncounter ? soloCount(displayEncounter.entries, cardsById) : 0
    const nLower = displayEncounter ? lowerTierCount(displayEncounter.entries, cardsById, encounterTier) : 0

    const totalPoints = displayEncounter ? calcBattlePoints(displayEncounter.pcCount, active) : 0
    const spentPoints = displayEncounter ? calcSpent(displayEncounter.entries, adversaryCards) : 0
    const remainingPoints = totalPoints - spentPoints

    const remainingColor =
        remainingPoints < 0 ? 'text-red-400' :
        remainingPoints <= 1 ? 'text-hope-secondary' :
        'text-green-400'

    const sessions = useMemo(
        () => currentCampaign?.sessions ?? [],
        [currentCampaign]
    )

    const unassignedEncounters = useMemo(() => {
        const assignedIds = new Set(sessions.flatMap((s) => s.encounterIds ?? []))
        return encounters.filter((e) => !assignedIds.has(e.id))
    }, [encounters, sessions])

    const ownerSession = useMemo(
        () => sessions.find((s) => (s.encounterIds ?? []).includes(displayEncounter?.id ?? '')),
        [sessions, displayEncounter?.id]
    )

    const allRoles = useMemo(() => {
        const roles = new Set(adversaryCards.map((c) => c.role ?? 'Unknown'))
        return ['All', ...Array.from(roles).sort()]
    }, [adversaryCards])

    const filteredCards = useMemo(() => {
        const q = search.toLowerCase()
        return adversaryCards.filter((c) => {
            const matchesSearch = !q || c.title.toLowerCase().includes(q) || (c.role ?? '').toLowerCase().includes(q)
            const matchesRole = roleFilter === 'All' || (c.role ?? 'Unknown') === roleFilter
            const matchesTier = tierFilter === 'All' || String(c.tier ?? '—') === tierFilter
            return matchesSearch && matchesRole && matchesTier
        })
    }, [adversaryCards, search, roleFilter, tierFilter])

    const rosterGroups = useMemo(() => {
        if (!displayEncounter) return [] as { role: string; entries: NonNullable<typeof displayEncounter>['entries'] }[]
        const map: Record<string, typeof displayEncounter.entries> = {}
        for (const entry of displayEncounter.entries) {
            const card = adversaryCards.find((c) => c.id === entry.cardId)
            const role = card?.role ?? 'Unknown'
            if (!map[role]) map[role] = []
            map[role].push(entry)
        }
        return Object.entries(map).map(([role, entries]) => ({ role, entries }))
    }, [displayEncounter, adversaryCards])

    const restrictedRoles = useMemo(() => {
        if (!displayEncounter?.adjustments.includes('no_heavy_roles')) return new Set<string>()
        return new Set(['Bruiser', 'Horde', 'Leader', 'Solo'])
    }, [displayEncounter?.adjustments])

    const detailCard = useMemo(
        () => adversaryCards.find((c) => c.id === detailCardId) ?? null,
        [adversaryCards, detailCardId]
    )

    function toggleSessionCollapse(sessionId: string) {
        setCollapsedSessions((prev) => {
            const next = new Set(prev)
            if (next.has(sessionId)) { next.delete(sessionId) } else { next.add(sessionId) }
            return next
        })
    }

    function handleCreate() {
        if (!currentCampaignId) return
        const enc: Encounter = {
            id: crypto.randomUUID(),
            name: `Encounter ${encounters.length + 1}`,
            pcCount: 4,
            adjustments: [],
            tier: 1,
            entries: [],
        }
        addEncounter(currentCampaignId, enc)
        setSelectedId(enc.id)
    }

    function handleDelete(encounterId: string) {
        if (!currentCampaignId) return
        if (!window.confirm('Delete this encounter?')) return
        removeEncounter(currentCampaignId, encounterId)
        setSelectedId(null)
    }

    function update(updates: Partial<Encounter>) {
        if (!currentCampaignId || !displayId) return
        updateEncounter(currentCampaignId, displayId, updates)
    }

    function toggleAdjustment(key: EncounterAdjustment) {
        if (!displayEncounter) return
        if (!MANUAL_ADJUSTMENTS.includes(key)) return
        const has = displayEncounter.adjustments.includes(key)
        update({
            adjustments: has
                ? displayEncounter.adjustments.filter((a) => a !== key)
                : [...displayEncounter.adjustments, key],
        })
    }

    function addCard(cardId: string) {
        if (!displayEncounter) return
        const existing = displayEncounter.entries.find((e) => e.cardId === cardId)
        const newEntries = existing
            ? displayEncounter.entries.map((e) => e.cardId === cardId ? { ...e, count: e.count + 1 } : e)
            : [...displayEncounter.entries, { cardId, count: 1 }]
        update({ entries: newEntries, instances: syncInstances(newEntries, displayEncounter.instances ?? []) })
    }

    function changeCount(cardId: string, delta: number) {
        if (!displayEncounter) return
        const entry = displayEncounter.entries.find((e) => e.cardId === cardId)
        if (!entry) return
        const next = entry.count + delta
        const newEntries = next <= 0
            ? displayEncounter.entries.filter((e) => e.cardId !== cardId)
            : displayEncounter.entries.map((e) => e.cardId === cardId ? { ...e, count: next } : e)
        update({ entries: newEntries, instances: syncInstances(newEntries, displayEncounter.instances ?? []) })
    }


    if (!currentCampaignId) {
        return (
            <div className="flex items-center justify-center h-full text-ui-muted">
                <p>Select a campaign first.</p>
            </div>
        )
    }


    return (
        <div className="flex flex-col h-full gap-4">

            <div className="flex items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-ui-text font-display text-2xl font-bold">Encounter Builder</h1>
                    <p className="text-ui-muted text-sm">Build encounters using battle points</p>
                </div>
                <Button variant="primary" onClick={handleCreate}>+ New Encounter</Button>
            </div>

            {!displayEncounter ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-ui-muted">
                    <div className="text-5xl">⚔️</div>
                    <p className="text-sm">No encounters yet.</p>
                    <Button variant="primary" onClick={handleCreate}>Create First Encounter</Button>
                </div>
            ) : (
                <div className="flex gap-3 flex-1 min-h-0">

                    {/* Sessions sidebar — navigation only */}
                    <div className="w-44 shrink-0 flex flex-col bg-ui-surface rounded-xl border border-ui-surface2 overflow-hidden">
                        <div className="px-3 py-2.5 border-b border-ui-surface2 shrink-0">
                            <p className="text-ui-muted text-[10px] uppercase font-bold tracking-widest">Sessions</p>
                        </div>
                        <div className="flex-1 overflow-y-auto py-1.5 px-1.5 flex flex-col gap-0.5">
                            {sessions.length === 0 && (
                                <p className="text-ui-muted text-xs px-2 py-2 italic">No sessions yet.</p>
                            )}
                            {sessions.map((session) => {
                                const isCollapsed = collapsedSessions.has(session.id)
                                const sessionEncounters = (session.encounterIds ?? [])
                                    .map((eid) => encounters.find((e) => e.id === eid))
                                    .filter((e): e is Encounter => e !== undefined)
                                return (
                                    <div key={session.id}>
                                        <button
                                            onClick={() => toggleSessionCollapse(session.id)}
                                            className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-ui-muted hover:text-ui-text hover:bg-ui-surface2 transition-colors"
                                        >
                                            <span className="text-[8px] shrink-0">{isCollapsed ? '▶' : '▼'}</span>
                                            <span className="truncate flex-1 text-left">{session.name}</span>
                                            <span className="shrink-0 text-[10px] bg-ui-surface2 px-1.5 py-0.5 rounded-full">{sessionEncounters.length}</span>
                                        </button>
                                        {!isCollapsed && (
                                            <div className="flex flex-col gap-0.5 pl-4 pr-1 pb-0.5">
                                                {sessionEncounters.length === 0 ? (
                                                    <p className="text-ui-muted text-[10px] px-2 py-1 italic">Empty</p>
                                                ) : (
                                                    sessionEncounters.map((enc) => (
                                                        <button
                                                            key={enc.id}
                                                            onClick={() => setSelectedId(enc.id)}
                                                            className={`text-left px-2 py-1 rounded-lg text-[11px] transition-colors w-full truncate ${
                                                                displayId === enc.id
                                                                    ? 'bg-fear-light/15 text-ui-text font-semibold border-l-2 border-fear-light pl-1.5'
                                                                    : 'text-ui-muted hover:text-ui-text hover:bg-ui-surface2'
                                                            }`}
                                                        >
                                                            {enc.name}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                            {unassignedEncounters.length > 0 && (
                                <div className="mt-1">
                                    <p className="px-2 py-1 text-[10px] font-semibold text-ui-muted uppercase tracking-wider">Unassigned</p>
                                    <div className="flex flex-col gap-0.5">
                                        {unassignedEncounters.map((enc) => (
                                            <button
                                                key={enc.id}
                                                onClick={() => setSelectedId(enc.id)}
                                                className={`text-left px-2 py-1 rounded-lg text-[11px] transition-colors w-full truncate ${
                                                    displayId === enc.id
                                                        ? 'bg-fear-light/15 text-ui-text font-semibold border-l-2 border-fear-light pl-1.5'
                                                        : 'text-ui-muted hover:text-ui-text hover:bg-ui-surface2'
                                                }`}
                                            >
                                                {enc.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Adversary Library */}
                    <div className="flex-1 flex flex-col gap-2 min-w-0">

                        {/* Search + filters */}
                        <div className="flex gap-2 shrink-0">
                            <Input theme="fear" type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search adversaries..." className="flex-1" />
                            <Select theme="fear" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ width: 'auto' }}>
                                {allRoles.map((r) => <option key={r}>{r}</option>)}
                            </Select>
                            <Select theme="fear" value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} style={{ width: 'auto' }}>
                                <option value="All">All Tiers</option>
                                <option value="1">Tier 1</option>
                                <option value="2">Tier 2</option>
                                <option value="3">Tier 3</option>
                                <option value="4">Tier 4</option>
                            </Select>
                        </div>

                        {/* Card grid */}
                        <div className="flex-1 overflow-y-auto">
                            {adversaryCards.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-ui-muted gap-2">
                                    <span className="text-4xl">🐉</span>
                                    <p className="text-sm">No adversary cards yet.</p>
                                    <p className="text-xs">Create them in the Cards section.</p>
                                </div>
                            ) : filteredCards.length === 0 ? (
                                <p className="text-ui-muted text-sm text-center py-8">No cards match your search.</p>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    {filteredCards.map((card) => {
                                        const cost = getRoleCost(card.role)
                                        const inEncounter = displayEncounter.entries.find((e) => e.cardId === card.id)
                                        const isRestricted = card.role ? restrictedRoles.has(card.role) : false
                                        const isLowerTier = card.tier != null && card.tier < encounterTier
                                        return (
                                            <div
                                                key={card.id}
                                                onClick={() => addCard(card.id)}
                                                className={`text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                                                    inEncounter
                                                        ? 'bg-card-bg border-fear-light/50 ring-1 ring-inset ring-fear-light/20 hover:border-fear-light/70'
                                                        : isRestricted
                                                        ? 'bg-card-bg border-card-border opacity-50'
                                                        : 'bg-card-bg border-card-border hover:border-card-border/60'
                                                }${isLowerTier ? ' ring-1 ring-green-600/40' : ''}`}
                                            >
                                                <div className="flex items-start justify-between gap-1 mb-2">
                                                    <span className="text-card-text text-sm font-semibold leading-tight">{card.title}</span>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {isRestricted && <span className="text-[9px] text-red-600 font-bold">⚠</span>}
                                                        {inEncounter && <span className="text-fear-light text-xs font-bold">×{inEncounter.count}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                                    {card.role && (
                                                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${ROLE_COLORS_CARD[card.role] ?? 'bg-card-border/20 text-card-text/60 border-card-border/60'}`}>
                                                            {card.role}
                                                        </span>
                                                    )}
                                                    {card.tier && (
                                                        <span className="text-[10px] text-card-text/60">T{card.tier}</span>
                                                    )}
                                                    {isLowerTier && (
                                                        <span className="text-[9px] font-bold text-green-700 bg-green-600/15 px-1 rounded">Tier inferior</span>
                                                    )}
                                                    <span className="text-[10px] font-bold text-hope-secondary ml-auto">{cost}pt</span>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setDetailCardId(card.id) }}
                                                    className="w-full py-1.5 rounded-lg bg-card-border/30 hover:bg-fear-light/20 text-card-text/60 hover:text-card-text text-xs font-semibold transition-colors border border-card-border/40 hover:border-fear-light/30"
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right panel — config + budget + adjustments + roster */}
                    <div className="w-80 shrink-0 flex flex-col gap-3 overflow-y-auto">

                        {/* Encounter config */}
                        <div className="bg-ui-surface rounded-xl border border-ui-surface2 p-4 flex flex-col gap-3">
                            <Input
                                theme="fear"
                                type="text"
                                value={displayEncounter.name}
                                onChange={(e) => update({ name: e.target.value })}
                                className="font-semibold"
                            />
                            <div className="flex items-center gap-2">
                                <Select
                                    theme="fear"
                                    value={ownerSession?.id ?? ''}
                                    onChange={(e) => {
                                        if (!currentCampaignId || !displayId) return
                                        const prevSession = sessions.find((s) => (s.encounterIds ?? []).includes(displayId))
                                        if (prevSession) removeEncounterFromSession(currentCampaignId, prevSession.id, displayId)
                                        if (e.target.value) {
                                            addEncounterToSession(currentCampaignId, e.target.value, displayId)
                                            setActiveEncounter(currentCampaignId, displayId)
                                        }
                                    }}
                                    className="flex-1"
                                >
                                    <option value="">— No Session —</option>
                                    {sessions.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-ui-muted text-xs shrink-0">Players</span>
                                <button
                                    onClick={() => update({ pcCount: Math.max(1, displayEncounter.pcCount - 1) })}
                                    className="w-7 h-7 rounded bg-ui-surface2 hover:bg-fear-light text-ui-text font-bold transition-colors text-sm flex items-center justify-center"
                                >−</button>
                                <span className="text-ui-text font-bold text-lg w-6 text-center">{displayEncounter.pcCount}</span>
                                <button
                                    onClick={() => update({ pcCount: Math.min(12, displayEncounter.pcCount + 1) })}
                                    className="w-7 h-7 rounded bg-ui-surface2 hover:bg-fear-light text-ui-text font-bold transition-colors text-sm flex items-center justify-center"
                                >+</button>
                                <button
                                    onClick={() => {
                                        if (!currentCampaignId) return
                                        const isActive = activeEncounterId === displayId
                                        setActiveEncounter(currentCampaignId, isActive ? null : displayId)
                                    }}
                                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                                        activeEncounterId === displayId
                                            ? 'bg-hope-primary/20 border-hope-primary text-hope-primary'
                                            : 'bg-ui-surface2 border-ui-surface2 text-ui-muted hover:text-ui-text'
                                    }`}
                                >
                                    {activeEncounterId === displayId ? '★ Active' : 'Set Active'}
                                </button>
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(displayEncounter.id)}>✕</Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-ui-muted text-xs shrink-0">Tier</span>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4].map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => update({ tier: t as 1 | 2 | 3 | 4 })}
                                            className={`w-7 h-7 rounded text-sm font-bold transition-colors ${encounterTier === t ? 'bg-fear-light text-ui-text' : 'bg-ui-surface2 text-ui-muted hover:text-ui-text'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                                <span className="text-[10px] text-ui-muted/70 leading-tight">Tier del grupo (ref. lower-tier)</span>
                            </div>
                        </div>

                        {/* Roster */}
                        <div className="bg-ui-surface rounded-xl border border-ui-surface2 p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-ui-text text-[10px] uppercase font-bold tracking-widest">Roster</span>
                                {displayEncounter.adjustments.includes('bonus_damage') && (
                                    <span className="text-[9px] font-bold text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded">+1d4 DMG</span>
                                )}
                            </div>

                            {displayEncounter.entries.length === 0 ? (
                                <p className="text-ui-muted text-xs text-center py-3 italic">Click adversaries from the library to add them.</p>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {rosterGroups.map(({ role, entries }) => {
                                        const roleColor = ROLE_COLORS[role] ?? 'bg-ui-surface2/50 text-ui-muted border-ui-surface2'
                                        const textColor = roleColor.split(' ')[1] ?? 'text-ui-muted'
                                        const groupCost = entries.reduce((sum, e) => {
                                            const card = adversaryCards.find((c) => c.id === e.cardId)
                                            return sum + getRoleCost(card?.role) * e.count
                                        }, 0)
                                        return (
                                            <div key={role}>
                                                <div className="flex items-center justify-between mb-1.5 px-0.5">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}>{role}</span>
                                                    <span className="text-[10px] text-ui-muted font-semibold">{groupCost}pt</span>
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    {entries.map((entry) => {
                                                        const card = adversaryCards.find((c) => c.id === entry.cardId)
                                                        if (!card) return null
                                                        const cost = getRoleCost(card.role)
                                                        return (
                                                            <div key={entry.cardId} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 border ${roleColor.split(' ').slice(0, 3).join(' ')}`}>
                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    <button
                                                                        onClick={() => changeCount(entry.cardId, -1)}
                                                                        className="w-5 h-5 rounded bg-ui-surface2/80 hover:bg-fear-light/40 text-ui-text text-xs font-bold transition-colors flex items-center justify-center"
                                                                    >−</button>
                                                                    <span className="text-ui-text text-sm font-bold w-5 text-center">{entry.count}</span>
                                                                    <button
                                                                        onClick={() => changeCount(entry.cardId, 1)}
                                                                        className="w-5 h-5 rounded bg-ui-surface2/80 hover:bg-fear-light/40 text-ui-text text-xs font-bold transition-colors flex items-center justify-center"
                                                                    >+</button>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-ui-text text-xs font-semibold truncate">{card.title}</p>
                                                                    <p className="text-[10px] text-ui-muted">HP {card.hp.max} · DC {card.difficulty}</p>
                                                                </div>
                                                                <span className="text-hope-secondary text-xs font-bold shrink-0">{cost * entry.count}pt</span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            <div className="border-t border-ui-surface2 pt-3">
                                <p className="text-ui-muted text-[10px] uppercase font-bold tracking-wider mb-2">Role Costs</p>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                                    {Object.entries(ROLE_COST).map(([role, cost]) => (
                                        <div key={role} className="flex justify-between text-[10px]">
                                            <span className={ROLE_COLORS[role]?.split(' ')[1] ?? 'text-ui-muted'}>{role}</span>
                                            <span className="text-ui-text font-semibold">{cost}pt</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-ui-muted text-[10px] mt-1.5 italic">Minion: 1pt per group (= party size)</p>
                            </div>
                        </div>

                        {/* Budget — single display */}
                        <div className="bg-ui-surface rounded-xl border border-ui-surface2 p-4 flex flex-col gap-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-ui-muted text-[10px] uppercase font-bold tracking-widest">Battle Points</span>
                                <span className={`text-sm font-bold ${remainingColor}`}>
                                    {remainingPoints > 0
                                        ? `${remainingPoints} left`
                                        : remainingPoints === 0
                                        ? 'At limit'
                                        : `${Math.abs(remainingPoints)} over`}
                                </span>
                            </div>
                            <div className="h-2 bg-ui-surface2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${remainingPoints < 0 ? 'bg-red-500' : remainingPoints === 0 ? 'bg-hope-secondary' : remainingPoints <= 2 ? 'bg-hope-secondary' : 'bg-green-500'}`}
                                    style={{ width: `${Math.min(100, Math.max(0, totalPoints > 0 ? (spentPoints / totalPoints) * 100 : 0))}%` }}
                                />
                            </div>
                            <div className="flex flex-col gap-1 text-xs">
                                <div className="flex justify-between text-ui-muted">
                                    <span>Base (3×{displayEncounter.pcCount}+2)</span>
                                    <span className="text-ui-text">{3 * displayEncounter.pcCount + 2}</span>
                                </div>
                                {active.map((adj) => {
                                    const meta = ADJUSTMENT_META.find((m) => m.key === adj)
                                    const delta = ADJUSTMENT_DELTAS[adj]
                                    return (
                                        <div key={adj} className="flex justify-between text-ui-muted">
                                            <span className="truncate pr-2">{meta?.label ?? adj}</span>
                                            <span className={delta > 0 ? 'text-green-400' : 'text-red-400'}>
                                                {delta > 0 ? '+' : ''}{delta}
                                            </span>
                                        </div>
                                    )
                                })}
                                <div className="flex justify-between border-t border-ui-surface2 pt-1.5 mt-0.5 font-semibold">
                                    <span className="text-ui-text">Total</span>
                                    <span className="text-ui-text">{totalPoints}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-ui-muted">Spent</span>
                                    <span className="text-ui-text">{spentPoints}</span>
                                </div>
                            </div>
                        </div>

                        {/* Adjustments */}
                        <div className="bg-ui-surface rounded-xl border border-ui-surface2 p-4 flex flex-col gap-2">
                            <span className="text-ui-muted text-[10px] uppercase font-bold tracking-widest mb-0.5">Adjustments</span>
                            {ADJUSTMENT_META.filter((m) => MANUAL_ADJUSTMENTS.includes(m.key)).map(({ key, label, hint }) => {
                                const isActive = displayEncounter.adjustments.includes(key)
                                const delta = ADJUSTMENT_DELTAS[key]
                                return (
                                    <button
                                        key={key}
                                        onClick={() => toggleAdjustment(key)}
                                        title={hint}
                                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs text-left transition-colors ${isActive
                                            ? 'bg-fear-light/20 border-fear-light/50 text-ui-text'
                                            : 'bg-ui-surface2/50 border-ui-surface2 text-ui-muted hover:text-ui-text hover:border-ui-surface'}`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span>{isActive ? '☑' : '☐'}</span>
                                            <span>{label}</span>
                                        </span>
                                        <span className={`font-bold shrink-0 ml-2 ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {delta > 0 ? '+' : ''}{delta}
                                        </span>
                                    </button>
                                )
                            })}

                            <div className="mt-1 pt-2 border-t border-ui-surface2 flex flex-col gap-2">
                                <span className="text-ui-muted/70 text-[9px] uppercase font-bold tracking-widest">Automáticos (según el roster)</span>
                                {ADJUSTMENT_META.filter((m) => AUTO_ADJUSTMENTS.includes(m.key)).map(({ key, label }) => {
                                    const isActive = autoAdjustments.includes(key)
                                    const delta = ADJUSTMENT_DELTAS[key]
                                    const reason = key === 'two_plus_solos'
                                        ? `${nSolos} Solo en el roster`
                                        : `${nLower} por debajo del tier ${encounterTier}`
                                    return (
                                        <div
                                            key={key}
                                            title={label}
                                            className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${isActive
                                                ? 'bg-hope-primary/10 border-hope-primary/40 text-ui-text'
                                                : 'bg-ui-surface2/30 border-ui-surface2 text-ui-muted/60'}`}
                                        >
                                            <span className="flex flex-col gap-0.5">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-ui-surface2 text-ui-muted">Auto</span>
                                                    {label}
                                                </span>
                                                <span className="text-[10px] text-ui-muted/70">{reason}</span>
                                            </span>
                                            <span className={`font-bold shrink-0 ml-2 ${isActive ? (delta > 0 ? 'text-green-400' : 'text-red-400') : 'text-ui-muted/50'}`}>
                                                {delta > 0 ? '+' : ''}{delta}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                    </div>

                </div>
            )}

            {/* Card Detail Modal */}
            {detailCard && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setDetailCardId(null)}
                >
                    <div
                        className="bg-card-bg border border-card-border rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-5 pt-4 pb-2 flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-card-text font-display text-lg font-black uppercase tracking-wide leading-tight">{detailCard.title}</h2>
                                <p className="text-card-text/60 text-[11px] italic mt-0.5">
                                    {[detailCard.tier ? `Tier ${detailCard.tier}` : null, detailCard.role].filter(Boolean).join(' · ')}
                                    {' · '}<span className="font-bold text-hope-secondary not-italic">{getRoleCost(detailCard.role)}pt</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setDetailCardId(null)}
                                className="text-card-text/40 hover:text-card-text text-lg transition-colors shrink-0 font-bold"
                            >✕</button>
                        </div>

                        {/* Description / Motives / Tactics */}
                        {detailCard.description && <div className="px-5 pb-1"><p className="text-card-text/80 text-[11px] italic leading-snug">{renderBold(detailCard.description)}</p></div>}
                        {detailCard.motives && <div className="px-5 pb-1"><p className="text-card-text/85 text-[11px] leading-snug"><span className="font-bold">Motives:</span> {renderBold(detailCard.motives)}</p></div>}
                        {detailCard.tactics && <div className="px-5 pb-1"><p className="text-card-text/85 text-[11px] leading-snug"><span className="font-bold">Tactics:</span> {renderBold(detailCard.tactics)}</p></div>}

                        {/* Stats box */}
                        <div className="mx-5 my-3 border border-card-border/70 rounded-lg px-3 py-2 flex flex-col gap-1.5">
                            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-card-text">
                                <span><span className="font-bold">Difficulty:</span> {detailCard.difficulty}</span>
                                <span className="text-card-border/50 select-none">│</span>
                                <span><span className="font-bold">HP:</span> {detailCard.hp.max}</span>
                                <span className="text-card-border/50 select-none">│</span>
                                <span><span className="font-bold">Stress:</span> {detailCard.stress.max}</span>
                            </div>
                            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[11px]">
                                <span className="font-bold text-card-text">Thresholds:</span>
                                <span className="text-green-700 font-semibold">Minor &lt;{detailCard.thresholds.minor}</span>
                                {detailCard.thresholds.major !== undefined && (
                                    <span className="text-amber-700 font-semibold">Major {detailCard.thresholds.minor}–{detailCard.thresholds.major - 1}</span>
                                )}
                                <span className="text-red-700 font-semibold">Severe {detailCard.thresholds.severe}+</span>
                            </div>
                            {(detailCard.attackModifier || detailCard.attackName || detailCard.attackDamage) && (
                                <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                                    <span className="font-black text-red-700 shrink-0">ATK:</span>
                                    {detailCard.attackModifier && <span className="text-card-text font-bold">{detailCard.attackModifier}</span>}
                                    {(detailCard.attackName || detailCard.attackDistance) && (
                                        <><span className="text-card-border/50 select-none">|</span><span className="text-card-text">{[detailCard.attackName, detailCard.attackDistance].filter(Boolean).join(' · ')}</span></>
                                    )}
                                    {detailCard.attackDamage && (
                                        <>
                                            <span className="text-card-border/50 select-none">|</span>
                                            <span className="text-card-text font-mono">{detailCard.attackDamage}</span>
                                            {detailCard.attackDamageType && (
                                                <span className={`font-semibold ${detailCard.attackDamageType === 'physical' ? 'text-orange-700' : 'text-blue-700'}`}>
                                                    {detailCard.attackDamageType === 'physical' ? 'phys' : 'magic'}
                                                </span>
                                            )}
                                            {displayEncounter?.adjustments.includes('bonus_damage') && (
                                                <span className="text-red-700 font-bold text-[10px] bg-red-500/15 px-1 rounded">+1d4</span>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                            {detailCard.experience && (
                                <p className="text-[11px] text-card-text"><span className="font-bold">Experience:</span> {detailCard.experience}</p>
                            )}
                        </div>

                        {/* Abilities */}
                        {detailCard.abilities && detailCard.abilities.length > 0 && (
                            <div className="px-5 pb-4">
                                <p className="text-card-text font-black text-[10px] uppercase tracking-widest mb-2">Abilities</p>
                                <div className="flex flex-col gap-2">
                                    {(['action', 'reaction', 'fear', 'passive'] as AbilityType[]).map((type) => {
                                        const group = detailCard.abilities!.filter((a) => a.type === type)
                                        if (group.length === 0) return null
                                        const s = ABILITY_CARD_STYLES[type]
                                        return group.map((ability) => (
                                            <div key={ability.id} className={`text-[11px] leading-snug text-card-text pl-2.5 border-l-2 ${s.border}`}>
                                                <span className={`font-black italic ${s.text}`}>{ability.name}</span>{' — '}
                                                <span className={`font-bold italic ${s.text}`}>{s.icon} {s.label}:</span>{' '}
                                                <span className="text-card-text/85">{renderBold(ability.description)}</span>
                                                {!!ability.fearCost && ability.fearCost > 0 && <span className="ml-1 text-purple-700 text-[9px] font-black">💀 {ability.fearCost}</span>}
                                            </div>
                                        ))
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        {detailCard.tags.length > 0 && (
                            <div className="px-5 pb-4 flex flex-wrap gap-1.5">
                                {detailCard.tags.map((tag) => (
                                    <span key={tag} className="text-[10px] bg-card-border/20 text-card-text/60 px-2 py-0.5 rounded-full border border-card-border/40">{tag}</span>
                                ))}
                            </div>
                        )}

                        {/* Footer — Add to encounter */}
                        <div className="border-t border-card-border/50 px-5 py-3 flex justify-end">
                            <button
                                onClick={() => { addCard(detailCard.id); setDetailCardId(null) }}
                                className="px-5 py-2 text-sm bg-hope-primary hover:bg-hope-gold text-white rounded-lg transition-colors font-medium"
                            >
                                + Add to Encounter ({getRoleCost(detailCard.role)}pt)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default EncounterBuilder