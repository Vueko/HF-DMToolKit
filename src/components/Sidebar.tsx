import { NavLink } from 'react-router-dom'
import { useCampaignStore } from '../store/campaignStore'

const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/campaigns', label: 'Campaigns' },
    { path: '/scenes', label: 'Scene Tracker' },
    { path: '/cards', label: 'Cards' },
    { path: '/encounter', label: 'Encounter Builder' },
    { path: '/dm-screen', label: 'DM Screen' },
    { path: '/music', label: 'Music Player' },
    { path: '/journal', label: 'World Wiki' },
    { path: '/map', label: 'Campaign Map' },
    { path: '/soundboard', label: 'Soundboard' },
]

function Sidebar() {
    const { campaigns, currentCampaignId } = useCampaignStore()
    const currentCampaign = campaigns.find((c) => c.id === currentCampaignId) ?? null

    return (
        <aside className="w-64 bg-ui-canvas flex flex-col px-4 pt-3 pb-4 gap-1 border-r border-ui-surface/30">
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                            ? 'bg-fear-light text-ui-text font-medium'
                            : 'text-ui-muted hover:text-ui-text hover:bg-ui-surface2'
                        }`
                    }
                >
                    <span>{item.label}</span>
                </NavLink>
            ))}
            <div className="mt-auto flex flex-col gap-1">
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                            ? 'bg-fear-light text-ui-text font-medium'
                            : 'text-ui-muted hover:text-ui-text hover:bg-ui-surface2'
                        }`
                    }
                >
                    <span>⚙ Settings</span>
                </NavLink>
                <div className="pt-3 border-t border-ui-surface/30">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ui-muted px-3 mb-1">Campaña</p>
                    <p className="text-xs text-ui-text px-3 truncate">
                        {currentCampaign?.name ?? 'Sin campaña activa'}
                    </p>
                </div>
            </div>
        </aside>
    )
}

export default Sidebar