import FearWidget from '../components/dashboard/FearWidget'
import SceneWidget from '../components/dashboard/SceneWidget'
import ActiveCardsWidget from '../components/dashboard/ActiveCardsWidget'

function DMDashboard() {
    return (
        <div className="flex flex-col gap-6">

            <div>
                <h1 className="text-ui-text font-display text-2xl font-bold">DM Dashboard</h1>
                <p className="text-ui-muted text-sm">Current session overview</p>
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
