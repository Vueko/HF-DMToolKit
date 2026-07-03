import { useState } from 'react'
import FearWidget from '../components/dashboard/FearWidget'
import SceneWidget from '../components/dashboard/SceneWidget'
import ActiveCardsWidget from '../components/dashboard/ActiveCardsWidget'
import MoodWidget from '../components/dashboard/MoodWidget'
import EncounterWidget from '../components/dashboard/EncounterWidget'
import PlayerScreenWidget from '../components/dashboard/PlayerScreenWidget'
import PrepChecklistModal from '../components/dashboard/PrepChecklistModal'
import { useCampaignStore } from '../store/campaignStore'
import { useFearStore } from '../store/fearStore'

function DMDashboard() {
    const { campaigns, currentCampaignId, currentSessionId } = useCampaignStore()
    const { fearCount, addFear, removeFear } = useFearStore()

    const currentCampaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const currentSession = currentCampaign?.sessions.find((s) => s.id === currentSessionId) ?? null

    const hasCampaign = currentCampaign !== null
    const [prepOpen, setPrepOpen] = useState(currentSession === null)

    return (
        <div className="flex flex-col gap-6">

            {/* Sticky header — always visible while scrolling */}
            <div className="sticky -top-6 z-20 -mx-6 px-6 py-3 bg-ui-canvas/95 backdrop-blur-sm border-b border-ui-surface2/50 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-ui-text font-display text-2xl font-bold">DM Dashboard</h1>
                    {currentCampaign && currentSession ? (
                        <p className="text-ui-muted text-sm">
                            {currentCampaign.name} — Session {currentSession.number}: {currentSession.name}
                        </p>
                    ) : (
                        <p className="text-ui-muted text-sm">No active session</p>
                    )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={() => setPrepOpen(true)}
                        className="text-ui-muted hover:text-ui-text bg-ui-surface hover:bg-ui-surface2 border border-ui-surface2 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                        Prep
                    </button>
                    {hasCampaign && (
                        <div className="flex items-center gap-2 bg-fear-primary rounded-xl px-3 py-2">
                            <button
                                onClick={() => removeFear(1)}
                                className="w-7 h-7 rounded-full bg-fear-secondary hover:bg-fear-light text-ui-text text-lg font-bold transition-colors flex items-center justify-center"
                            >−</button>
                            <div className="flex items-center gap-1.5 min-w-14 justify-center">
                                <span>💀</span>
                                <span className="text-ui-text font-black text-2xl font-display tabular-nums">{fearCount}</span>
                            </div>
                            <button
                                onClick={() => addFear(1)}
                                disabled={fearCount >= 12}
                                className="w-7 h-7 rounded-full bg-fear-light hover:bg-fear-secondary text-ui-text text-lg font-bold transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                            >+</button>
                        </div>
                    )}
                    <MoodWidget />
                </div>
            </div>

            {/* Widget grid */}
            <div className={`grid grid-cols-2 gap-4 ${!hasCampaign ? 'opacity-40 pointer-events-none' : ''}`}>
                <SceneWidget />
                <FearWidget />
                <ActiveCardsWidget />
                <EncounterWidget />
                <div className="col-span-2">
                    <PlayerScreenWidget />
                </div>
            </div>

            <PrepChecklistModal
                campaign={currentCampaign}
                open={prepOpen}
                onClose={() => setPrepOpen(false)}
            />
        </div>
    )
}

export default DMDashboard
