import FearWidget from '../components/dashboard/FearWidget'
import SceneWidget from '../components/dashboard/SceneWidget'
import ActiveCardsWidget from '../components/dashboard/ActiveCardsWidget'
import { useCampaignStore } from '../store/campaignStore'
import { Link } from 'react-router-dom'

function DMDashboard() {
    const { campaigns, currentCampaignId, currentSessionId } = useCampaignStore()

    const currentCampaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const currentSession = currentCampaign?.sessions.find((s) => s.id === currentSessionId) ?? null

    return (
        <div className="flex flex-col gap-6">

            <div className="flex items-center justify-between">
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
                {!currentSession && (
                    <Link
                        to="/campaigns"
                        className="text-xs px-3 py-2 bg-fear-light hover:bg-fear-secondary text-ui-text rounded-lg transition-colors"
                    >
                        Set Active Session
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <SceneWidget />
                <FearWidget />
                <div className="col-span-2">
                    <ActiveCardsWidget />
                </div>
            </div>

        </div>
    )
}

export default DMDashboard
