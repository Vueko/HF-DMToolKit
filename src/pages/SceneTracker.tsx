import { useState, useMemo } from 'react'
import { useCampaignStore } from '../store/campaignStore'
import type { Scene } from '../types'
import { SharedMarkdown } from '../components/SharedMarkdown'

function SceneTracker() {
    const { campaigns, currentCampaignId, updateScene, addScene, removeScene } = useCampaignStore()
    const currentCampaign = campaigns.find((c) => c.id === currentCampaignId) ?? null

    const [editingScene, setEditingScene] = useState<Scene | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [newFlag, setNewFlag] = useState('')
    const [newDescription, setNewDescription] = useState('')
    const [descriptionMode, setDescriptionMode] = useState<'write' | 'preview'>('write')
    const [selectedSessionFilter, setSelectedSessionFilter] = useState<string>('all')

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

    const allScenes = currentCampaign.scenes || []

    const visibleScenes = useMemo(() => {
        if (selectedSessionFilter === 'all') {
            return allScenes
        }
        if (selectedSessionFilter === 'unassigned') {
            const assignedIds = new Set(currentCampaign.sessions.flatMap(s => s.sceneIds))
            return allScenes.filter(s => !assignedIds.has(s.id))
        }
        const session = currentCampaign.sessions.find(s => s.id === selectedSessionFilter)
        if (!session) return []
        return allScenes.filter(s => session.sceneIds.includes(s.id))
    }, [allScenes, selectedSessionFilter, currentCampaign.sessions])

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
            count: 0,
            description: newDescription.trim()
        }
        addScene(currentCampaignId, scene)
        setIsCreating(false)
        setNewTitle('')
        setNewFlag('')
        setNewDescription('')
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

    const statusLabels: Record<Scene['status'], string> = {
        upcoming: 'Next',
        active: 'Active',
        completed: 'Done',
    }

    const badgeStyles: Record<Scene['status'], string> = {
        upcoming: 'bg-ui-surface2 text-ui-muted hover:text-ui-text',
        active: 'bg-hope-primary text-white hover:bg-hope-gold',
        completed: 'bg-fear-light text-white hover:bg-fear-secondary',
    }

    const renderSceneCard = (scene: Scene) => (
        <div
            key={scene.id}
            onClick={() => {
                setEditingScene(scene)
                setDescriptionMode(scene.description ? 'preview' : 'write')
            }}
            className="bg-card-bg border border-card-border rounded-xl p-4 cursor-pointer hover:border-hope-primary transition-colors flex flex-col gap-2"
        >
            <div className="flex justify-between items-start gap-2">
                <h4 className="text-card-text font-semibold text-sm leading-tight">{scene.title}</h4>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        handleUpdateScene(scene.id, { status: nextStatus[scene.status] })
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors shrink-0 ${badgeStyles[scene.status]}`}
                >
                    {statusLabels[scene.status]}
                </button>
            </div>

            {scene.flag && (
                <span className="text-ui-muted text-xs italic">{scene.flag}</span>
            )}

            {scene.description && (
                <div className="text-card-text text-xs opacity-90 mt-1 prose max-w-none">
                    <SharedMarkdown>{scene.description}</SharedMarkdown>
                </div>
            )}

            <div className="mt-2 pt-2 border-t border-card-border/30 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-ui-muted tracking-wider">Progress</span>
                    <div className="flex items-center gap-1.5 bg-ui-bg/50 rounded-lg px-2 py-0.5">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleUpdateScene(scene.id, { count: Math.max(0, (scene.count ?? 0) - 1) }) }}
                            className="text-ui-muted hover:text-ui-text transition-colors"
                        >-</button>
                        <span className="text-xs font-mono font-bold text-ui-text w-4 text-center">{scene.count ?? 0}</span>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleUpdateScene(scene.id, { count: (scene.count ?? 0) + 1 }) }}
                            className="text-ui-muted hover:text-ui-text transition-colors"
                        >+</button>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="flex flex-col h-full w-full max-w-7xl mx-auto overflow-hidden">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between p-6 shrink-0 border-b border-ui-surface2 gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-ui-text">Scene Tracker</h1>
                    <p className="text-sm text-ui-muted mt-1">{currentCampaign.name}</p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={selectedSessionFilter}
                        onChange={(e) => setSelectedSessionFilter(e.target.value)}
                        className="bg-ui-surface2 border border-ui-surface2 text-ui-text text-sm rounded-lg px-3 py-2 outline-none focus:border-hope-primary cursor-pointer transition-colors"
                    >
                        <option value="all">Show All Scenes</option>
                        <option value="unassigned">Unassigned Scenes</option>
                        <optgroup label="Campaign Sessions">
                            {currentCampaign.sessions.map(s => (
                                <option key={s.id} value={s.id}>
                                    Session {s.number} - {s.name}
                                </option>
                            ))}
                        </optgroup>
                    </select>

                    <button
                        onClick={() => {
                            setIsCreating(true)
                            setDescriptionMode('write')
                        }}
                        className="px-4 py-2 bg-hope-primary hover:bg-hope-gold text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                        + New Scene
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">

                    <div className="flex flex-col gap-4 bg-ui-surface/30 p-4 rounded-xl border border-ui-surface2 h-full max-h-full">
                        <div className="flex items-center justify-between mb-2 shrink-0">
                            <h3 className="text-ui-text font-semibold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-ui-muted"></span>
                                Upcoming
                            </h3>
                            <span className="text-xs text-ui-muted bg-ui-surface2 px-2 py-0.5 rounded-full">{upcoming.length}</span>
                        </div>
                        <div className="flex flex-col gap-3 overflow-y-auto pb-4 pr-1">
                            {upcoming.map(renderSceneCard)}
                            {upcoming.length === 0 && <p className="text-xs text-ui-muted text-center py-8">No upcoming scenes</p>}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 bg-ui-surface/30 p-4 rounded-xl border border-hope-primary/20 h-full max-h-full">
                        <div className="flex items-center justify-between mb-2 shrink-0">
                            <h3 className="text-ui-text font-semibold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-hope-primary animate-pulse"></span>
                                Active
                            </h3>
                            <span className="text-xs text-ui-muted bg-ui-surface2 px-2 py-0.5 rounded-full">{active.length}</span>
                        </div>
                        <div className="flex flex-col gap-3 overflow-y-auto pb-4 pr-1">
                            {active.map(renderSceneCard)}
                            {active.length === 0 && <p className="text-xs text-ui-muted text-center py-8">No active scenes</p>}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 bg-ui-surface/30 p-4 rounded-xl border border-fear-light/20 h-full max-h-full">
                        <div className="flex items-center justify-between mb-2 shrink-0">
                            <h3 className="text-ui-text font-semibold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-fear-light"></span>
                                Completed
                            </h3>
                            <span className="text-xs text-ui-muted bg-ui-surface2 px-2 py-0.5 rounded-full">{completed.length}</span>
                        </div>
                        <div className="flex flex-col gap-3 overflow-y-auto pb-4 pr-1">
                            {completed.map(renderSceneCard)}
                            {completed.length === 0 && <p className="text-xs text-ui-muted text-center py-8">No completed scenes</p>}
                        </div>
                    </div>

                </div>
            </div>

            {(editingScene || isCreating) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ui-bg/80 backdrop-blur-sm">
                    <div className="bg-ui-surface w-full max-w-2xl rounded-2xl border border-ui-surface2 shadow-2xl flex flex-col max-h-[90vh]">

                        <div className="flex items-center justify-between p-6 border-b border-ui-surface2">
                            <h2 className="text-xl font-display font-semibold text-ui-text">
                                {isCreating ? 'Create New Scene' : 'Edit Scene'}
                            </h2>
                            <button
                                onClick={() => { setEditingScene(null); setIsCreating(false) }}
                                className="text-ui-muted hover:text-ui-text transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">Scene Title</label>
                                <input
                                    type="text"
                                    value={editingScene ? editingScene.title : newTitle}
                                    onChange={(e) => editingScene ? handleUpdateScene(editingScene.id, { title: e.target.value }) : setNewTitle(e.target.value)}
                                    className="bg-ui-bg border border-ui-surface2 rounded-lg px-4 py-2.5 text-ui-text text-sm focus:border-hope-primary outline-none transition-colors"
                                    placeholder="e.g. The Goblin Ambush"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">Trigger Flag</label>
                                <input
                                    type="text"
                                    value={editingScene ? editingScene.flag : newFlag}
                                    onChange={(e) => editingScene ? handleUpdateScene(editingScene.id, { flag: e.target.value }) : setNewFlag(e.target.value)}
                                    className="bg-ui-bg border border-ui-surface2 rounded-lg px-4 py-2.5 text-ui-text text-sm focus:border-hope-primary outline-none transition-colors"
                                    placeholder="e.g. When the players enter the forest"
                                />
                            </div>

                            <div className="flex flex-col gap-2 flex-1 min-h-[200px]">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">
                                        Description
                                    </label>
                                    <div className="flex bg-ui-bg border border-ui-surface2 rounded p-0.5">
                                        <button onClick={() => setDescriptionMode('write')} className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${descriptionMode === 'write' ? 'bg-ui-surface text-ui-text shadow-sm' : 'text-ui-muted hover:text-ui-text'}`}>Write</button>
                                        <button onClick={() => setDescriptionMode('preview')} className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${descriptionMode === 'preview' ? 'bg-ui-surface text-ui-text shadow-sm' : 'text-ui-muted hover:text-ui-text'}`}>Preview</button>
                                    </div>
                                </div>
                                {descriptionMode === 'write' ? (
                                    <textarea
                                        value={editingScene ? editingScene.description || '' : newDescription}
                                        onChange={(e) => editingScene ? handleUpdateScene(editingScene.id, { description: e.target.value }) : setNewDescription(e.target.value)}
                                        className="bg-ui-bg border border-ui-surface2 rounded-lg px-4 py-3 text-ui-text text-sm focus:border-hope-primary outline-none transition-colors flex-1 resize-none font-mono"
                                        placeholder="Write your scene notes, DCs, or narrative text here..."
                                    />
                                ) : (
                                    <div className="w-full h-full bg-ui-surface border border-ui-surface2 rounded-xl p-4 overflow-y-auto prose max-w-none text-ui-text">
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
                                <button
                                    onClick={() => {
                                        removeScene(currentCampaignId, editingScene.id)
                                        setEditingScene(null)
                                    }}
                                    className="px-4 py-2 text-sm text-fear-light hover:bg-fear-light/10 rounded-lg transition-colors font-medium"
                                >
                                    Delete Scene
                                </button>
                            ) : (
                                <div />
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setEditingScene(null); setIsCreating(false) }}
                                    className="px-5 py-2 text-sm text-ui-muted hover:text-ui-text transition-colors font-medium"
                                >
                                    {isCreating ? 'Cancel' : 'Close'}
                                </button>
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