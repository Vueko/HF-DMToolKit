import { useState } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import type { Scene } from '../../types'
import { SharedMarkdown } from '../SharedMarkdown'

function SceneWidget() {
    const {
        campaigns,
        currentCampaignId,
        currentSessionId,
        updateScene,
        addSceneToSession,
        removeSceneFromSession,
    } = useCampaignStore()

    const [editingScene, setEditingScene] = useState<Scene | null>(null)
    const [descriptionMode, setDescriptionMode] = useState<'write' | 'preview'>('write')

    const currentCampaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const currentSession = currentCampaign?.sessions.find((s) => s.id === currentSessionId) ?? null

    const sessionScenes = currentCampaign?.scenes.filter(
        (s) => currentSession?.sceneIds.includes(s.id)
    ) ?? []

    const allCampaignScenes = currentCampaign?.scenes ?? []
    const unlinkedScenes = allCampaignScenes.filter(
        (s) => !currentSession?.sceneIds.includes(s.id)
    )

    const handleUpdateScene = (id: string, updates: Partial<Scene>) => {
        if (!currentCampaignId) return
        updateScene(currentCampaignId, id, updates)
        if (editingScene?.id === id) {
            setEditingScene({ ...editingScene, ...updates })
        }
    }

    if (!currentCampaignId || !currentSessionId) {
        return (
            <div className="bg-ui-surface rounded-xl border border-ui-surface2/60 p-5 flex flex-col gap-3">
                <h3 className="text-ui-text font-display font-semibold">Scene Tracker</h3>
                <p className="text-ui-muted text-sm text-center py-4">
                    No active session. Go to Campaigns to set one.
                </p>
            </div>
        )
    }

    const statusColors = {
        upcoming: 'text-ui-muted border-ui-surface2',
        active: 'text-hope-primary border-hope-primary',
        completed: 'text-fear-light border-fear-light',
    }

    const nextStatus: Record<Scene['status'], Scene['status']> = {
        upcoming: 'active',
        active: 'completed',
        completed: 'upcoming',
    }

    const badgeStyles: Record<Scene['status'], string> = {
        upcoming: 'bg-ui-surface2 text-ui-muted border border-ui-surface2',
        active: 'bg-hope-primary text-white border border-hope-primary',
        completed: 'bg-fear-light text-white border border-fear-light',
    }

    const statusLabels: Record<Scene['status'], string> = {
        upcoming: 'Next',
        active: 'Active',
        completed: 'Done',
    }

    return (
        <div className="bg-ui-surface rounded-xl border border-ui-surface2/60 p-5 flex flex-col gap-3">

            <div className="flex items-center justify-between">
                <h3 className="text-ui-text font-display font-semibold">Scene Tracker</h3>
                <span className="text-ui-muted text-xs">
                    {sessionScenes.length} scenes · {sessionScenes.filter(s => s.status === 'active').length} active
                </span>
            </div>

            <div className="flex flex-col gap-2">
                {sessionScenes.length === 0 && (
                    <p className="text-ui-muted text-sm text-center py-4">No scenes in this session.</p>
                )}

                {sessionScenes.map((scene) => (
                    <div
                        key={scene.id}
                        className={`rounded-lg border-l-2 px-3 py-3 transition-colors ${statusColors[scene.status]}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-ui-text text-base font-bold font-display flex-1 min-w-0">
                                {scene.title}
                            </span>

                            <div
                                className="flex items-center gap-1 bg-ui-bg rounded-lg px-2 py-1 shrink-0"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => updateScene(currentCampaignId, scene.id, { count: Math.max(0, (scene.count ?? 0) - 1) })}
                                    className="w-5 h-5 text-ui-muted hover:text-ui-text text-xs font-bold transition-colors"
                                >
                                    -
                                </button>
                                <span className="text-ui-text text-sm font-mono font-bold w-6 text-center">
                                    {scene.count ?? 0}
                                </span>
                                <button
                                    onClick={() => updateScene(currentCampaignId, scene.id, { count: (scene.count ?? 0) + 1 })}
                                    className="w-5 h-5 text-ui-muted hover:text-ui-text text-xs font-bold transition-colors"
                                >
                                    +
                                </button>
                            </div>

                            <button
                                onClick={() => updateScene(currentCampaignId, scene.id, { status: nextStatus[scene.status] })}
                                className={`text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider shrink-0 transition-all ${badgeStyles[scene.status]}`}
                            >
                                {statusLabels[scene.status]}
                            </button>

                            <button
                                onClick={() => {
                                    setEditingScene(scene)
                                    setDescriptionMode(scene.description ? 'preview' : 'write')
                                }}
                                className="text-ui-muted hover:text-hope-primary transition-colors shrink-0 text-[10px] uppercase font-bold"
                            >
                                Edit
                            </button>

                            <button
                                onClick={() => removeSceneFromSession(currentCampaignId, currentSessionId, scene.id)}
                                className="text-ui-muted hover:text-fear-light transition-colors shrink-0 text-[10px] uppercase font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {scene.flag && (
                            <p className="text-ui-muted text-sm mt-1.5 italic pl-0.5 opacity-80 font-medium">
                                {scene.flag}
                            </p>
                        )}
                        {scene.description && (
                            <div className="mt-3 prose max-w-none text-xs bg-ui-bg/30 rounded-lg p-3 border border-ui-surface2/50">
                                <SharedMarkdown>{scene.description}</SharedMarkdown>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {unlinkedScenes.length > 0 && (
                <div className="flex flex-col gap-1">
                    <span className="text-ui-muted text-xs">Add existing scene from campaign:</span>
                    <div className="flex flex-wrap gap-1">
                        {unlinkedScenes.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => addSceneToSession(currentCampaignId, currentSessionId, s.id)}
                                className="text-xs px-2 py-1 bg-ui-surface2 hover:bg-ui-surface text-ui-muted hover:text-ui-text rounded transition-colors"
                            >
                                + {s.title}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {editingScene && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ui-bg/80 backdrop-blur-sm">
                    <div className="bg-ui-surface w-full max-w-2xl rounded-2xl border border-ui-surface2 shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-ui-surface2">
                            <h2 className="text-xl font-display font-semibold text-ui-text">Edit Scene</h2>
                            <button onClick={() => setEditingScene(null)} className="text-ui-muted hover:text-ui-text transition-colors">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">Scene Title</label>
                                <input
                                    type="text"
                                    value={editingScene.title}
                                    onChange={(e) => handleUpdateScene(editingScene.id, { title: e.target.value })}
                                    className="bg-ui-bg border border-ui-surface2 rounded-lg px-4 py-2.5 text-ui-text text-sm focus:border-hope-primary outline-none transition-colors"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">Trigger Flag</label>
                                <input
                                    type="text"
                                    value={editingScene.flag || ''}
                                    onChange={(e) => handleUpdateScene(editingScene.id, { flag: e.target.value })}
                                    className="bg-ui-bg border border-ui-surface2 rounded-lg px-4 py-2.5 text-ui-text text-sm focus:border-hope-primary outline-none transition-colors"
                                />
                            </div>
                            <div className="flex flex-col gap-2 flex-1 min-h-[200px]">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">Description</label>
                                    <div className="flex bg-ui-bg border border-ui-surface2 rounded p-0.5">
                                        <button onClick={() => setDescriptionMode('write')} className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${descriptionMode === 'write' ? 'bg-ui-surface text-ui-text shadow-sm' : 'text-ui-muted hover:text-ui-text'}`}>Write</button>
                                        <button onClick={() => setDescriptionMode('preview')} className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${descriptionMode === 'preview' ? 'bg-ui-surface text-ui-text shadow-sm' : 'text-ui-muted hover:text-ui-text'}`}>Preview</button>
                                    </div>
                                </div>
                                {descriptionMode === 'write' ? (
                                    <textarea
                                        value={editingScene.description || ''}
                                        onChange={(e) => handleUpdateScene(editingScene.id, { description: e.target.value })}
                                        className="bg-ui-bg border border-ui-surface2 rounded-lg px-4 py-3 text-ui-text text-sm focus:border-hope-primary outline-none transition-colors flex-1 resize-none font-mono"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-ui-surface border border-ui-surface2 rounded-xl p-4 overflow-y-auto prose max-w-none text-ui-text">
                                        {editingScene.description ? (
                                            <SharedMarkdown>{editingScene.description}</SharedMarkdown>
                                        ) : (
                                            <p className="italic opacity-50 text-sm">Nothing written yet.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-6 border-t border-ui-surface2 flex justify-end bg-ui-surface/50 rounded-b-2xl">
                            <button onClick={() => setEditingScene(null)} className="px-6 py-2 text-sm bg-hope-primary hover:bg-hope-gold text-white rounded-lg transition-colors font-medium">Close</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

export default SceneWidget
