import type { Scene, SceneCountdown, SceneCountdownType } from '../../types'
import { normalizeSceneCountdowns } from '../../scene/countdowns'

const TYPES: SceneCountdownType[] = ['standard', 'progress', 'consequence', 'loop', 'long-term']

interface CountdownControlsProps {
    scene: Scene
    onUpdate: (updates: Partial<Scene>) => void
    compact?: boolean
}

function clamp(value: number, max: number): number {
    return Math.max(0, Math.min(Math.max(0, max), Math.trunc(value || 0)))
}

function toExplicit(scene: Scene): SceneCountdown[] {
    return normalizeSceneCountdowns(scene).map((countdown) => countdown.id === 'legacy'
        ? { ...countdown, id: crypto.randomUUID() }
        : countdown)
}

export function CountdownControls({ scene, onUpdate, compact = false }: CountdownControlsProps) {
    const countdowns = normalizeSceneCountdowns(scene)
    const explicit = scene.countdowns && scene.countdowns.length > 0

    const updateCountdown = (id: string, updates: Partial<SceneCountdown>) => {
        const source = explicit ? scene.countdowns ?? [] : toExplicit(scene)
        onUpdate({ countdowns: source.map((countdown) => countdown.id === id ? { ...countdown, ...updates } : countdown) })
    }

    const addCountdown = () => {
        onUpdate({
            countdowns: [
                ...toExplicit(scene),
                { id: crypto.randomUUID(), title: 'New countdown', type: 'standard', value: 4, max: 4 },
            ],
            countMax: undefined,
            count: 0,
        })
    }

    const removeCountdown = (id: string) => {
        const next = (explicit ? scene.countdowns ?? [] : toExplicit(scene)).filter((countdown) => countdown.id !== id)
        onUpdate({ countdowns: next.length > 0 ? next : undefined, countMax: undefined, count: 0 })
    }

    return (
        <div className={`flex flex-col gap-2 ${compact ? '' : 'rounded-lg border border-ui-surface2 bg-ui-canvas/40 p-3'}`}>
            <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-ui-muted">Countdowns</span>
                {!compact && <button type="button" onClick={addCountdown} className="text-[11px] text-hope-gold hover:text-hope-yellow">+ Add</button>}
            </div>
            {countdowns.length === 0 && <p className="text-xs text-ui-muted">No countdowns</p>}
            {countdowns.map((countdown) => {
                const pct = countdown.max > 0 ? Math.max(0, Math.min(100, (countdown.value / countdown.max) * 100)) : 0
                const urgent = countdown.value <= 0
                return (
                    <div key={countdown.id} className="rounded-lg border border-card-border/50 bg-card-bg px-2.5 py-2 text-card-text flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                            {compact ? (
                                <span className="text-xs font-semibold flex-1 truncate">{countdown.title}</span>
                            ) : (
                                <input value={countdown.title} onChange={(e) => updateCountdown(countdown.id, { title: e.target.value })} className="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none border-b border-transparent focus:border-card-border" />
                            )}
                            <span className={`text-[10px] font-bold uppercase ${urgent ? 'text-red-700' : 'text-card-text/60'}`}>{countdown.value} / {countdown.max}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {compact ? (
                                <span className="text-[10px] text-card-text/60">{countdown.type}</span>
                            ) : (
                                <select value={countdown.type} onChange={(e) => updateCountdown(countdown.id, { type: e.target.value as SceneCountdownType })} className="bg-card-bg border border-card-border/50 rounded px-1 py-0.5 text-[10px]">
                                    {TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                                </select>
                            )}
                            <div className="h-1.5 flex-1 bg-card-border/30 rounded-full overflow-hidden" title="Remaining">
                                <div className={`${urgent ? 'bg-red-700' : 'bg-hope-primary'} h-full transition-all`} style={{ width: `${pct}%` }} />
                            </div>
                            {!compact && (
                                <div className="flex items-center gap-1">
                                    <button type="button" onClick={() => updateCountdown(countdown.id, { value: clamp(countdown.value - 1, countdown.max) })} className="w-6 h-6 rounded bg-card-border/20 hover:bg-fear-light/20 text-xs font-bold">-</button>
                                    <button type="button" onClick={() => updateCountdown(countdown.id, { value: clamp(countdown.value + 1, countdown.max) })} className="w-6 h-6 rounded bg-card-border/20 hover:bg-hope-primary/20 text-xs font-bold">+</button>
                                    <input type="number" min={1} value={countdown.max} onChange={(e) => {
                                        const max = Math.max(1, Math.trunc(Number(e.target.value) || 1))
                                        updateCountdown(countdown.id, { max, value: clamp(countdown.value, max) })
                                    }} className="w-12 rounded border border-card-border/50 bg-card-bg px-1 py-0.5 text-[10px]" />
                                    <button type="button" onClick={() => removeCountdown(countdown.id)} className="w-6 h-6 rounded text-red-700 hover:bg-red-500/10 text-xs font-bold">x</button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
