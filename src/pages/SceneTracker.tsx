import { useState, useMemo, type ReactNode } from 'react'
import { useCampaignStore } from '../store/campaignStore'
import { useFearStore } from '../store/fearStore'
import type { Scene, SceneFlagType, SessionItem, SessionItemKind } from '../types'
import { SharedMarkdown } from '../components/SharedMarkdown'
import { Button, Input, Select, Textarea } from '../components/ui'
import { BoltIcon, ClockIcon, ScalesIcon } from '../components/icons'
import { useT } from '../i18n'
import { CountdownControls } from '../components/scenes/CountdownControls'
import { groupSessionItems } from '../components/session/groupSessionItems'
import SessionItemSections from '../components/session/SessionItemSections'
import SessionItemModal from '../components/session/SessionItemModal'
import { KIND_CONFIG } from '../components/session/SessionItemRow'
import { useLaunchEncounter } from '../hooks/useLaunchEncounter'

const STATUS_ORDER: Record<Scene['status'], number> = { active: 0, upcoming: 1, completed: 2 }

const FLAG_CONFIG: Record<SceneFlagType, { icon: ReactNode; bg: string; border: string; text: string; activeBg: string; label: string; placeholder: string }> = {
    event: { icon: <BoltIcon className="w-4 h-4" />, bg: 'bg-hope-primary/10', border: 'border-hope-primary/25', text: 'text-hope-primary', activeBg: 'bg-hope-primary/20 border-hope-primary/50', label: 'scenes.flagTypeEvent', placeholder: 'scenes.flagPlaceholderEvent' },
    fear: { icon: <BoltIcon className="w-4 h-4" />, bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-700', activeBg: 'bg-purple-500/20 border-purple-500/50', label: 'scenes.flagTypeFear', placeholder: 'scenes.flagPlaceholderFear' },
    time: { icon: <ClockIcon className="w-4 h-4" />, bg: 'bg-amber-500/10', border: 'border-amber-400/30', text: 'text-amber-700', activeBg: 'bg-amber-500/20 border-amber-400/50', label: 'scenes.flagTypeTime', placeholder: 'scenes.flagPlaceholderTime' },
    decision: { icon: <ScalesIcon className="w-4 h-4" />, bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-700', activeBg: 'bg-cyan-500/20 border-cyan-500/50', label: 'scenes.flagTypeDecision', placeholder: 'scenes.flagPlaceholderDecision' },
}

function SceneTracker() {
    const t = useT()
    const {
        campaigns,
        currentCampaignId,
        currentSessionId,
        updateScene,
        addScene,
        removeScene,
        addSessionItem,
        updateSessionItem,
        removeSessionItem,
    } = useCampaignStore()
    const currentCampaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const { fearCount } = useFearStore()
    const launchEncounter = useLaunchEncounter()

    const [editingScene, setEditingScene] = useState<Scene | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [newFlag, setNewFlag] = useState('')
    const [newFlagType, setNewFlagType] = useState<SceneFlagType>('event')
    const [newFearThreshold, setNewFearThreshold] = useState(0)
    const [newDescription, setNewDescription] = useState('')
    const [newReadAloud, setNewReadAloud] = useState('')
    const [newEncounterId, setNewEncounterId] = useState('')
    const [newCountMax, setNewCountMax] = useState(0)
    const [descriptionMode, setDescriptionMode] = useState<'write' | 'preview'>('write')
    const [selectedSessionId, setSelectedSessionId] = useState<string>(currentSessionId ?? 'all')
    const [editingItem, setEditingItem] = useState<{ item: SessionItem; isCreate: boolean } | null>(null)
    const [newMenuOpen, setNewMenuOpen] = useState(false)

    const scenes = useMemo(() => currentCampaign?.scenes ?? [], [currentCampaign?.scenes])
    const sessions = useMemo(() => currentCampaign?.sessions ?? [], [currentCampaign?.sessions])
    const encounters = useMemo(() => currentCampaign?.encounters ?? [], [currentCampaign?.encounters])

    const visibleScenes = useMemo(() => {
        if (selectedSessionId === 'all') return scenes
        if (selectedSessionId === 'unassigned') {
            const assignedIds = new Set(sessions.flatMap((s) => s.sceneIds))
            return scenes.filter((s) => !assignedIds.has(s.id))
        }
        const session = sessions.find((s) => s.id === selectedSessionId)
        if (!session) return []
        return scenes.filter((s) => session.sceneIds.includes(s.id))
    }, [scenes, sessions, selectedSessionId])

    const sessionSceneCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        for (const session of sessions) {
            counts[session.id] = session.sceneIds.filter((id) => scenes.some((scene) => scene.id === id)).length
        }
        return counts
    }, [sessions, scenes])

    const unassignedCount = useMemo(() => {
        const assignedIds = new Set(sessions.flatMap((s) => s.sceneIds))
        return scenes.filter((s) => !assignedIds.has(s.id)).length
    }, [sessions, scenes])

    const selectedSession = sessions.find((s) => s.id === selectedSessionId)
    const groupedItems = useMemo(() => groupSessionItems(selectedSession?.items), [selectedSession?.items])
    const sortedScenes = useMemo(
        () => [...visibleScenes].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]),
        [visibleScenes]
    )

    if (!currentCampaignId || !currentCampaign) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center bg-ui-surface p-8 rounded-xl border border-ui-surface2">
                    <h2 className="text-xl text-ui-text font-display mb-2">{t('scenes.noCampaignSelected')}</h2>
                    <p className="text-ui-muted text-sm">{t('scenes.noCampaignHint')}</p>
                </div>
            </div>
        )
    }

    const openCreateItem = (kind: SessionItemKind) =>
        setEditingItem({ item: { id: crypto.randomUUID(), kind, title: '', done: false }, isCreate: true })

    const saveItem = (draft: SessionItem) => {
        if (!currentCampaignId || !selectedSession || !editingItem) return
        if (editingItem.isCreate) addSessionItem(currentCampaignId, selectedSession.id, draft)
        else updateSessionItem(currentCampaignId, selectedSession.id, draft.id, draft)
        setEditingItem(null)
    }

    const startCreateScene = () => {
        setIsCreating(true)
        setDescriptionMode('write')
    }

    const handleCreateScene = () => {
        if (!newTitle.trim()) return
        const scene: Scene = {
            id: crypto.randomUUID(),
            title: newTitle.trim(),
            status: 'upcoming',
            flag: newFlag.trim(),
            flagType: newFlagType,
            fearThreshold: newFlagType === 'fear' && newFearThreshold > 0 ? newFearThreshold : undefined,
            count: 0,
            countMax: newCountMax > 0 ? newCountMax : undefined,
            description: newDescription.trim(),
            readAloud: newReadAloud.trim() || undefined,
            encounterId: newEncounterId || undefined,
        }
        addScene(currentCampaignId, scene)
        setIsCreating(false)
        setNewTitle('')
        setNewFlag('')
        setNewFlagType('event')
        setNewFearThreshold(0)
        setNewDescription('')
        setNewReadAloud('')
        setNewEncounterId('')
        setNewCountMax(0)
    }

    const handleUpdateScene = (id: string, updates: Partial<Scene>) => {
        updateScene(currentCampaignId, id, updates)
        if (editingScene?.id === id) setEditingScene({ ...editingScene, ...updates })
    }

    const nextStatus: Record<Scene['status'], Scene['status']> = {
        upcoming: 'active',
        active: 'completed',
        completed: 'upcoming',
    }

    const statusConfig: Record<Scene['status'], { label: string; badge: string }> = {
        upcoming: { label: 'scenes.statusUpcoming', badge: 'bg-ui-surface2 text-ui-muted hover:bg-ui-surface border border-ui-surface2' },
        active: { label: 'scenes.statusActive', badge: 'bg-hope-primary text-white hover:bg-hope-gold' },
        completed: { label: 'scenes.statusDone', badge: 'bg-fear-light/20 text-fear-light hover:bg-fear-light/30 border border-fear-light/30' },
    }

    const renderFlag = (scene: Scene) => {
        if (!scene.flag) return null
        const flagType = scene.flagType ?? 'event'
        const cfg = FLAG_CONFIG[flagType]
        const hasThreshold = flagType === 'fear' && (scene.fearThreshold ?? 0) > 0
        const fearPct = hasThreshold ? Math.min(100, (fearCount / scene.fearThreshold!) * 100) : 0
        const fearTriggered = hasThreshold && fearCount >= scene.fearThreshold!

        return (
            <div className={`flex flex-col gap-1.5 ${cfg.bg} ${cfg.border} border rounded-lg px-2.5 py-2`}>
                <div className="flex items-start gap-1.5">
                    <span className={`text-[10px] font-black shrink-0 mt-0.5 ${cfg.text}`}>{cfg.icon}</span>
                    <span className={`text-xs leading-snug ${cfg.text}`}>{scene.flag}</span>
                </div>
                {hasThreshold && (
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                            <span className={`text-[10px] font-bold ${fearTriggered ? 'text-purple-700' : 'text-purple-500/80'}`}>
                                {fearTriggered ? t('scenes.triggered') : t('scenes.fearProgress')}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-purple-700">{fearCount} / {scene.fearThreshold}</span>
                        </div>
                        <div className="h-1.5 bg-purple-200/60 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-300 ${fearTriggered ? 'bg-purple-700' : 'bg-purple-500'}`} style={{ width: `${fearPct}%` }} />
                        </div>
                    </div>
                )}
            </div>
        )
    }

    const renderSceneCard = (scene: Scene) => {
        const cfg = statusConfig[scene.status]
        const linkedEncounter = encounters.find((encounter) => encounter.id === scene.encounterId)

        return (
            <div
                key={scene.id}
                onClick={() => {
                    setEditingScene(scene)
                    setDescriptionMode(scene.description ? 'preview' : 'write')
                }}
                className="bg-card-bg border border-card-border hover:border-hope-primary/50 rounded-xl p-4 cursor-pointer transition-all flex flex-col gap-2.5"
            >
                <div className="flex items-start justify-between gap-2">
                    <h4 className="text-card-text font-semibold text-sm leading-tight flex-1 min-w-0">{scene.title}</h4>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleUpdateScene(scene.id, { status: nextStatus[scene.status] })
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wide transition-colors shrink-0 ${cfg.badge}`}
                    >
                        {t(cfg.label)}
                    </button>
                </div>

                {renderFlag(scene)}

                {scene.readAloud && (
                    <p className="border-l-2 border-hope-gold/60 pl-2 text-[11px] italic text-card-text/80 line-clamp-2">
                        {scene.readAloud}
                    </p>
                )}

                {linkedEncounter && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            launchEncounter(linkedEncounter, currentCampaignId)
                        }}
                        className="self-start text-[10px] font-bold px-2 py-1 rounded-lg bg-fear-light/15 text-fear-light hover:bg-fear-light/25 transition-colors"
                    >
                        {t('scenes.launchEncounter')}: {linkedEncounter.name}
                    </button>
                )}

                {scene.description && (
                    <p className="text-card-text/70 text-xs leading-relaxed line-clamp-2">
                        {scene.description.replace(/[#*_`[\]]/g, '').trim()}
                    </p>
                )}

                <CountdownControls scene={scene} compact onUpdate={(updates) => handleUpdateScene(scene.id, updates)} />
            </div>
        )
    }

    return (
        <div className="flex h-full overflow-hidden">
            <div className="w-52 shrink-0 flex flex-col border-r border-ui-surface2 overflow-y-auto bg-ui-surface/30">
                <div className="px-4 pt-5 pb-3 shrink-0">
                    <h1 className="text-ui-text font-display text-lg font-bold">{t('scenes.title')}</h1>
                    <p className="text-ui-muted text-xs mt-0.5 truncate">{currentCampaign.name}</p>
                </div>

                <nav className="px-2 pb-4 flex flex-col gap-0.5">
                    <button type="button" onClick={() => setSelectedSessionId('all')} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${selectedSessionId === 'all' ? 'bg-hope-primary/15 text-hope-primary font-semibold' : 'text-ui-muted hover:text-ui-text hover:bg-ui-surface2/60'}`}>
                        <span>{t('scenes.allScenes')}</span>
                        <span className="text-[10px] bg-ui-surface2 px-1.5 py-0.5 rounded-full text-ui-muted font-bold">{scenes.length}</span>
                    </button>
                    <button type="button" onClick={() => setSelectedSessionId('unassigned')} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${selectedSessionId === 'unassigned' ? 'bg-hope-primary/15 text-hope-primary font-semibold' : 'text-ui-muted hover:text-ui-text hover:bg-ui-surface2/60'}`}>
                        <span>{t('scenes.unassigned')}</span>
                        <span className="text-[10px] bg-ui-surface2 px-1.5 py-0.5 rounded-full text-ui-muted font-bold">{unassignedCount}</span>
                    </button>

                    {sessions.length > 0 ? (
                        <>
                            <div className="px-3 pt-3 pb-1">
                                <span className="text-[10px] text-ui-muted uppercase font-bold tracking-widest">{t('scenes.sessions')}</span>
                            </div>
                            {sessions.map((session) => (
                                <button key={session.id} type="button" onClick={() => setSelectedSessionId(session.id)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left ${selectedSessionId === session.id ? 'bg-hope-primary/15 text-hope-primary font-semibold' : 'text-ui-muted hover:text-ui-text hover:bg-ui-surface2/60'}`}>
                                    <span className="truncate pr-1">{session.name}</span>
                                    <span className="text-[10px] bg-ui-surface2 px-1.5 py-0.5 rounded-full text-ui-muted font-bold shrink-0">{sessionSceneCounts[session.id] ?? 0}</span>
                                </button>
                            ))}
                        </>
                    ) : (
                        <p className="px-3 py-2 text-xs text-ui-muted italic">{t('scenes.noSessions')}</p>
                    )}
                </nav>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-ui-surface2">
                    <div>
                        <h2 className="text-ui-text font-semibold">
                            {selectedSessionId === 'all'
                                ? t('scenes.allScenes')
                                : selectedSessionId === 'unassigned'
                                ? t('scenes.unassignedScenes')
                                : selectedSession?.name ?? t('scenes.session')}
                        </h2>
                        <p className="text-ui-muted text-xs">{t(visibleScenes.length === 1 ? 'scenes.sceneCountOne' : 'scenes.sceneCountOther', { count: visibleScenes.length })}</p>
                    </div>
                    <div className="relative">
                        <button type="button" onClick={() => setNewMenuOpen((open) => !open)} className="px-4 py-2 bg-hope-primary hover:bg-hope-gold text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2">
                            + {t('sessionLog.new')}
                            <span className="text-[10px]">v</span>
                        </button>
                        {newMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setNewMenuOpen(false)} />
                                <div className="absolute right-0 mt-1 z-50 w-44 bg-ui-surface border border-ui-surface2 rounded-lg shadow-xl py-1 flex flex-col">
                                    <button type="button" onClick={() => { setNewMenuOpen(false); startCreateScene() }} className="flex items-center gap-2 px-3 py-1.5 text-sm text-ui-text hover:bg-ui-surface2 transition-colors text-left">
                                        <span className="w-2 h-2 rounded-full bg-hope-primary shrink-0" />
                                        {t('sessionLog.newScene')}
                                    </button>
                                    {selectedSession && (['clue', 'loot', 'message', 'note'] as SessionItemKind[]).map((kind) => {
                                        const cfg = KIND_CONFIG[kind]
                                        return (
                                            <button key={kind} type="button" onClick={() => { setNewMenuOpen(false); openCreateItem(kind) }} className="flex items-center gap-2 px-3 py-1.5 text-sm text-ui-text hover:bg-ui-surface2 transition-colors text-left">
                                                <span className={cfg.text}>{cfg.icon}</span>
                                                {t(cfg.kindKey)}
                                            </button>
                                        )
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-5 flex flex-col gap-6">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-hope-primary shrink-0" />
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-ui-muted">{t('sessionLog.scenesSection')}</h4>
                            <span className="text-[10px] bg-ui-surface2 px-1.5 rounded-full text-ui-muted font-bold">{sortedScenes.length}</span>
                        </div>
                        {sortedScenes.length === 0 ? (
                            <p className="text-[11px] text-ui-muted italic px-1">{t('sessionLog.noScenes')}</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
                                {sortedScenes.map(renderSceneCard)}
                            </div>
                        )}
                    </div>

                    {selectedSession && (
                        <SessionItemSections
                            grouped={groupedItems}
                            showEmpty
                            showAdd={false}
                            onToggle={(item) => updateSessionItem(currentCampaignId, selectedSession.id, item.id, { done: !item.done })}
                            onEdit={(item) => setEditingItem({ item, isCreate: false })}
                            onRemove={(item) => removeSessionItem(currentCampaignId, selectedSession.id, item.id)}
                            onAdd={openCreateItem}
                        />
                    )}
                </div>
            </div>

            {(editingScene || isCreating) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ui-bg/80 backdrop-blur-sm">
                    <div className="bg-ui-surface w-full max-w-2xl rounded-2xl border border-ui-surface2 shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-ui-surface2">
                            <h2 className="text-xl font-display font-semibold text-ui-text">{isCreating ? t('scenes.createTitle') : t('scenes.editTitle')}</h2>
                            <Button variant="ghost" size="sm" onClick={() => { setEditingScene(null); setIsCreating(false) }}>x</Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">{t('scenes.sceneTitle')}</label>
                                <Input theme="hope" type="text" value={editingScene ? editingScene.title : newTitle} onChange={(e) => editingScene ? handleUpdateScene(editingScene.id, { title: e.target.value }) : setNewTitle(e.target.value)} placeholder={t('scenes.sceneTitlePlaceholder')} />
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">{t('scenes.triggerType')}</label>
                                    <div className="flex gap-1.5">
                                        {(['event', 'fear', 'time', 'decision'] as SceneFlagType[]).map((type) => {
                                            const cfg = FLAG_CONFIG[type]
                                            const current = editingScene ? (editingScene.flagType ?? 'event') : newFlagType
                                            const isActive = current === type
                                            return (
                                                <button key={type} type="button" onClick={() => editingScene ? handleUpdateScene(editingScene.id, { flagType: type }) : setNewFlagType(type)} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${isActive ? `${cfg.activeBg} ${cfg.text}` : 'bg-ui-surface2 border-ui-surface2 text-ui-muted hover:text-ui-text'}`}>
                                                    <span>{cfg.icon}</span>
                                                    <span className="capitalize">{t(cfg.label)}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">{t('scenes.triggerCondition')}</label>
                                    <Input theme="hope" type="text" value={editingScene ? editingScene.flag : newFlag} onChange={(e) => editingScene ? handleUpdateScene(editingScene.id, { flag: e.target.value }) : setNewFlag(e.target.value)} placeholder={t(FLAG_CONFIG[editingScene ? (editingScene.flagType ?? 'event') : newFlagType].placeholder)} />
                                </div>

                                {(editingScene ? (editingScene.flagType ?? 'event') : newFlagType) === 'fear' && (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">{t('scenes.fearThreshold')}</label>
                                        <div className="flex items-center gap-3">
                                            <div className="w-36 shrink-0">
                                                <Input theme="hope" type="number" min={1} max={12} value={editingScene ? (editingScene.fearThreshold ?? '') : (newFearThreshold || '')} onChange={(e) => {
                                                    const val = e.target.value ? Math.min(12, Math.max(1, +e.target.value)) : undefined
                                                    if (editingScene) handleUpdateScene(editingScene.id, { fearThreshold: val })
                                                    else setNewFearThreshold(val ?? 0)
                                                }} placeholder={t('scenes.fearThresholdPlaceholder')} />
                                            </div>
                                            <p className="text-xs text-ui-muted flex-1">{t('scenes.fearThresholdHint')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">{t('scenes.readAloud')}</label>
                                <Textarea theme="hope" rows={3} value={editingScene ? (editingScene.readAloud ?? '') : newReadAloud} onChange={(e) => editingScene ? handleUpdateScene(editingScene.id, { readAloud: e.target.value.trim() === '' ? undefined : e.target.value }) : setNewReadAloud(e.target.value)} placeholder={t('scenes.readAloudPlaceholder')} />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">{t('scenes.linkedEncounter')}</label>
                                <Select theme="hope" value={editingScene ? (editingScene.encounterId ?? '') : newEncounterId} onChange={(e) => editingScene ? handleUpdateScene(editingScene.id, { encounterId: e.target.value || undefined }) : setNewEncounterId(e.target.value)}>
                                    <option value="">{t('scenes.noEncounter')}</option>
                                    {encounters.map((encounter) => <option key={encounter.id} value={encounter.id}>{encounter.name}</option>)}
                                </Select>
                            </div>

                            {editingScene ? (
                                <CountdownControls scene={editingScene} onUpdate={(updates) => handleUpdateScene(editingScene.id, updates)} />
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">{t('scenes.countdownClock')}</label>
                                    <div className="flex items-center gap-3">
                                        <div className="w-36 shrink-0">
                                            <Input theme="hope" type="number" min={0} value={newCountMax} onChange={(e) => setNewCountMax(Math.max(0, +e.target.value))} placeholder={t('scenes.countMaxPlaceholder')} />
                                        </div>
                                        <p className="text-xs text-ui-muted flex-1">{t('scenes.countdownHint')}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-2 flex-1 min-h-[200px]">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">{t('scenes.description')}</label>
                                    <div className="flex bg-ui-bg border border-ui-surface2 rounded p-0.5">
                                        <button type="button" onClick={() => setDescriptionMode('write')} className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${descriptionMode === 'write' ? 'bg-ui-surface text-ui-text shadow-sm' : 'text-ui-muted hover:text-ui-text'}`}>{t('scenes.write')}</button>
                                        <button type="button" onClick={() => setDescriptionMode('preview')} className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${descriptionMode === 'preview' ? 'bg-ui-surface text-ui-text shadow-sm' : 'text-ui-muted hover:text-ui-text'}`}>{t('scenes.preview')}</button>
                                    </div>
                                </div>
                                {descriptionMode === 'write' ? (
                                    <Textarea theme="hope" value={editingScene ? editingScene.description || '' : newDescription} onChange={(e) => editingScene ? handleUpdateScene(editingScene.id, { description: e.target.value }) : setNewDescription(e.target.value)} className="flex-1 font-mono" placeholder={t('scenes.descriptionPlaceholder')} />
                                ) : (
                                    <div className="w-full bg-ui-surface border border-ui-surface2 rounded-xl p-4 overflow-y-auto min-h-[160px] prose max-w-none text-ui-text">
                                        {(editingScene ? editingScene.description : newDescription) ? <SharedMarkdown>{(editingScene ? editingScene.description : newDescription) || ''}</SharedMarkdown> : <p className="italic opacity-50 text-sm">{t('scenes.nothingWritten')}</p>}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-ui-surface2 flex justify-between bg-ui-surface/50 rounded-b-2xl">
                            {editingScene ? <Button variant="destructive" onClick={() => { removeScene(currentCampaignId, editingScene.id); setEditingScene(null) }}>{t('scenes.deleteScene')}</Button> : <div />}
                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={() => { setEditingScene(null); setIsCreating(false) }}>{isCreating ? t('scenes.cancel') : t('scenes.close')}</Button>
                                {isCreating && (
                                    <button type="button" onClick={handleCreateScene} disabled={!newTitle.trim()} className="px-6 py-2 text-sm bg-hope-primary hover:bg-hope-gold text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                                        {t('scenes.createScene')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {editingItem && (
                <SessionItemModal
                    initial={editingItem.item}
                    isCreate={editingItem.isCreate}
                    onSave={saveItem}
                    onDelete={editingItem.isCreate ? undefined : () => {
                        if (selectedSession) removeSessionItem(currentCampaignId, selectedSession.id, editingItem.item.id)
                        setEditingItem(null)
                    }}
                    onClose={() => setEditingItem(null)}
                />
            )}
        </div>
    )
}

export default SceneTracker
