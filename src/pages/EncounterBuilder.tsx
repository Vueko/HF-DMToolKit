import { useState, useMemo } from 'react'
import { useCampaignStore } from '../store/campaignStore'
import { useCardsStore } from '../store/cardsStore'
import type { AdversaryCard, Encounter, EncounterAdjustment, EncounterCardInstance, EncounterEntry } from '../types'


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

const ADJUSTMENT_CONFIG: { key: EncounterAdjustment; label: string; delta: number; hint: string }[] = [
    { key: 'easy_short',     label: 'Easy / Short fight',          delta: -1, hint: 'Fight should be less difficult or shorter' },
    { key: 'two_plus_solos', label: '2+ Solo adversaries',         delta: -2, hint: 'Using two or more Solo adversaries' },
    { key: 'bonus_damage',   label: 'Bonus damage (+1d4 / +2)',     delta: -2, hint: 'Adding +1d4 or +2 to any adversary damage roll' },
    { key: 'lower_tier',     label: 'Lower-tier adversary',         delta: +1, hint: 'Selecting an adversary from a lower tier' },
    { key: 'no_heavy_roles', label: 'No Bruiser/Horde/Leader/Solo', delta: +1, hint: 'Encounter contains none of these heavy roles' },
    { key: 'dangerous_long', label: 'Dangerous / Long fight',       delta: +2, hint: 'Fight should be more dangerous or last longer' },
]


function getRoleCost(role?: string): number {
    return ROLE_COST[role ?? ''] ?? 2
}

function calcBattlePoints(pcCount: number, adjustments: EncounterAdjustment[]): number {
    const base = 3 * pcCount + 2
    const delta = adjustments.reduce((sum, a) => {
        const cfg = ADJUSTMENT_CONFIG.find((c) => c.key === a)
        return sum + (cfg?.delta ?? 0)
    }, 0)
    return base + delta
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
    const encounters = currentCampaign?.encounters ?? []
    const activeEncounterId = currentCampaign?.activeEncounterId

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('All')
    const [tierFilter, setTierFilter] = useState<string>('All')
    const [collapsedSessions, setCollapsedSessions] = useState<Set<string>>(new Set())

    const encounter = encounters.find((e) => e.id === selectedId) ?? null

    const displayEncounter = encounter ?? (encounters.length > 0 && !selectedId ? encounters[encounters.length - 1] : null)
    const displayId = displayEncounter?.id ?? null

    const totalPoints = displayEncounter ? calcBattlePoints(displayEncounter.pcCount, displayEncounter.adjustments) : 0
    const spentPoints = displayEncounter ? calcSpent(displayEncounter.entries, adversaryCards) : 0
    const remainingPoints = totalPoints - spentPoints

    const remainingColor =
        remainingPoints < 0 ? 'text-red-400' :
        remainingPoints <= 1 ? 'text-hope-secondary' :
        'text-green-400'

    const sessions = currentCampaign?.sessions ?? []

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


    function toggleSessionCollapse(sessionId: string) {
        setCollapsedSessions((prev) => {
            const next = new Set(prev)
            next.has(sessionId) ? next.delete(sessionId) : next.add(sessionId)
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
                <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-fear-light hover:bg-fear-secondary text-ui-text text-sm rounded-lg transition-colors font-medium"
                >
                    + New Encounter
                </button>
            </div>

            {!displayEncounter ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-ui-muted">
                    <div className="text-5xl">⚔️</div>
                    <p className="text-sm">No encounters yet.</p>
                    <button
                        onClick={handleCreate}
                        className="px-6 py-2 bg-fear-light hover:bg-fear-secondary text-ui-text rounded-lg transition-colors font-semibold text-sm"
                    >
                        Create First Encounter
                    </button>
                </div>
            ) : (
                <div className="flex gap-4 flex-1 min-h-0">

                    {/* Session Sidebar */}
                    <div className="w-64 shrink-0 flex flex-col gap-2 overflow-y-auto">
                        <p className="text-ui-muted text-xs uppercase font-bold tracking-wider px-1">Sessions</p>
                        {sessions.length === 0 && (
                            <p className="text-ui-muted text-xs px-1 italic">No sessions yet.</p>
                        )}
                        {sessions.map((session) => {
                            const isCollapsed = collapsedSessions.has(session.id)
                            const sessionEncounters = (session.encounterIds ?? [])
                                .map((eid) => encounters.find((e) => e.id === eid))
                                .filter((e): e is Encounter => e !== undefined)
                            return (
                                <div key={session.id} className="bg-ui-surface rounded-lg border border-ui-surface2 overflow-hidden">
                                    <button
                                        onClick={() => toggleSessionCollapse(session.id)}
                                        className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-ui-text hover:bg-ui-surface2 transition-colors"
                                    >
                                        <span className="truncate">{session.name}</span>
                                        <span className="shrink-0 ml-1 text-ui-muted">{isCollapsed ? '▶' : '▼'}</span>
                                        <span className="text-ui-muted text-[10px] bg-ui-surface2 px-1.5 py-0.5 rounded-full ml-1">{sessionEncounters.length}</span>
                                    </button>
                                    {!isCollapsed && (
                                        <div className="flex flex-col gap-0.5 px-1 pb-1">
                                            {sessionEncounters.length === 0 ? (
                                                <p className="text-ui-muted text-[10px] px-1 py-0.5 italic">Empty</p>
                                            ) : (
                                                sessionEncounters.map((enc) => (
                                                    <button
                                                        key={enc.id}
                                                        onClick={() => setSelectedId(enc.id)}
                                                        className={`text-left px-2 py-1 rounded text-[11px] transition-colors break-words ${
                                                            displayId === enc.id
                                                                ? 'bg-fear-light/20 text-ui-text font-semibold'
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
                            <div className="bg-ui-surface rounded-lg border border-ui-surface2 overflow-hidden">
                                <p className="px-2 py-1.5 text-xs font-semibold text-ui-muted">Unassigned</p>
                                <div className="flex flex-col gap-0.5 px-1 pb-1">
                                    {unassignedEncounters.map((enc) => (
                                        <button
                                            key={enc.id}
                                            onClick={() => setSelectedId(enc.id)}
                                            className={`text-left px-2 py-1 rounded text-[11px] transition-colors break-words ${
                                                displayId === enc.id
                                                    ? 'bg-fear-light/20 text-ui-text font-semibold'
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

                    <div className="w-64 shrink-0 flex flex-col gap-3 overflow-y-auto">
                        <div className="bg-ui-surface rounded-xl border border-ui-surface2 p-4 flex flex-col gap-3">
                            <input
                                type="text"
                                value={displayEncounter.name}
                                onChange={(e) => update({ name: e.target.value })}
                                className="bg-ui-surface2 text-ui-text text-sm font-semibold px-3 py-2 rounded-lg border border-ui-surface2 outline-none focus:border-fear-light w-full"
                            />
                            {/* Session picker */}
                            <select
                                value={ownerSession?.id ?? ''}
                                onChange={(e) => {
                                    if (!currentCampaignId || !displayId) return
                                    const prevSession = sessions.find((s) => (s.encounterIds ?? []).includes(displayId))
                                    if (prevSession) removeEncounterFromSession(currentCampaignId, prevSession.id, displayId)
                                    if (e.target.value) addEncounterToSession(currentCampaignId, e.target.value, displayId)
                                }}
                                className="bg-ui-surface2 text-ui-text text-xs px-3 py-2 rounded-lg border border-ui-surface2 outline-none focus:border-fear-light w-full"
                            >
                                <option value="">— No Session —</option>
                                {sessions.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            <div className="flex gap-2">
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
                                <button
                                    onClick={() => handleDelete(displayEncounter.id)}
                                    className="px-3 py-1.5 text-xs text-red-400 bg-red-900/10 hover:bg-red-900/20 rounded-lg border border-red-900/20 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>

                        <div className="bg-ui-surface rounded-xl border border-ui-surface2 p-4 flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <span className="text-ui-muted text-xs uppercase font-bold tracking-wider">Players in Combat</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => update({ pcCount: Math.max(1, displayEncounter.pcCount - 1) })}
                                        className="w-8 h-8 rounded-lg bg-ui-surface2 hover:bg-fear-light text-ui-text font-bold transition-colors"
                                    >−</button>
                                    <span className="text-ui-text font-bold text-xl w-6 text-center">{displayEncounter.pcCount}</span>
                                    <button
                                        onClick={() => update({ pcCount: Math.min(12, displayEncounter.pcCount + 1) })}
                                        className="w-8 h-8 rounded-lg bg-ui-surface2 hover:bg-fear-light text-ui-text font-bold transition-colors"
                                    >+</button>
                                </div>
                            </div>

                            <div className="border-t border-ui-surface2 pt-3 flex flex-col gap-1.5 text-xs">
                                <div className="flex justify-between text-ui-muted">
                                    <span>Base (3×{displayEncounter.pcCount}+2)</span>
                                    <span className="text-ui-text font-semibold">{3 * displayEncounter.pcCount + 2} pts</span>
                                </div>
                                {displayEncounter.adjustments.map((adj) => {
                                    const cfg = ADJUSTMENT_CONFIG.find((c) => c.key === adj)!
                                    return (
                                        <div key={adj} className="flex justify-between text-ui-muted">
                                            <span className="truncate pr-2">{cfg.label}</span>
                                            <span className={cfg.delta > 0 ? 'text-green-400' : 'text-red-400'}>
                                                {cfg.delta > 0 ? '+' : ''}{cfg.delta}
                                            </span>
                                        </div>
                                    )
                                })}
                                <div className="flex justify-between border-t border-ui-surface2 pt-1.5 mt-0.5">
                                    <span className="text-ui-text font-bold">Total budget</span>
                                    <span className="text-ui-text font-bold">{totalPoints} pts</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-ui-muted">Spent</span>
                                    <span className="text-ui-text">{spentPoints} pts</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-ui-muted">Remaining</span>
                                    <span className={`font-bold ${remainingColor}`}>{remainingPoints} pts</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-ui-surface rounded-xl border border-ui-surface2 p-4 flex flex-col gap-2">
                            <span className="text-ui-muted text-xs uppercase font-bold tracking-wider mb-1">Adjustments</span>
                            {ADJUSTMENT_CONFIG.map(({ key, label, delta, hint }) => {
                                const active = displayEncounter.adjustments.includes(key)
                                return (
                                    <button
                                        key={key}
                                        onClick={() => toggleAdjustment(key)}
                                        title={hint}
                                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs text-left transition-colors ${
                                            active
                                                ? 'bg-fear-light/20 border-fear-light/50 text-ui-text'
                                                : 'bg-ui-surface2/50 border-ui-surface2 text-ui-muted hover:text-ui-text hover:border-ui-surface'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span>{active ? '☑' : '☐'}</span>
                                            <span>{label}</span>
                                        </span>
                                        <span className={`font-bold shrink-0 ml-2 ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {delta > 0 ? '+' : ''}{delta}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-3 min-w-0">
                        <div className="flex gap-2 shrink-0">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search adversaries..."
                                className="flex-1 bg-ui-surface2 text-ui-text text-sm px-3 py-2 rounded-lg border border-ui-surface2 outline-none focus:border-fear-light"
                            />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="bg-ui-surface2 text-ui-text text-sm px-3 py-2 rounded-lg border border-ui-surface2 outline-none focus:border-fear-light"
                            >
                                {allRoles.map((r) => <option key={r}>{r}</option>)}
                            </select>
                            <select
                                value={tierFilter}
                                onChange={(e) => setTierFilter(e.target.value)}
                                className="bg-ui-surface2 text-ui-text text-sm px-3 py-2 rounded-lg border border-ui-surface2 outline-none focus:border-fear-light"
                            >
                                <option value="All">All Tiers</option>
                                <option value="1">Tier 1</option>
                                <option value="2">Tier 2</option>
                                <option value="3">Tier 3</option>
                                <option value="4">Tier 4</option>
                            </select>
                        </div>

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
                                <div className="grid grid-cols-2 gap-2">
                                    {filteredCards.map((card) => {
                                        const cost = getRoleCost(card.role)
                                        const inEncounter = displayEncounter.entries.find((e) => e.cardId === card.id)
                                        return (
                                            <button
                                                key={card.id}
                                                onClick={() => addCard(card.id)}
                                                className={`text-left p-3 rounded-xl border transition-colors ${
                                                    inEncounter
                                                        ? 'bg-fear-light/10 border-fear-light/40 hover:bg-fear-light/20'
                                                        : 'bg-ui-surface border-ui-surface2 hover:bg-ui-surface2'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <span className="text-ui-text text-sm font-semibold leading-tight">{card.title}</span>
                                                    {inEncounter && (
                                                        <span className="text-fear-light text-xs font-bold shrink-0">×{inEncounter.count}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {card.role && (
                                                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${ROLE_COLORS[card.role] ?? 'bg-ui-surface2 text-ui-muted border-ui-surface2'}`}>
                                                            {card.role}
                                                        </span>
                                                    )}
                                                    {card.tier && (
                                                        <span className="text-[10px] text-ui-muted">Tier {card.tier}</span>
                                                    )}
                                                    <span className="text-[10px] font-bold text-hope-secondary ml-auto">{cost} pt{cost !== 1 ? 's' : ''}</span>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto">
                        <div className="bg-ui-surface rounded-xl border border-ui-surface2 p-4 flex flex-col gap-3 flex-1">
                            <div className="flex items-center justify-between shrink-0">
                                <span className="text-ui-muted text-xs uppercase font-bold tracking-wider">Encounter Roster</span>
                                <span className={`text-xs font-bold ${remainingColor}`}>
                                    {spentPoints}/{totalPoints} pts
                                </span>
                            </div>

                            <div className="h-1.5 bg-ui-surface2 rounded-full overflow-hidden shrink-0">
                                <div
                                    className={`h-full rounded-full transition-all ${
                                        remainingPoints < 0 ? 'bg-red-500' :
                                        remainingPoints <= 1 ? 'bg-hope-secondary' :
                                        'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(100, totalPoints > 0 ? (spentPoints / totalPoints) * 100 : 0)}%` }}
                                />
                            </div>

                            {displayEncounter.entries.length === 0 ? (
                                <p className="text-ui-muted text-xs text-center py-4 italic">
                                    Click adversaries from the library to add them.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                                    {displayEncounter.entries.map((entry) => {
                                        const card = adversaryCards.find((c) => c.id === entry.cardId)
                                        if (!card) return null
                                        const cost = getRoleCost(card.role)
                                        const lineCost = cost * entry.count
                                        return (
                                            <div key={entry.cardId} className="flex items-center gap-2 bg-ui-surface2/50 rounded-lg px-3 py-2">
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={() => changeCount(entry.cardId, -1)}
                                                        className="w-5 h-5 rounded bg-ui-surface2 hover:bg-fear-light text-ui-text text-xs font-bold transition-colors flex items-center justify-center"
                                                    >−</button>
                                                    <span className="text-ui-text text-sm font-bold w-5 text-center">{entry.count}</span>
                                                    <button
                                                        onClick={() => changeCount(entry.cardId, 1)}
                                                        className="w-5 h-5 rounded bg-ui-surface2 hover:bg-fear-light text-ui-text text-xs font-bold transition-colors flex items-center justify-center"
                                                    >+</button>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-ui-text text-xs font-semibold truncate">{card.title}</p>
                                                    <p className={`text-[10px] ${ROLE_COLORS[card.role ?? '']?.split(' ')[1] ?? 'text-ui-muted'}`}>
                                                        {card.role ?? 'Unknown'}
                                                    </p>
                                                </div>
                                                <span className="text-hope-secondary text-xs font-bold shrink-0">{lineCost}pt</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            <div className="border-t border-ui-surface2 pt-3 shrink-0">
                                <p className="text-ui-muted text-[10px] uppercase font-bold tracking-wider mb-2">Point Costs</p>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                                    {Object.entries(ROLE_COST).map(([role, cost]) => (
                                        <div key={role} className="flex justify-between text-[10px]">
                                            <span className="text-ui-muted">{role}</span>
                                            <span className="text-ui-text font-semibold">{cost}pt</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-ui-muted text-[10px] mt-1.5 italic">Minion: 1pt per group (= party size)</p>
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    )
}

export default EncounterBuilder