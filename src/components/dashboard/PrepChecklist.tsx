import { Link } from 'react-router-dom'
import type { Campaign } from '../../types'
import MoodWidget from './MoodWidget'
import FearWidget from './FearWidget'
import SceneWidget from './SceneWidget'
import ActiveCardsWidget from './ActiveCardsWidget'
import EncounterWidget from './EncounterWidget'

interface PrepChecklistProps {
    campaign: Campaign
}

type ChecklistItem = {
    id: string
    label: string
    done: boolean
    link?: string
    linkLabel?: string
}

function PrepChecklist({ campaign }: PrepChecklistProps) {
    const hasSession = campaign.sessions.length > 0
    const hasEncounters = (campaign.encounters ?? []).length > 0
    const hasScenes = campaign.sessions.some((s) => s.sceneIds.length > 0)

    const items: ChecklistItem[] = [
        { id: 'campaign', label: 'Campaña creada', done: true },
        { id: 'session', label: 'Sesión creada', done: hasSession, link: '/campaigns', linkLabel: 'Campaigns' },
        { id: 'encounters', label: 'Encuentros preparados', done: hasEncounters, link: '/encounter', linkLabel: 'Encounter Builder' },
        { id: 'scenes', label: 'Escenas configuradas', done: hasScenes, link: '/scenes', linkLabel: 'Scene Tracker' },
    ]

    const allDone = items.every((i) => i.done)

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-ui-text font-display text-2xl font-bold">DM Dashboard</h1>
                    <p className="text-ui-muted text-sm">{campaign.name} — Prepará tu próxima sesión</p>
                </div>
                <MoodWidget />
            </div>

            <div className="bg-ui-surface rounded-xl border border-ui-surface2/60 p-4 flex flex-col gap-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ui-muted">
                    Lista de preparación
                </p>
                <div className="flex flex-col gap-2">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-3 bg-ui-bg/40 rounded-lg px-4 py-3"
                        >
                            <span className={`text-sm shrink-0 ${item.done ? 'text-green-400' : 'text-ui-muted'}`}>
                                {item.done ? '✓' : '○'}
                            </span>
                            <span
                                className={`text-sm flex-1 ${
                                    item.done ? 'text-ui-muted line-through' : 'text-ui-text font-medium'
                                }`}
                            >
                                {item.label}
                            </span>
                            {!item.done && item.link && item.linkLabel && (
                                <Link
                                    to={item.link}
                                    className="text-fear-light hover:text-fear-secondary text-xs transition-colors shrink-0"
                                >
                                    {item.linkLabel} →
                                </Link>
                            )}
                        </div>
                    ))}
                    <Link
                        to="/campaigns"
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

            <div aria-hidden="true" className="grid grid-cols-2 gap-4 opacity-30 pointer-events-none">
                <SceneWidget />
                <FearWidget />
                <div className="col-span-2">
                    <ActiveCardsWidget />
                </div>
                <div className="col-span-2">
                    <EncounterWidget />
                </div>
            </div>
        </div>
    )
}

export default PrepChecklist
