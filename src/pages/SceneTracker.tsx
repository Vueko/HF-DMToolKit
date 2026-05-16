import { useState, useMemo } from 'react'
import { useCampaignStore } from '../store/campaignStore'
import { useFearStore } from '../store/fearStore'
import type { Scene, SceneFlagType } from '../types'
import { SharedMarkdown } from '../components/SharedMarkdown'
import { Button, Input, Textarea } from '../components/ui'

const FLAG_CONFIG: Record<SceneFlagType, { icon: string; bg: string; border: string; text: string; activeBg: string; placeholder: string }> = {
    event:    { icon: '⚡', bg: 'bg-hope-primary/10', border: 'border-hope-primary/25', text: 'text-hope-primary', activeBg: 'bg-hope-primary/20 border-hope-primary/50',  placeholder: 'e.g. When the players enter the forest' },
    fear:     { icon: '💀', bg: 'bg-purple-500/10',  border: 'border-purple-500/30',   text: 'text-purple-700',  activeBg: 'bg-purple-500/20 border-purple-500/50',         placeholder: 'e.g. When darkness has consumed the land' },
    time:     { icon: '⏰', bg: 'bg-amber-500/10',   border: 'border-amber-400/30',    text: 'text-amber-700',   activeBg: 'bg-amber-500/20 border-amber-400/50',           placeholder: 'e.g. After 3 sessions / at the winter solstice' },
    decision: { icon: '⚖', bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30',     text: 'text-cyan-700',    activeBg: 'bg-cyan-500/20 border-cyan-500/50',             placeholder: 'e.g. If the players spared the merchant' },
}

function SceneTracker() {
    const { campaigns, currentCampaignId, updateScene, addScene, removeScene } = useCampaignStore()
    const currentCampaign = campaigns.find((c) => c.id === currentCampaignId) ?? null

    const { fearCount } = useFearStore()

    const [editingScene, setEditingScene] = useState<Scene | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [newFlag, setNewFlag] = useState('')
    const [newFlagType, setNewFlagType] = useState<SceneFlagType>('event')
    const [newFearThreshold, setNewFearThreshold] = useState(0)
    const [newDescription, setNewDescription] = useState('')
    const [newCountMax, setNewCountMax] = useState(0)
    const [descriptionMode, setDescriptionMode] = useState<'write' | 'preview'>('write')
    const [selectedSessionId, setSelectedSessionId] = useState<string>('all')

    const scenes = useMemo(() => currentCampaign?.scenes ?? [], [currentCampaign?.scenes])
    const sessions = useMemo(() => currentCampaign?.sessions ?? [], [currentCampaign?.sessions])

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
        for (const s of sessions) {
            counts[s.id] = s.sceneIds.filter((id) => scenes.some((sc) => sc.id === id)).length
        }
        return counts
    }, [sessions, scenes])

    const unassignedCount = useMemo(() => {
        const assignedIds = new Set(sessions.flatMap((s) => s.sceneIds))
        return scenes.filter((s) => !assignedIds.has(s.id)).length
    }, [sessions, scenes])

    if (!currentCampaignId || !currentCampaign) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center bg-ui-surface p-8 rounded-xl border border-ui-surface2">
                    <h2 className="text-xl text-ui-text font-display mb-2">No Campaign Selected</h2>
                    <p className="text-ui-muted text-sm">Please go to the Campaigns page to select or create a campaign.</p>
                </div>
            </div>
        )
    }

    const upcoming = visibleScenes.filter((s) => s.status === 'upcoming')
    const active = visibleScenes.filter((s) => s.status === 'active')
    const completed = visibleScenes.filter((s) => s.status === 'completed')

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
        }
        addScene(currentCampaignId, scene)
        setIsCreating(false)
        setNewTitle('')
        setNewFlag('')
        setNewFlagType('event')
        setNewFearThreshold(0)
        setNewDescription('')
        setNewCountMax(0)
    }

    const handleUpdateScene = (id: string, updates: Partial<Scene>) => {
        updateScene(currentCampaignId, id, updates)
        if (editingScene?.id === id) {
            setEditingScene({ ...editingScene, ...updates })
        }
    }

    const nextStatus: Record<Scene['status'], Scene['status']> = {
        upcoming: 'active',
        active: 'completed',
        completed: 'upcoming',
    }

    const statusConfig: Record<Scene['status'], { label: string; badge: string }> = {
        upcoming: { label: 'Upcoming', badge: 'bg-ui-surface2 text-ui-muted hover:bg-ui-surface border border-ui-surface2' },
        active:   { label: 'Active',   badge: 'bg-hope-primary text-white hover:bg-hope-gold' },
        completed:{ label: 'Done',     badge: 'bg-fear-light/20 text-fear-light hover:bg-fear-light/30 border border-fear-light/30' },
    }

    const renderSceneCard = (scene: Scene) => {
        const cfg = statusConfig[scene.status]
        const hasCountdown = (scene.countMax ?? 0) > 0
        const count = scene.count ?? 0
        const max = scene.countMax ?? 1
        const pct = hasCountdown ? Math.min(100, (count / max) * 100) : 0
        const isFull = hasCountdown && count >= max

        return (
            <div
                key={scene.id}
                onClick={() => {
                    setEditingScene(scene)
                    setDescriptionMode(scene.description ? 'preview' : 'write')
                }}
                className={`bg-card-bg border rounded-xl p-4 cursor-pointer transition-all flex flex-col gap-2.5 ${
                    isFull
                        ? 'border-hope-gold/60 hover:border-hope-gold shadow-[0_0_0_1px_rgba(var(--color-hope-gold),0.15)]'
                        : 'border-card-border hover:border-hope-primary/50'
                }`}
            >
                {/* Title + status */}
                <div className="flex items-start justify-between gap-2">
                    <h4 className="text-card-text font-semibold text-sm leading-tight flex-1 min-w-0">{scene.title}</h4>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            handleUpdateScene(scene.id, { status: nextStatus[scene.status] })
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wide transition-colors shrink-0 ${cfg.badge}`}
                    >
                        {cfg.label}
                    </button>
                </div>

                {/* Trigger flag — typed */}
                {scene.flag && (() => {
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
                                            {fearTriggered ? '⚠ TRIGGERED' : 'Fear progress'}
                                        </span>
                                        <span className="text-[10px] font-mono font-bold text-purple-700">{fearCount} / {scene.fearThreshold}</span>
                                    </div>
                                    <div className="h-1.5 bg-purple-200/60 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${fearTriggered ? 'bg-purple-700' : 'bg-purple-500'}`}
                                            style={{ width: `${fearPct}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })()}

                {/* Description preview */}
                {scene.description && (
                    <p className="text-card-text/70 text-xs leading-relaxed line-clamp-2">
                        {scene.description.replace(/[#*_`[\]]/g, '').trim()}
                    </p>
                )}

                {/* Countdown clock */}
                {hasCountdown && (
                    <div className="flex flex-col gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isFull ? 'text-hope-gold' : 'text-ui-muted'}`}>
                                {isFull ? '⚠ Clock Full' : '⏱ Clock'}
                            </span>
                            <span className={`text-xs font-bold tabular-nums ${isFull ? 'text-hope-gold' : 'text-ui-text'}`}>
                                {count} / {max}
                            </span>
                        </div>
                        <div className="h-2 bg-ui-surface2 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${isFull ? 'bg-hope-gold' : 'bg-hope-primary'}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => handleUpdateScene(scene.id, { count: Math.max(0, count - 1) })}
                                disabled={count <= 0}
                                className="w-6 h-6 bg-ui-surface2 hover:bg-fear-light/30 text-ui-text text-xs font-bold rounded transition-colors flex items-center justify-center disabled:opacity-30"
                            >−</button>
                            <button
                                onClick={() => handleUpdateScene(scene.id, { count: Math.min(max, count + 1) })}
                                disabled={isFull}
                                className="w-6 h-6 bg-ui-surface2 hover:bg-hope-primary/30 text-ui-text text-xs font-bold rounded transition-colors flex items-center justify-center disabled:opacity-30"
                            >+</button>
                        </div>
                    </div>
                )}

                {/* Simple counter (no max set) */}
                {!hasCountdown && (
                    <div className="flex items-center gap-2 pt-0.5" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] uppercase font-bold text-ui-muted tracking-wider">Count</span>
                        <div className="flex items-center gap-1 bg-ui-bg/60 rounded-lg px-1.5 py-0.5 ml-auto">
                            <button
                                onClick={() => handleUpdateScene(scene.id, { count: Math.max(0, count - 1) })}
                                className="text-ui-muted hover:text-ui-text transition-colors text-xs w-4 text-center"
                            >−</button>
                            <span className="text-xs font-mono font-bold text-ui-text w-5 text-center">{count}</span>
                            <button
                                onClick={() => handleUpdateScene(scene.id, { count: count + 1 })}
                                className="text-ui-muted hover:text-ui-text transition-colors text-xs w-4 text-center"
                            >+</button>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    const selectedSession = sessions.find((s) => s.id === selectedSessionId)

    return (
        <div className="flex h-full overflow-hidden">

            {/* Sessions sidebar */}
            <div className="w-52 shrink-0 flex flex-col border-r border-ui-surface2 overflow-y-auto bg-ui-surface/30">
                <div className="px-4 pt-5 pb-3 shrink-0">
                    <h1 className="text-ui-text font-display text-lg font-bold">Scene Tracker</h1>
                    <p className="text-ui-muted text-xs mt-0.5 truncate">{currentCampaign.name}</p>
                </div>

                <nav className="px-2 pb-4 flex flex-col gap-0.5">
                    <button
                        onClick={() => setSelectedSessionId('all')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedSessionId === 'all'
                                ? 'bg-hope-primary/15 text-hope-primary font-semibold'
                                : 'text-ui-muted hover:text-ui-text hover:bg-ui-surface2/60'
                        }`}
                    >
                        <span>All Scenes</span>
                        <span className="text-[10px] bg-ui-surface2 px-1.5 py-0.5 rounded-full text-ui-muted font-bold">{scenes.length}</span>
                    </button>

                    <button
                        onClick={() => setSelectedSessionId('unassigned')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedSessionId === 'unassigned'
                                ? 'bg-hope-primary/15 text-hope-primary font-semibold'
                                : 'text-ui-muted hover:text-ui-text hover:bg-ui-surface2/60'
                        }`}
                    >
                        <span>Unassigned</span>
                        <span className="text-[10px] bg-ui-surface2 px-1.5 py-0.5 rounded-full text-ui-muted font-bold">{unassignedCount}</span>
                    </button>

                    {sessions.length > 0 && (
                        <>
                            <div className="px-3 pt-3 pb-1">
                                <span className="text-[10px] text-ui-muted uppercase font-bold tracking-widest">Sessions</span>
                            </div>
                            {sessions.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setSelectedSessionId(s.id)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                                        selectedSessionId === s.id
                                            ? 'bg-hope-primary/15 text-hope-primary font-semibold'
                                            : 'text-ui-muted hover:text-ui-text hover:bg-ui-surface2/60'
                                    }`}
                                >
                                    <span className="truncate pr-1">{s.name}</span>
                                    <span className="text-[10px] bg-ui-surface2 px-1.5 py-0.5 rounded-full text-ui-muted font-bold shrink-0">
                                        {sessionSceneCounts[s.id] ?? 0}
                                    </span>
                                </button>
                            ))}
                        </>
                    )}

                    {sessions.length === 0 && (
                        <p className="px-3 py-2 text-xs text-ui-muted italic">No sessions yet.</p>
                    )}
                </nav>
            </div>

            {/* Main Kanban area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-ui-surface2">
                    <div>
                        <h2 className="text-ui-text font-semibold">
                            {selectedSessionId === 'all'
                                ? 'All Scenes'
                                : selectedSessionId === 'unassigned'
                                ? 'Unassigned Scenes'
                                : selectedSession?.name ?? 'Session'}
                        </h2>
                        <p className="text-ui-muted text-xs">{visibleScenes.length} scene{visibleScenes.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button
                        onClick={() => { setIsCreating(true); setDescriptionMode('write') }}
                        className="px-4 py-2 bg-hope-primary hover:bg-hope-gold text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                        + New Scene
                    </button>
                </header>

                <div className="flex-1 overflow-auto p-5">
                    <div className="grid grid-cols-3 gap-4 items-start">

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 pb-2 border-b border-ui-surface2">
                                <span className="w-2 h-2 rounded-full bg-ui-muted shrink-0" />
                                <h3 className="text-ui-text text-sm font-semibold">Upcoming</h3>
                                <span className="ml-auto text-[10px] font-bold text-ui-muted bg-ui-surface2 px-2 py-0.5 rounded-full">{upcoming.length}</span>
                            </div>
                            <div className="flex flex-col gap-3">
                                {upcoming.map(renderSceneCard)}
                                {upcoming.length === 0 && <p className="text-xs text-ui-muted text-center py-6">No upcoming scenes</p>}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 pb-2 border-b border-hope-primary/40">
                                <span className="w-2 h-2 rounded-full bg-hope-primary animate-pulse shrink-0" />
                                <h3 className="text-ui-text text-sm font-semibold">Active</h3>
                                <span className="ml-auto text-[10px] font-bold text-ui-muted bg-ui-surface2 px-2 py-0.5 rounded-full">{active.length}</span>
                            </div>
                            <div className="flex flex-col gap-3">
                                {active.map(renderSceneCard)}
                                {active.length === 0 && <p className="text-xs text-ui-muted text-center py-6">No active scenes</p>}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 pb-2 border-b border-fear-light/40">
                                <span className="w-2 h-2 rounded-full bg-fear-light shrink-0" />
                                <h3 className="text-ui-text text-sm font-semibold">Completed</h3>
                                <span className="ml-auto text-[10px] font-bold text-ui-muted bg-ui-surface2 px-2 py-0.5 rounded-full">{completed.length}</span>
                            </div>
                            <div className="flex flex-col gap-3">
                                {completed.map(renderSceneCard)}
                                {completed.length === 0 && <p className="text-xs text-ui-muted text-center py-6">No completed scenes</p>}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Modal */}
            {(editingScene || isCreating) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ui-bg/80 backdrop-blur-sm">
                    <div className="bg-ui-surface w-full max-w-2xl rounded-2xl border border-ui-surface2 shadow-2xl flex flex-col max-h-[90vh]">

                        <div className="flex items-center justify-between p-6 border-b border-ui-surface2">
                            <h2 className="text-xl font-display font-semibold text-ui-text">
                                {isCreating ? 'Create New Scene' : 'Edit Scene'}
                            </h2>
                            <Button variant="ghost" size="sm" onClick={() => { setEditingScene(null); setIsCreating(false) }}>✕</Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">Scene Title</label>
                                <Input
                                    theme="hope"
                                    type="text"
                                    value={editingScene ? editingScene.title : newTitle}
                                    onChange={(e) => editingScene
                                        ? handleUpdateScene(editingScene.id, { title: e.target.value })
                                        : setNewTitle(e.target.value)
                                    }
                                    placeholder="e.g. The Goblin Ambush"
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">Trigger Type</label>
                                    <div className="flex gap-1.5">
                                        {(['event', 'fear', 'time', 'decision'] as SceneFlagType[]).map((type) => {
                                            const cfg = FLAG_CONFIG[type]
                                            const current = editingScene ? (editingScene.flagType ?? 'event') : newFlagType
                                            const isActive = current === type
                                            return (
                                                <button
                                                    key={type}
                                                    onClick={() => editingScene
                                                        ? handleUpdateScene(editingScene.id, { flagType: type })
                                                        : setNewFlagType(type)
                                                    }
                                                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                                                        isActive
                                                            ? `${cfg.activeBg} ${cfg.text}`
                                                            : 'bg-ui-surface2 border-ui-surface2 text-ui-muted hover:text-ui-text'
                                                    }`}
                                                >
                                                    <span>{cfg.icon}</span>
                                                    <span className="capitalize">{type}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">Trigger Condition</label>
                                    <Input
                                        theme="hope"
                                        type="text"
                                        value={editingScene ? editingScene.flag : newFlag}
                                        onChange={(e) => editingScene
                                            ? handleUpdateScene(editingScene.id, { flag: e.target.value })
                                            : setNewFlag(e.target.value)
                                        }
                                        placeholder={FLAG_CONFIG[editingScene ? (editingScene.flagType ?? 'event') : newFlagType].placeholder}
                                    />
                                </div>

                                {(editingScene ? (editingScene.flagType ?? 'event') : newFlagType) === 'fear' && (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">Fear Threshold</label>
                                        <div className="flex items-center gap-3">
                                            <div className="w-36 shrink-0">
                                                <Input
                                                    theme="hope"
                                                    type="number"
                                                    min={1}
                                                    max={12}
                                                    value={editingScene ? (editingScene.fearThreshold ?? '') : (newFearThreshold || '')}
                                                    onChange={(e) => {
                                                        const val = e.target.value ? Math.min(12, Math.max(1, +e.target.value)) : undefined
                                                        if (editingScene) handleUpdateScene(editingScene.id, { fearThreshold: val })
                                                        else setNewFearThreshold(val ?? 0)
                                                    }}
                                                    placeholder="e.g. 8"
                                                />
                                            </div>
                                            <p className="text-xs text-ui-muted flex-1">Triggers when fear reaches this value (max 12).</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">⏱ Countdown Clock</label>
                                <div className="flex items-center gap-3">
                                    <div className="w-36 shrink-0">
                                        <Input
                                            theme="hope"
                                            type="number"
                                            min={0}
                                            value={editingScene ? (editingScene.countMax ?? 0) : newCountMax}
                                            onChange={(e) => {
                                                const val = Math.max(0, +e.target.value)
                                                if (editingScene) {
                                                    handleUpdateScene(editingScene.id, {
                                                        countMax: val > 0 ? val : undefined,
                                                        count: Math.min(editingScene.count ?? 0, val),
                                                    })
                                                } else {
                                                    setNewCountMax(val)
                                                }
                                            }}
                                            placeholder="0 = off"
                                        />
                                    </div>
                                    {(() => {
                                        const max = editingScene ? (editingScene.countMax ?? 0) : newCountMax
                                        const count = editingScene ? (editingScene.count ?? 0) : 0
                                        const pct = max > 0 ? Math.min(100, (count / max) * 100) : 0
                                        return max > 0 ? (
                                            <div className="flex-1 flex flex-col gap-1">
                                                <div className="flex justify-between text-xs text-ui-muted">
                                                    <span>Progress</span>
                                                    <span className="font-bold text-ui-text">{count} / {max}</span>
                                                </div>
                                                <div className="h-2 bg-ui-surface2 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full bg-hope-primary transition-all" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-ui-muted flex-1">Set a max to enable a countdown clock. Fills from 0 → max.</p>
                                        )
                                    })()}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 flex-1 min-h-[200px]">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">Description</label>
                                    <div className="flex bg-ui-bg border border-ui-surface2 rounded p-0.5">
                                        <button
                                            onClick={() => setDescriptionMode('write')}
                                            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${descriptionMode === 'write' ? 'bg-ui-surface text-ui-text shadow-sm' : 'text-ui-muted hover:text-ui-text'}`}
                                        >Write</button>
                                        <button
                                            onClick={() => setDescriptionMode('preview')}
                                            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${descriptionMode === 'preview' ? 'bg-ui-surface text-ui-text shadow-sm' : 'text-ui-muted hover:text-ui-text'}`}
                                        >Preview</button>
                                    </div>
                                </div>
                                {descriptionMode === 'write' ? (
                                    <Textarea
                                        theme="hope"
                                        value={editingScene ? editingScene.description || '' : newDescription}
                                        onChange={(e) => editingScene
                                            ? handleUpdateScene(editingScene.id, { description: e.target.value })
                                            : setNewDescription(e.target.value)
                                        }
                                        className="flex-1 font-mono"
                                        placeholder="Write your scene notes, DCs, or narrative text here..."
                                    />
                                ) : (
                                    <div className="w-full bg-ui-surface border border-ui-surface2 rounded-xl p-4 overflow-y-auto min-h-[160px] prose max-w-none text-ui-text">
                                        {(editingScene ? editingScene.description : newDescription) ? (
                                            <SharedMarkdown>{(editingScene ? editingScene.description : newDescription) || ''}</SharedMarkdown>
                                        ) : (
                                            <p className="italic opacity-50 text-sm">Nothing written yet.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-ui-surface2 flex justify-between bg-ui-surface/50 rounded-b-2xl">
                            {editingScene ? (
                                <Button variant="destructive" onClick={() => { removeScene(currentCampaignId, editingScene.id); setEditingScene(null) }}>
                                    Delete Scene
                                </Button>
                            ) : (
                                <div />
                            )}
                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={() => { setEditingScene(null); setIsCreating(false) }}>
                                    {isCreating ? 'Cancel' : 'Close'}
                                </Button>
                                {isCreating && (
                                    <button
                                        onClick={handleCreateScene}
                                        disabled={!newTitle.trim()}
                                        className="px-6 py-2 text-sm bg-hope-primary hover:bg-hope-gold text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Create Scene
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    )
}

export default SceneTracker
