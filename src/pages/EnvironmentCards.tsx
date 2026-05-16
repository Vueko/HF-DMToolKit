import { useState, useMemo, useEffect } from 'react'
import { useCardsStore } from '../store/cardsStore'
import { useCampaignStore } from '../store/campaignStore'
import type { SessionCardInstance, AdversaryAbility, AbilityType, AdversaryCard, EnvironmentCard, EnvironmentFeature, EnvironmentFeatureType, Card } from '../types'
import { Button, Input, Select, Textarea } from '../components/ui'
import { renderBold } from '../utils/renderBold'

type Tab = 'environment' | 'adversary'

const ABILITY_CONFIG: Record<AbilityType, { label: string; icon: string; bg: string; border: string; text: string; btnBg: string }> = {
    action:   { label: 'Action',       icon: '⚔', bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300', btnBg: 'bg-orange-500/15 hover:bg-orange-500/30 border-orange-500/40 text-orange-300' },
    reaction: { label: 'Reaction',     icon: '↩', bg: 'bg-amber-400/10',  border: 'border-amber-400/30',  text: 'text-amber-300',  btnBg: 'bg-amber-400/15 hover:bg-amber-400/30 border-amber-400/40 text-amber-300' },
    fear:     { label: 'Fear Feature', icon: '⚡', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300', btnBg: 'bg-purple-500/15 hover:bg-purple-500/30 border-purple-500/40 text-purple-300' },
}

const FEATURE_CONFIG: Record<EnvironmentFeatureType, { label: string; icon: string; bg: string; border: string; text: string; btnBg: string }> = {
    action:  { label: 'Action',       icon: '⚔', bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300', btnBg: 'bg-orange-500/15 hover:bg-orange-500/30 border-orange-500/40 text-orange-300' },
    passive: { label: 'Passive',      icon: '◈', bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-300',   btnBg: 'bg-blue-500/15 hover:bg-blue-500/30 border-blue-500/40 text-blue-300' },
    fear:    { label: 'Fear Feature', icon: '⚡', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300', btnBg: 'bg-purple-500/15 hover:bg-purple-500/30 border-purple-500/40 text-purple-300' },
}

const ENV_PREVIEW_STYLES: Record<EnvironmentFeatureType, { border: string; text: string; icon: string; label: string }> = {
    action:  { border: 'border-l-orange-600', text: 'text-orange-700', icon: '⚔', label: 'Action' },
    passive: { border: 'border-l-blue-600',   text: 'text-blue-700',   icon: '◈', label: 'Passive' },
    fear:    { border: 'border-l-purple-600', text: 'text-purple-700', icon: '⚡', label: 'Fear Feature' },
}

const ADV_PREVIEW_STYLES: Record<AbilityType, { border: string; text: string; icon: string; label: string }> = {
    action:   { border: 'border-l-orange-600', text: 'text-orange-700', icon: '⚔', label: 'Action' },
    reaction: { border: 'border-l-amber-600',  text: 'text-amber-700',  icon: '↩', label: 'Reaction' },
    fear:     { border: 'border-l-purple-600', text: 'text-purple-700', icon: '⚡', label: 'Fear Feature' },
}

function CardPreview({ card }: { card: EnvironmentCard | AdversaryCard }) {
    return (
        <div className="bg-card-bg rounded-xl border border-card-border overflow-hidden flex flex-col">
            <div className="px-4 pt-3 pb-2">
                <h3 className="text-card-text font-display text-sm font-black uppercase tracking-wide leading-tight">{card.title}</h3>
                <p className="text-card-text/60 text-[11px] italic mt-0.5">
                    {[card.tier ? `Tier ${card.tier}` : null, card.type === 'environment' ? card.category : (card as AdversaryCard).role].filter(Boolean).join(' · ')}
                </p>
            </div>

            {card.type === 'environment' && (
                <>
                    {card.description && <div className="px-4 pb-1"><p className="text-card-text/80 text-[11px] italic leading-snug">{renderBold(card.description)}</p></div>}
                    {card.impulses && <div className="px-4 pb-1"><p className="text-card-text/85 text-[11px] leading-snug"><span className="font-bold">Impulses:</span> {card.impulses}</p></div>}
                    {card.difficulty !== undefined && (
                        <div className="mx-4 mb-2 border border-card-border/70 rounded-lg px-3 py-1.5">
                            <p className="text-[11px] text-card-text"><span className="font-bold">Difficulty:</span> {card.difficulty}</p>
                        </div>
                    )}
                    {(card.features ?? []).length > 0 && (
                        <div className="px-4 pb-3">
                            <p className="text-card-text font-black text-[10px] uppercase tracking-widest mb-1.5">Features</p>
                            <div className="flex flex-col gap-1.5">
                                {(['action', 'passive', 'fear'] as EnvironmentFeatureType[]).map((ftype) => {
                                    const group = (card.features ?? []).filter((f) => f.type === ftype)
                                    if (group.length === 0) return null
                                    const s = ENV_PREVIEW_STYLES[ftype]
                                    return group.map((f) => (
                                        <div key={f.id} className={`text-[11px] leading-snug text-card-text pl-2.5 border-l-2 ${s.border}`}>
                                            <span className={`font-black italic ${s.text}`}>{f.name}</span>{' — '}
                                            <span className={`font-bold italic ${s.text}`}>{s.icon} {s.label}:</span>{' '}
                                            <span className="text-card-text/85">{renderBold(f.description)}</span>
                                            {!!f.fearCost && f.fearCost > 0 && <span className="ml-1 text-purple-700 text-[9px] font-black">💀 {f.fearCost}</span>}
                                        </div>
                                    ))
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}

            {card.type === 'adversary' && (
                <>
                    {card.description && <div className="px-4 pb-1"><p className="text-card-text/80 text-[11px] italic leading-snug line-clamp-3">{renderBold(card.description)}</p></div>}
                    <div className="mx-4 mb-2 border border-card-border/70 rounded-lg px-3 py-2 grid grid-cols-3 gap-x-3 gap-y-1">
                        <p className="text-[11px] text-card-text"><span className="font-bold">DC:</span> {card.difficulty}</p>
                        <p className="text-[11px] text-card-text"><span className="font-bold">HP:</span> {card.hp.max}</p>
                        <p className="text-[11px] text-card-text"><span className="font-bold">Stress:</span> {card.stress.max}</p>
                        <p className="text-[11px] text-green-700"><span className="font-bold">Minor</span> &lt;{card.thresholds.minor}</p>
                        <p className="text-[11px] text-amber-700"><span className="font-bold">Major</span> {card.thresholds.minor}–{card.thresholds.severe - 1}</p>
                        <p className="text-[11px] text-red-700"><span className="font-bold">Severe</span> {card.thresholds.severe}+</p>
                        {(card.attackModifier || card.attackName || card.attackDamage) && (
                            <p className="text-[11px] text-card-text col-span-3">
                                <span className="font-bold text-red-700">ATK:</span>{' '}
                                {[card.attackModifier, [card.attackName, card.attackDistance].filter(Boolean).join(' · ') || null, [card.attackDamage, card.attackDamageType === 'physical' ? 'phys' : card.attackDamageType === 'magical' ? 'magic' : null].filter(Boolean).join(' ') || null].filter(Boolean).join(' | ')}
                            </p>
                        )}
                    </div>
                    {(card.abilities ?? []).length > 0 && (
                        <div className="px-4 pb-3">
                            <p className="text-card-text font-black text-[10px] uppercase tracking-widest mb-1.5">Abilities</p>
                            <div className="flex flex-col gap-1.5">
                                {(['action', 'reaction', 'fear'] as AbilityType[]).map((atype) => {
                                    const group = (card.abilities ?? []).filter((a) => a.type === atype)
                                    if (group.length === 0) return null
                                    const s = ADV_PREVIEW_STYLES[atype]
                                    return group.map((a) => (
                                        <div key={a.id} className={`text-[11px] leading-snug text-card-text pl-2.5 border-l-2 ${s.border}`}>
                                            <span className={`font-black italic ${s.text}`}>{a.name}</span>{' — '}
                                            <span className={`font-bold italic ${s.text}`}>{s.icon} {s.label}:</span>{' '}
                                            <span className="text-card-text/85">{renderBold(a.description)}</span>
                                            {!!a.fearCost && a.fearCost > 0 && <span className="ml-1 text-purple-700 text-[9px] font-black">💀 {a.fearCost}</span>}
                                        </div>
                                    ))
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

// --- JSON import helpers ---

function parseFeatureLabel(label: string): { name: string; rawType: string } {
    const sepIdx = label.lastIndexOf(' - ')
    if (sepIdx < 0) return { name: label, rawType: '' }
    return { name: label.slice(0, sepIdx), rawType: label.slice(sepIdx + 3).trim().toLowerCase() }
}

function isFearSpend(text: string): boolean {
    const clean = text.replace(/\*\*/g, '')
    return /spend\s+(?:a|\d+)?\s*fear/i.test(clean)
}


function mapAdversaryItem(item: Record<string, unknown>): AdversaryCard | null {
    const title = (item.name as string | undefined)?.trim() || ''
    if (!title) return null

    const atk = typeof item.standardAttack === 'object' && item.standardAttack !== null
        ? (item.standardAttack as Record<string, unknown>)
        : null

    const atkName = ((atk?.name ?? item.standardAttackName ?? '') as string) || undefined
    const atkDamage = ((atk?.damage ?? item.standardAttackDamage ?? '') as string) || undefined
    const atkDistance = ((atk?.distance ?? item.standardAttackDistance ?? '') as string) || undefined
    const rawDmgType = ((atk?.damageType ?? item.standardAttackDamageType ?? '') as string).toLowerCase()
    const atkDmgType: 'physical' | 'magical' | undefined =
        rawDmgType.startsWith('phy') ? 'physical' :
        rawDmgType.startsWith('mag') ? 'magical' :
        undefined

    const atkModNum = item.attackModifier as number | undefined
    const atkModStr = atkModNum !== undefined
        ? (atkModNum >= 0 ? `+${atkModNum}` : String(atkModNum))
        : undefined

    const expArr = item.experience as Array<{ name: string; modifier: number }> | undefined
    const experience = expArr?.length
        ? expArr.map((e) => `${e.name} ${e.modifier >= 0 ? '+' : ''}${e.modifier}`).join(', ')
        : undefined

    const rawFeatures = (item.features as Array<{ label: string; description: string }> | undefined) ?? []
    const abilities: AdversaryAbility[] = rawFeatures.map((f) => {
        const { name, rawType } = parseFeatureLabel(f.label)
        const type: AbilityType =
            rawType === 'reaction' ? 'reaction' :
            (rawType === 'fear' || isFearSpend(f.label) || isFearSpend(f.description)) ? 'fear' :
            'action'
        return { id: crypto.randomUUID(), type, name, description: f.description }
    })

    return {
        id: crypto.randomUUID(),
        type: 'adversary',
        title,
        description: (item.description as string | undefined) || '',
        motives: ((item.motivesAndTactics ?? item.motives ?? item.motive) as string | undefined) || undefined,
        tactics: (item.tactics as string | undefined) || undefined,
        role: (item.type as string | undefined) || 'Standard',
        tier: ((item.tier as number | undefined) || 1) as 1 | 2 | 3 | 4,
        difficulty: (item.difficulty as number | undefined) ?? 10,
        hp: { max: (item.hp as number | undefined) ?? 0 },
        stress: { max: (item.stress as number | undefined) ?? 0 },
        thresholds: {
            minor: (item.minorThreshold as number | undefined) ?? 0,
            severe: (item.majorThreshold as number | undefined) ?? 0,
        },
        attackModifier: atkModStr,
        attackName: atkName,
        attackDistance: atkDistance,
        attackDamage: atkDamage,
        attackDamageType: atkDmgType,
        experience,
        abilities,
        tags: [],
    }
}

function mapEnvironmentItem(item: Record<string, unknown>): EnvironmentCard | null {
    const title = (item.name as string | undefined)?.trim() || ''
    if (!title) return null

    const rawFeatures = (item.features as Array<{ label: string; description: string }> | undefined) ?? []
    const features: EnvironmentFeature[] = rawFeatures.map((f) => {
        const { name, rawType } = parseFeatureLabel(f.label)
        const type: EnvironmentFeatureType =
            rawType === 'passive' ? 'passive' :
            (rawType === 'fear' || isFearSpend(f.label) || isFearSpend(f.description)) ? 'fear' :
            'action'
        return { id: crypto.randomUUID(), type, name, description: f.description }
    })

    const rawDiff = item.difficulty
    const difficulty = rawDiff !== undefined && rawDiff !== null && rawDiff !== ''
        ? parseInt(String(rawDiff), 10)
        : undefined

    return {
        id: crypto.randomUUID(),
        type: 'environment',
        title,
        description: (item.description as string | undefined) || '',
        category: (item.type as string | undefined) || 'Exploration',
        tier: ((item.tier as number | undefined) || 1) as 1 | 2 | 3 | 4,
        impulses: (item.impulses as string | undefined) || undefined,
        difficulty: Number.isNaN(difficulty) ? undefined : difficulty,
        features,
        tags: [],
    }
}

// --- end import helpers ---

function EnvironmentCards() {
    const { cards, addEnvironmentCard, addAdversaryCard, bulkAddCards, removeCard, updateCard } = useCardsStore()
    const { campaigns, currentCampaignId, currentSessionId, addCardToSession, removeCardFromSession } = useCampaignStore()

    const [activeTab, setActiveTab] = useState<Tab>('environment')
    const [editingCardId, setEditingCardId] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [tierFilter, setTierFilter] = useState('')
    const [envSceneSelect, setEnvSceneSelect] = useState<Record<string, string>>({})
    const [importStatus, setImportStatus] = useState<string | null>(null)

    async function handleImportJson() {
        const result = await window.electron.dialog.open({
            filters: [{ name: 'JSON', extensions: ['json'] }],
            properties: ['openFile'],
        })
        if (result.canceled || result.filePaths.length === 0) return

        const raw = await window.electron.fs.readFile(result.filePaths[0])
        if (!raw) { setImportStatus('Could not read file.'); return }

        let data: Record<string, unknown>[]
        try {
            const parsed = JSON.parse(raw)
            if (!Array.isArray(parsed) || parsed.length === 0) throw new Error()
            data = parsed as Record<string, unknown>[]
        } catch {
            setImportStatus('Invalid JSON — expected a non-empty array.')
            setTimeout(() => setImportStatus(null), 4000)
            return
        }

        const first = data[0]
        const isAdversary = 'standardAttack' in first || 'minorThreshold' in first || 'majorThreshold' in first

        const existingTitles = new Set(
            cards
                .filter((c) => c.type === (isAdversary ? 'adversary' : 'environment'))
                .map((c) => c.title.toLowerCase())
        )

        const toAdd: Card[] = []
        for (const item of data) {
            const card = isAdversary ? mapAdversaryItem(item) : mapEnvironmentItem(item)
            if (!card || existingTitles.has(card.title.toLowerCase())) continue
            toAdd.push(card)
        }

        if (toAdd.length > 0) {
            bulkAddCards(toAdd)
            setActiveTab(isAdversary ? 'adversary' : 'environment')
        }

        const skipped = data.length - toAdd.length
        const label = isAdversary ? 'adversaries' : 'environments'
        setImportStatus(
            `Imported ${toAdd.length} ${label}${skipped > 0 ? ` (${skipped} skipped — already exist)` : ''}.`
        )
        setTimeout(() => setImportStatus(null), 5000)
    }

    useEffect(() => {
        setSearch('')
        setTypeFilter('')
        setTierFilter('')
    }, [activeTab])

    const filteredCards = useMemo(() => {
        return cards.filter((c) => {
            if (c.type !== activeTab) return false
            if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false
            if (tierFilter && String(c.tier ?? 1) !== tierFilter) return false
            if (typeFilter) {
                if (c.type === 'environment' && c.category !== typeFilter) return false
                if (c.type === 'adversary' && c.role !== typeFilter) return false
            }
            return true
        })
    }, [cards, activeTab, search, typeFilter, tierFilter])

    const currentCampaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const currentSession = currentCampaign?.sessions.find((s) => s.id === currentSessionId) ?? null
    const hasActiveSession = !!currentCampaignId && !!currentSessionId

    const sessionScenes = useMemo(
        () => currentCampaign?.scenes.filter((s) => currentSession?.sceneIds.includes(s.id)) ?? [],
        [currentCampaign?.scenes, currentSession?.sceneIds]
    )

    const editingCard = editingCardId ? (cards.find((c) => c.id === editingCardId) ?? null) : null

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
        addCardToSession(currentCampaignId, currentSessionId, {
            instanceId: crypto.randomUUID(),
            cardId,
            hpCurrent: 0,
            stressCurrent: 0,
        } as SessionCardInstance)
    }

    function handleRemoveFromSession(cardId: string) {
        if (!currentCampaignId || !currentSessionId) return
        const instance = currentSession?.cardInstances.find((i) => i.cardId === cardId)
        if (!instance) return
        removeCardFromSession(currentCampaignId, currentSessionId, instance.instanceId)
    }

    function handleAddEnvToSection(cardId: string, sceneId?: string) {
        if (!currentCampaignId || !currentSessionId) return
        addCardToSession(currentCampaignId, currentSessionId, {
            instanceId: crypto.randomUUID(),
            cardId,
            hpCurrent: 0,
            stressCurrent: 0,
            sceneId,
        })
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
        setEditingCardId(newCard.id)
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
        setEditingCardId(newCard.id)
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

            <div className="flex items-center gap-2 flex-wrap">
                <Button variant="primary" onClick={activeTab === 'environment' ? handleAddEnvCard : handleAddAdversary}>
                    + Add {activeTab === 'environment' ? 'Environment Card' : 'Adversary'}
                </Button>
                <Button variant="secondary" onClick={handleImportJson}>
                    Import from JSON
                </Button>
                {importStatus && (
                    <span className="text-xs text-ui-muted bg-ui-surface border border-ui-surface2 px-3 py-1.5 rounded-lg">
                        {importStatus}
                    </span>
                )}
                <Input
                    theme="fear"
                    type="text"
                    placeholder="Search by name…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 min-w-[160px]"
                />
                <Select theme="fear" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: 'auto' }}>
                    <option value="">All {activeTab === 'environment' ? 'Categories' : 'Roles'}</option>
                    {activeTab === 'environment' ? (
                        <>
                            <option value="Exploration">Exploration</option>
                            <option value="Social">Social</option>
                            <option value="Traversal">Traversal</option>
                            <option value="Event">Event</option>
                        </>
                    ) : (
                        <>
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
                        </>
                    )}
                </Select>
                <Select theme="fear" value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} style={{ width: 'auto' }}>
                    <option value="">All Tiers</option>
                    <option value="1">Tier 1</option>
                    <option value="2">Tier 2</option>
                    <option value="3">Tier 3</option>
                    <option value="4">Tier 4</option>
                </Select>
            </div>

            {/* Card grid */}
            <div className="grid grid-cols-2 gap-3">
                {filteredCards.length === 0 && (
                    <p className="col-span-2 text-ui-muted text-sm text-center py-8">No {activeTab} cards yet.</p>
                )}

                {filteredCards.map((card) => {
                    const inSession = isInSession(card.id)
                    return (
                        <div key={card.id} className="bg-card-bg rounded-xl border border-card-border overflow-hidden flex flex-col">

                            {/* Header */}
                            <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-card-text font-display text-sm font-black uppercase tracking-wide leading-tight">{card.title}</h3>
                                    <p className="text-card-text/60 text-[11px] italic mt-0.5">
                                        {[card.tier ? `Tier ${card.tier}` : null, card.type === 'environment' ? card.category : (card as AdversaryCard).role].filter(Boolean).join(' · ')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    {hasActiveSession && card.type === 'environment' && (
                                        <div className="flex items-center gap-1">
                                            {!inSession && sessionScenes.length > 0 && (
                                                <Select
                                                    theme="fear"
                                                    value={envSceneSelect[card.id] ?? ''}
                                                    onChange={(e) => setEnvSceneSelect((prev) => ({ ...prev, [card.id]: e.target.value }))}
                                                    style={{ width: 'auto' }}
                                                >
                                                    <option value="">Session</option>
                                                    {sessionScenes.map((scene) => (
                                                        <option key={scene.id} value={scene.id}>{scene.title}</option>
                                                    ))}
                                                </Select>
                                            )}
                                            <button
                                                onClick={() => inSession
                                                    ? handleRemoveFromSession(card.id)
                                                    : handleAddEnvToSection(card.id, envSceneSelect[card.id] || undefined)
                                                }
                                                className={`text-[10px] px-2 py-1 rounded-lg transition-colors font-semibold ${
                                                    inSession
                                                        ? 'bg-hope-primary text-white'
                                                        : 'bg-card-border/40 hover:bg-hope-primary/20 text-card-text/60 hover:text-card-text border border-card-border/60'
                                                }`}
                                            >
                                                {inSession ? 'In Session' : '+ Add'}
                                            </button>
                                        </div>
                                    )}
                                    {hasActiveSession && card.type === 'adversary' && (
                                        <div className="flex items-center gap-1">
                                            {instanceCount(card.id) > 0 && (
                                                <>
                                                    <span className="text-[10px] text-card-text/50">{instanceCount(card.id)}×</span>
                                                    <button onClick={() => handleRemoveFromSession(card.id)} className="w-5 h-5 bg-card-border/30 hover:bg-red-200/60 text-card-text/50 hover:text-red-700 rounded text-[10px] transition-colors">−</button>
                                                </>
                                            )}
                                            <button onClick={() => handleAddToSession(card.id, card.type)} className="text-[10px] px-2 py-1 rounded-lg bg-card-border/40 hover:bg-hope-primary/20 text-card-text/60 hover:text-card-text border border-card-border/60 font-semibold transition-colors">+ Add</button>
                                        </div>
                                    )}
                                    <button onClick={() => setEditingCardId(card.id)} className="text-[11px] text-card-text/40 hover:text-card-text font-bold transition-colors px-1.5 py-1 rounded hover:bg-card-border/30" title="Edit card">✎</button>
                                    <button onClick={() => removeCard(card.id)} className="text-[11px] text-card-text/30 hover:text-red-600 transition-colors font-bold px-1 py-1 rounded hover:bg-red-100/40">✕</button>
                                </div>
                            </div>

                            {/* Always-visible mini detail */}
                            {card.type === 'environment' && (
                                <>
                                    {card.description && <div className="px-4 pb-1"><p className="text-card-text/80 text-[11px] italic leading-snug line-clamp-2">{renderBold(card.description)}</p></div>}
                                    {card.impulses && <div className="px-4 pb-1"><p className="text-card-text/85 text-[11px] leading-snug"><span className="font-bold">Impulses:</span> {card.impulses}</p></div>}
                                    {card.difficulty !== undefined && (
                                        <div className="mx-4 mb-2 border border-card-border/70 rounded-lg px-3 py-1.5">
                                            <p className="text-[11px] text-card-text"><span className="font-bold">Difficulty:</span> {card.difficulty}</p>
                                        </div>
                                    )}
                                    {(card.features ?? []).length > 0 && (
                                        <div className="px-4 pb-3">
                                            <p className="text-card-text font-black text-[10px] uppercase tracking-widest mb-1.5">Features</p>
                                            <div className="flex flex-col gap-1.5">
                                                {(['action', 'passive', 'fear'] as EnvironmentFeatureType[]).map((ftype) => {
                                                    const group = (card.features ?? []).filter((f) => f.type === ftype)
                                                    if (group.length === 0) return null
                                                    const s = ENV_PREVIEW_STYLES[ftype]
                                                    return group.map((f) => (
                                                        <div key={f.id} className={`text-[11px] leading-snug text-card-text pl-2.5 border-l-2 ${s.border}`}>
                                                            <span className={`font-black italic ${s.text}`}>{f.name}</span>{' — '}
                                                            <span className={`font-bold italic ${s.text}`}>{s.icon} {s.label}:</span>{' '}
                                                            <span className="text-card-text/85">{renderBold(f.description)}</span>
                                                            {!!f.fearCost && f.fearCost > 0 && <span className="ml-1 text-purple-700 text-[9px] font-black">💀 {f.fearCost}</span>}
                                                        </div>
                                                    ))
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {card.type === 'adversary' && (
                                <>
                                    {card.description && <div className="px-4 pb-1"><p className="text-card-text/80 text-[11px] italic leading-snug line-clamp-2">{renderBold(card.description)}</p></div>}
                                    <div className="mx-4 mb-2 border border-card-border/70 rounded-lg px-3 py-2 grid grid-cols-3 gap-x-4 gap-y-1">
                                        <p className="text-[11px] text-card-text"><span className="font-bold">DC:</span> {card.difficulty}</p>
                                        <p className="text-[11px] text-card-text"><span className="font-bold">HP:</span> {card.hp.max}</p>
                                        <p className="text-[11px] text-card-text"><span className="font-bold">Stress:</span> {card.stress.max}</p>
                                        <p className="text-[11px] text-green-700"><span className="font-bold">Minor</span> &lt;{card.thresholds.minor}</p>
                                        <p className="text-[11px] text-amber-700"><span className="font-bold">Major</span> {card.thresholds.minor}–{card.thresholds.severe - 1}</p>
                                        <p className="text-[11px] text-red-700"><span className="font-bold">Severe</span> {card.thresholds.severe}+</p>
                                        {(card.attackModifier || card.attackName || card.attackDamage) && (
                                            <p className="text-[11px] text-card-text col-span-3">
                                                <span className="font-bold text-red-700">ATK:</span>{' '}
                                                {[card.attackModifier, [card.attackName, card.attackDistance].filter(Boolean).join(' · ') || null, [card.attackDamage, card.attackDamageType === 'physical' ? 'phys' : card.attackDamageType === 'magical' ? 'magic' : null].filter(Boolean).join(' ') || null].filter(Boolean).join(' | ')}
                                            </p>
                                        )}
                                    </div>
                                    {(card.abilities ?? []).length > 0 && (
                                        <div className="px-4 pb-3">
                                            <p className="text-card-text font-black text-[10px] uppercase tracking-widest mb-1.5">Abilities</p>
                                            <div className="flex flex-col gap-1.5">
                                                {(['action', 'reaction', 'fear'] as AbilityType[]).map((atype) => {
                                                    const group = ((card as AdversaryCard).abilities ?? []).filter((a) => a.type === atype)
                                                    if (group.length === 0) return null
                                                    const s = ADV_PREVIEW_STYLES[atype]
                                                    return group.map((a) => (
                                                        <div key={a.id} className={`text-[11px] leading-snug text-card-text pl-2.5 border-l-2 ${s.border}`}>
                                                            <span className={`font-black italic ${s.text}`}>{a.name}</span>{' — '}
                                                            <span className={`font-bold italic ${s.text}`}>{s.icon} {s.label}:</span>{' '}
                                                            <span className="text-card-text/85">{renderBold(a.description)}</span>
                                                            {!!a.fearCost && a.fearCost > 0 && <span className="ml-1 text-purple-700 text-[9px] font-black">💀 {a.fearCost}</span>}
                                                        </div>
                                                    ))
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                        </div>
                    )
                })}
            </div>

            {/* Edit modal */}
            {editingCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ui-bg/80 backdrop-blur-sm">
                    <div className="bg-ui-surface w-full max-w-5xl rounded-2xl border border-ui-surface2 shadow-2xl flex flex-col max-h-[90vh]">

                        <div className="flex items-center justify-between px-6 py-4 border-b border-ui-surface2 shrink-0">
                            <h2 className="text-ui-text font-display font-semibold">Edit Card</h2>
                            <button onClick={() => setEditingCardId(null)} className="text-ui-muted hover:text-ui-text transition-colors text-xl font-bold">✕</button>
                        </div>

                        <div className="flex-1 overflow-hidden flex min-h-0">

                            {/* Left: live preview */}
                            <div className="w-72 shrink-0 overflow-y-auto border-r border-ui-surface2 p-4 bg-ui-bg/30">
                                <p className="text-ui-muted text-[10px] uppercase font-bold tracking-widest mb-3">Preview</p>
                                <CardPreview card={editingCard} />
                            </div>

                            {/* Right: edit form */}
                            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="flex flex-col gap-1 col-span-1">
                                        <label className="text-ui-muted text-xs">Title</label>
                                        <Input theme="fear" type="text" value={editingCard.title} onChange={(e) => updateCard(editingCard.id, { title: e.target.value })} />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-ui-muted text-xs">Tier</label>
                                        <Select theme="fear" value={editingCard.tier || 1} onChange={(e) => updateCard(editingCard.id, { tier: +e.target.value as 1|2|3|4 })}>
                                            <option value={1}>Tier 1</option>
                                            <option value={2}>Tier 2</option>
                                            <option value={3}>Tier 3</option>
                                            <option value={4}>Tier 4</option>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-ui-muted text-xs">{editingCard.type === 'environment' ? 'Category' : 'Role'}</label>
                                        {editingCard.type === 'environment' ? (
                                            <Select theme="fear" value={editingCard.category || 'Exploration'} onChange={(e) => updateCard(editingCard.id, { category: e.target.value })}>
                                                <option value="Exploration">Exploration</option>
                                                <option value="Social">Social</option>
                                                <option value="Traversal">Traversal</option>
                                                <option value="Event">Event</option>
                                            </Select>
                                        ) : (
                                            <Select theme="fear" value={(editingCard as AdversaryCard).role || 'Standard'} onChange={(e) => updateCard(editingCard.id, { role: e.target.value })}>
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
                                            </Select>
                                        )}
                                    </div>
                                </div>

                                {editingCard.type === 'environment' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-ui-muted text-xs">Description</label>
                                                <Textarea theme="fear" value={editingCard.description} onChange={(e) => updateCard(editingCard.id, { description: e.target.value })} rows={3} placeholder="What this environment is…" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-ui-muted text-xs">Impulses</label>
                                                <Textarea theme="fear" value={editingCard.impulses ?? ''} onChange={(e) => updateCard(editingCard.id, { impulses: e.target.value } as Partial<Card>)} rows={3} placeholder="What drives this place…" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 w-32">
                                            <label className="text-ui-muted text-xs">Difficulty</label>
                                            <Input theme="fear" type="number" value={editingCard.difficulty ?? ''} onChange={(e) => updateCard(editingCard.id, { difficulty: e.target.value ? +e.target.value : undefined } as Partial<Card>)} placeholder="10" />
                                        </div>

                                        <div className="flex flex-col gap-2.5">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <label className="text-ui-muted text-[10px] uppercase font-bold tracking-wider">Features</label>
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {(['action', 'passive', 'fear'] as EnvironmentFeatureType[]).map((type) => {
                                                        const cfg = FEATURE_CONFIG[type]
                                                        return (
                                                            <button
                                                                key={type}
                                                                onClick={() => {
                                                                    const newFeature: EnvironmentFeature = { id: crypto.randomUUID(), type, name: '', description: '' }
                                                                    const prev = (editingCard as EnvironmentCard).features ?? []
                                                                    updateCard(editingCard.id, { features: [...prev, newFeature] } as Partial<Card>)
                                                                }}
                                                                className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold uppercase tracking-wide transition-colors ${cfg.btnBg}`}
                                                            >
                                                                {cfg.icon} {cfg.label}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                            {((editingCard as EnvironmentCard).features ?? []).length === 0 && (
                                                <p className="text-ui-muted text-xs italic px-1">No features yet.</p>
                                            )}
                                            {((editingCard as EnvironmentCard).features ?? []).map((feature) => {
                                                const cfg = FEATURE_CONFIG[feature.type]
                                                return (
                                                    <div key={feature.id} className={`rounded-xl border p-3 flex flex-col gap-2 ${cfg.bg} ${cfg.border}`}>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-black uppercase tracking-widest shrink-0 ${cfg.text}`}>{cfg.icon} {cfg.label}</span>
                                                            <Input
                                                                theme="fear"
                                                                type="text"
                                                                value={feature.name}
                                                                onChange={(e) => {
                                                                    const updated = ((editingCard as EnvironmentCard).features ?? []).map((f) => f.id === feature.id ? { ...f, name: e.target.value } : f)
                                                                    updateCard(editingCard.id, { features: updated } as Partial<Card>)
                                                                }}
                                                                placeholder="Feature name…"
                                                                className="flex-1"
                                                            />
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <span className="text-[9px] text-purple-300 font-bold">💀</span>
                                                                <Input
                                                                    theme="fear"
                                                                    type="number"
                                                                    value={feature.fearCost ?? ''}
                                                                    onChange={(e) => {
                                                                        const updated = ((editingCard as EnvironmentCard).features ?? []).map((f) => f.id === feature.id ? { ...f, fearCost: e.target.value ? +e.target.value : undefined } : f)
                                                                        updateCard(editingCard.id, { features: updated } as Partial<Card>)
                                                                    }}
                                                                    placeholder="0"
                                                                    className="w-14"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const updated = ((editingCard as EnvironmentCard).features ?? []).filter((f) => f.id !== feature.id)
                                                                    updateCard(editingCard.id, { features: updated } as Partial<Card>)
                                                                }}
                                                                className="text-ui-muted hover:text-red-400 transition-colors w-6 h-6 flex items-center justify-center rounded text-sm font-bold hover:bg-red-500/10 shrink-0"
                                                            >✕</button>
                                                        </div>
                                                        <Textarea
                                                            theme="fear"
                                                            value={feature.description}
                                                            onChange={(e) => {
                                                                const updated = ((editingCard as EnvironmentCard).features ?? []).map((f) => f.id === feature.id ? { ...f, description: e.target.value } : f)
                                                                updateCard(editingCard.id, { features: updated } as Partial<Card>)
                                                            }}
                                                            rows={2}
                                                            placeholder="What this feature does…"
                                                        />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </>
                                )}

                                {editingCard.type === 'adversary' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-ui-muted text-xs">Description</label>
                                                <Textarea theme="fear" value={editingCard.description} onChange={(e) => updateCard(editingCard.id, { description: e.target.value })} rows={3} placeholder="What this adversary is…" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-ui-muted text-xs">Motives</label>
                                                <Textarea theme="fear" value={editingCard.motives ?? ''} onChange={(e) => updateCard(editingCard.id, { motives: e.target.value })} rows={3} placeholder="What it wants…" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-ui-muted text-xs">Tactics</label>
                                            <Textarea theme="fear" value={editingCard.tactics ?? ''} onChange={(e) => updateCard(editingCard.id, { tactics: e.target.value })} rows={2} placeholder="How it fights…" />
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-ui-muted text-xs">Difficulty</label>
                                                <Input theme="fear" type="number" value={editingCard.difficulty} onChange={(e) => updateCard(editingCard.id, { difficulty: +e.target.value })} />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-ui-muted text-xs">HP Max</label>
                                                <Input theme="fear" type="number" value={editingCard.hp.max} onChange={(e) => updateCard(editingCard.id, { hp: { max: +e.target.value } })} />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-ui-muted text-xs">Stress Max</label>
                                                <Input theme="fear" type="number" value={editingCard.stress.max} onChange={(e) => updateCard(editingCard.id, { stress: { max: +e.target.value } })} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-ui-muted text-xs">Minor Threshold (&lt;X)</label>
                                                <Input theme="fear" type="number" value={editingCard.thresholds.minor} onChange={(e) => updateCard(editingCard.id, { thresholds: { ...editingCard.thresholds, minor: +e.target.value } })} />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-ui-muted text-xs">Severe Threshold (X+)</label>
                                                <Input theme="fear" type="number" value={editingCard.thresholds.severe} onChange={(e) => updateCard(editingCard.id, { thresholds: { ...editingCard.thresholds, severe: +e.target.value } })} />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 pt-1 border-t border-ui-surface2">
                                            <label className="text-ui-muted text-[10px] uppercase font-bold tracking-wider pt-2">Attack</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-ui-muted text-xs">Modifier</label>
                                                    <Input theme="fear" type="text" value={editingCard.attackModifier ?? ''} onChange={(e) => updateCard(editingCard.id, { attackModifier: e.target.value } as Partial<Card>)} placeholder="+4" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-ui-muted text-xs">Name</label>
                                                    <Input theme="fear" type="text" value={editingCard.attackName ?? ''} onChange={(e) => updateCard(editingCard.id, { attackName: e.target.value } as Partial<Card>)} placeholder="Slash" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-ui-muted text-xs">Distance</label>
                                                    <Select theme="fear" value={editingCard.attackDistance ?? ''} onChange={(e) => updateCard(editingCard.id, { attackDistance: e.target.value } as Partial<Card>)}>
                                                        <option value="">— None —</option>
                                                        <option value="Melee">Melee</option>
                                                        <option value="Very Close">Very Close</option>
                                                        <option value="Close">Close</option>
                                                        <option value="Far">Far</option>
                                                        <option value="Very Far">Very Far</option>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="flex flex-col gap-1 col-span-2">
                                                    <label className="text-ui-muted text-xs">Damage</label>
                                                    <Input theme="fear" type="text" value={editingCard.attackDamage ?? ''} onChange={(e) => updateCard(editingCard.id, { attackDamage: e.target.value } as Partial<Card>)} placeholder="2d10+4" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-ui-muted text-xs">Type</label>
                                                    <Select theme="fear" value={editingCard.attackDamageType ?? ''} onChange={(e) => updateCard(editingCard.id, { attackDamageType: e.target.value as 'physical' | 'magical' } as Partial<Card>)}>
                                                        <option value="">— None —</option>
                                                        <option value="physical">Physical</option>
                                                        <option value="magical">Magical</option>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-ui-muted text-xs">Experience</label>
                                            <Input theme="fear" type="text" value={editingCard.experience ?? ''} onChange={(e) => updateCard(editingCard.id, { experience: e.target.value })} placeholder="Tremor Sense +2" />
                                        </div>

                                        <div className="flex flex-col gap-2.5">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <label className="text-ui-muted text-[10px] uppercase font-bold tracking-wider">Abilities</label>
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {(['action', 'reaction', 'fear'] as AbilityType[]).map((type) => {
                                                        const cfg = ABILITY_CONFIG[type]
                                                        return (
                                                            <button
                                                                key={type}
                                                                onClick={() => {
                                                                    const newAbility: AdversaryAbility = { id: crypto.randomUUID(), type, name: '', description: '' }
                                                                    const prev = (editingCard as AdversaryCard).abilities ?? []
                                                                    updateCard(editingCard.id, { abilities: [...prev, newAbility] } as Partial<Card>)
                                                                }}
                                                                className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold uppercase tracking-wide transition-colors ${cfg.btnBg}`}
                                                            >
                                                                {cfg.icon} {cfg.label}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                            {((editingCard as AdversaryCard).abilities ?? []).length === 0 && (
                                                <p className="text-ui-muted text-xs italic px-1">No abilities yet.</p>
                                            )}
                                            {((editingCard as AdversaryCard).abilities ?? []).map((ability) => {
                                                const cfg = ABILITY_CONFIG[ability.type]
                                                return (
                                                    <div key={ability.id} className={`rounded-xl border p-3 flex flex-col gap-2 ${cfg.bg} ${cfg.border}`}>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-black uppercase tracking-widest shrink-0 ${cfg.text}`}>{cfg.icon} {cfg.label}</span>
                                                            <Input
                                                                theme="fear"
                                                                type="text"
                                                                value={ability.name}
                                                                onChange={(e) => {
                                                                    const updated = ((editingCard as AdversaryCard).abilities ?? []).map((a) => a.id === ability.id ? { ...a, name: e.target.value } : a)
                                                                    updateCard(editingCard.id, { abilities: updated } as Partial<Card>)
                                                                }}
                                                                placeholder="Ability name…"
                                                                className="flex-1"
                                                            />
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <span className="text-[9px] text-purple-300 font-bold">💀</span>
                                                                <Input
                                                                    theme="fear"
                                                                    type="number"
                                                                    value={ability.fearCost ?? ''}
                                                                    onChange={(e) => {
                                                                        const updated = ((editingCard as AdversaryCard).abilities ?? []).map((a) => a.id === ability.id ? { ...a, fearCost: e.target.value ? +e.target.value : undefined } : a)
                                                                        updateCard(editingCard.id, { abilities: updated } as Partial<Card>)
                                                                    }}
                                                                    placeholder="0"
                                                                    className="w-14"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const updated = ((editingCard as AdversaryCard).abilities ?? []).filter((a) => a.id !== ability.id)
                                                                    updateCard(editingCard.id, { abilities: updated } as Partial<Card>)
                                                                }}
                                                                className="text-ui-muted hover:text-red-400 transition-colors w-6 h-6 flex items-center justify-center rounded text-sm font-bold hover:bg-red-500/10 shrink-0"
                                                            >✕</button>
                                                        </div>
                                                        <Textarea
                                                            theme="fear"
                                                            value={ability.description}
                                                            onChange={(e) => {
                                                                const updated = ((editingCard as AdversaryCard).abilities ?? []).map((a) => a.id === ability.id ? { ...a, description: e.target.value } : a)
                                                                updateCard(editingCard.id, { abilities: updated } as Partial<Card>)
                                                            }}
                                                            rows={2}
                                                            placeholder="What this ability does…"
                                                        />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </>
                                )}

                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-ui-surface2 flex justify-between items-center shrink-0 bg-ui-surface/50 rounded-b-2xl">
                            <button
                                onClick={() => { removeCard(editingCard.id); setEditingCardId(null) }}
                                className="px-4 py-2 text-sm bg-red-900/40 hover:bg-red-900/60 text-red-300 rounded-lg transition-colors font-medium border border-red-800/40"
                            >
                                Delete Card
                            </button>
                            <button
                                onClick={() => setEditingCardId(null)}
                                className="px-6 py-2 text-sm bg-hope-primary hover:bg-hope-gold text-white rounded-lg transition-colors font-medium"
                            >
                                Done
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    )
}

export default EnvironmentCards
