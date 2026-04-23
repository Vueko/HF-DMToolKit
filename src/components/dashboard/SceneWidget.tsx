import { useState } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import type { Scene } from '../../types'

function SceneWidget() {
    const {
        campaigns,
        currentCampaignId,
        currentSessionId,
        addScene,
        updateScene,
        addSceneToSession,
        removeSceneFromSession,
    } = useCampaignStore()

    const [isAdding, setIsAdding] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [newFlag, setNewFlag] = useState('')

    const currentCampaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const currentSession = currentCampaign?.sessions.find((s) => s.id === currentSessionId) ?? null

    const sessionScenes = currentCampaign?.scenes.filter(
        (s) => currentSession?.sceneIds.includes(s.id)
    ) ?? []

    const allCampaignScenes = currentCampaign?.scenes ?? []
    const unlinkedScenes = allCampaignScenes.filter(
        (s) => !currentSession?.sceneIds.includes(s.id)
    )

    function handleAddScene() {
        if (!newTitle.trim() || !currentCampaignId || !currentSessionId) return
        const scene: Scene = {
            id: crypto.randomUUID(),
            title: newTitle.trim(),
            status: 'upcoming',
            flag: newFlag.trim(),
            count: 0,
        }
        addScene(currentCampaignId, scene)
        addSceneToSession(currentCampaignId, currentSessionId, scene.id)
        setNewTitle('')
        setNewFlag('')
        setIsAdding(false)
    }

    if (!currentCampaignId || !currentSessionId) {
        return (
            <div className="bg-ui-surface rounded-xl p-5 flex flex-col gap-3">
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
        <div className="bg-ui-surface rounded-xl p-5 flex flex-col gap-3">

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
                            <span className="text-ui-text text-sm font-medium flex-1 min-w-0 truncate">
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
                                className={`text-xs px-2 py-1 rounded-lg font-medium shrink-0 transition-all ${badgeStyles[scene.status]}`}
                            >
                                {statusLabels[scene.status]}
                            </button>

                            <button
                                onClick={() => removeSceneFromSession(currentCampaignId, currentSessionId, scene.id)}
                                className="text-ui-muted hover:text-red-400 transition-colors shrink-0 text-xs"
                            >
                                Remove
                            </button>
                        </div>

                        {scene.flag && (
                            <p className="text-ui-muted text-xs mt-1.5 italic pl-0.5">
                                {scene.flag}
                            </p>
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

            {isAdding ? (
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Scene name..."
                        autoFocus
                        className="bg-ui-surface2 text-ui-text text-sm px-3 py-2 rounded-lg outline-none border border-ui-surface2 focus:border-fear-light"
                    />
                    <input
                        type="text"
                        value={newFlag}
                        onChange={(e) => setNewFlag(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddScene()}
                        placeholder="Flag: what triggers this scene? (optional)"
                        className="bg-ui-surface2 text-ui-text text-sm px-3 py-2 rounded-lg outline-none border border-ui-surface2 focus:border-fear-light"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddScene}
                            className="flex-1 py-2 bg-fear-light hover:bg-fear-secondary text-ui-text text-sm rounded-lg transition-colors"
                        >
                            Add Scene
                        </button>
                        <button
                            onClick={() => setIsAdding(false)}
                            className="px-4 py-2 text-ui-muted hover:text-ui-text text-sm rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full py-2 text-sm text-hope-primary hover:text-hope-gold border border-dashed border-ui-surface2 hover:border-hope-primary rounded-lg transition-colors"
                >
                    + New Scene
                </button>
            )}

        </div>
    )
}

export default SceneWidget
