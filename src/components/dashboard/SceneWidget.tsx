import { useState } from 'react'
import { useSessionStore } from '../../store/sessionStore'
import type { Scene } from '../../types'

const statusColors = {
    upcoming: 'text-ui-muted border-ui-surface2',
    active: 'text-hope-primary border-hope-primary',
    completed: 'text-fear-light border-fear-light',
}

function SceneWidget() {
    const { scenes, addScene, updateScene, removeScene, setCurrentScene, currentSceneId } = useSessionStore()
    const [isAdding, setIsAdding] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [newFlag, setNewFlag] = useState('')

    function handleAddScene() {
        if (!newTitle.trim()) return
        addScene({
            id: crypto.randomUUID(),
            title: newTitle.trim(),
            status: 'upcoming',
            flag: newFlag.trim(),
            count: 0,
        })
        setNewTitle('')
        setNewFlag('')
        setIsAdding(false)
    }

    return (
        <div className="bg-ui-surface rounded-xl p-5 flex flex-col gap-3">

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span>🎬</span>
                    <h3 className="text-ui-text font-display font-semibold">Scene Tracker</h3>
                </div>
                <span className="text-ui-muted text-xs">
                    {scenes.length} scenes · {scenes.filter(s => s.status === 'active').length} active
                </span>
            </div>

            <div className="flex flex-col gap-2">
                {scenes.length === 0 && (
                    <p className="text-ui-muted text-sm text-center py-4">No scenes yet.</p>
                )}

                {scenes.map((scene) => (
                    <div
                        key={scene.id}
                        onClick={() => setCurrentScene(scene.id)}
                        className={`rounded-lg border-l-2 px-3 py-3 cursor-pointer transition-colors hover:bg-ui-surface2 ${currentSceneId === scene.id ? 'bg-ui-surface2' : ''
                            } ${statusColors[scene.status]}`}
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
                                    onClick={(e) => { e.stopPropagation(); updateScene(scene.id, { count: Math.max(0, (scene.count ?? 0) - 1) }) }}
                                    className="w-5 h-5 text-ui-muted hover:text-ui-text text-xs font-bold transition-colors"
                                >
                                    −
                                </button>
                                <span className="text-ui-text text-sm font-mono font-bold w-6 text-center">
                                    {scene.count ?? 0}
                                </span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); updateScene(scene.id, { count: (scene.count ?? 0) + 1 }) }}
                                    className="w-5 h-5 text-ui-muted hover:text-ui-text text-xs font-bold transition-colors"
                                >
                                    +
                                </button>
                            </div>

                            {(() => {
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
                                const labels: Record<Scene['status'], string> = {
                                    upcoming: '⬜ Next',
                                    active: '🟠 Active',
                                    completed: '✅ Done',
                                }
                                return (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            updateScene(scene.id, { status: nextStatus[scene.status] })
                                        }}
                                        className={`text-xs px-2 py-1 rounded-lg font-medium shrink-0 transition-all ${badgeStyles[scene.status]}`}
                                    >
                                        {labels[scene.status]}
                                    </button>
                                )
                            })()}

                            <button
                                onClick={(e) => { e.stopPropagation(); removeScene(scene.id) }}
                                className="text-ui-muted hover:text-red-400 transition-colors shrink-0"
                            >
                                🗑
                            </button>
                        </div>

                        {scene.flag && (
                            <p className="text-ui-muted text-xs mt-1.5 italic pl-0.5">
                                🚩 {scene.flag}
                            </p>
                        )}
                    </div>
                ))}
            </div>

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
                    + Add Scene
                </button>
            )}

        </div>
    )
}

export default SceneWidget

