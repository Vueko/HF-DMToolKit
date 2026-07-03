import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { Campaign } from '../../types'
import { useSettingsStore } from '../../store/settingsStore'
import { buildPrepSteps } from './prepSteps'

interface PrepChecklistModalProps {
    campaign: Campaign | null
    open: boolean
    onClose: () => void
}

function PrepChecklistModal({ campaign, open, onClose }: PrepChecklistModalProps) {
    const vaultPath = useSettingsStore((s) => s.vaultPath)

    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    if (!open) return null

    const steps = buildPrepSteps(campaign, vaultPath)
    const allDone = steps.every((s) => s.done)

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ui-bg/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="modal-enter bg-ui-surface w-full max-w-lg rounded-2xl border border-ui-surface2 shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-ui-surface2">
                    <div>
                        <h2 className="text-ui-text font-display font-semibold text-lg">Prepará tu sesión</h2>
                        <p className="text-ui-muted text-xs">{campaign ? campaign.name : 'Primeros pasos'}</p>
                    </div>
                    <button onClick={onClose} className="text-ui-muted hover:text-ui-text transition-colors text-xl font-bold" aria-label="Cerrar">✕</button>
                </div>

                <div className="p-4 flex flex-col gap-2">
                    {steps.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 bg-ui-bg/40 rounded-lg px-4 py-3">
                            <span className={`text-sm shrink-0 ${item.done ? 'text-green-400' : 'text-ui-muted'}`}>
                                {item.done ? '✓' : '○'}
                            </span>
                            <span className={`text-sm flex-1 ${item.done ? 'text-ui-muted line-through' : 'text-ui-text font-medium'}`}>
                                {item.label}
                            </span>
                            {!item.done && item.link && item.linkLabel && (
                                <Link to={item.link} onClick={onClose} className="text-fear-light hover:text-fear-secondary text-xs transition-colors shrink-0">
                                    {item.linkLabel} →
                                </Link>
                            )}
                        </div>
                    ))}
                    <Link
                        to="/campaigns"
                        onClick={onClose}
                        className={`flex items-center justify-center mt-1 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                            allDone
                                ? 'bg-hope-yellow text-ui-canvas hover:bg-hope-secondary'
                                : 'bg-ui-surface2 text-ui-muted hover:bg-ui-surface hover:text-ui-text'
                        }`}
                    >
                        {allDone ? 'Todo listo — Activar sesión →' : 'Activar sesión →'}
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default PrepChecklistModal
