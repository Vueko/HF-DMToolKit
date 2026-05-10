import { NavLink } from 'react-router-dom'

const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/campaigns', label: 'Campaigns' },
    { path: '/scenes', label: 'Scene Tracker' },
    { path: '/cards', label: 'Cards' },
    { path: '/encounter', label: 'Encounter Builder' },
    { path: '/dm-screen', label: 'DM Screen' },
    { path: '/music', label: 'Music Player' },
    { path: '/journal', label: 'Campaign Journal' },
    { path: '/map', label: 'Campaign Map' },

]

function Sidebar() {
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
        </aside>
    )
}

export default Sidebar