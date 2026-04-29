import { NavLink } from 'react-router-dom'

const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/campaigns', label: 'Campaigns' },
    { path: '/scenes', label: 'Scene Tracker' },
    { path: '/cards', label: 'Cards' },
    { path: '/dm-screen', label: 'DM Screen' },
    { path: '/music', label: 'Music Player' },
    { path: '/journal', label: 'Campaign Journal' },
    { path: '/map', label: 'Campaign Map' },
]

function Sidebar() {
    return (
        <aside className="w-64 min-h-screen bg-ui-canvas flex flex-col p-4 gap-1">
            <h2 className="text-hope-yellow font-display text-xl font-bold mb-6 px-2">
                <span className="font-cinzel tracking-widest">HFTK</span><br />
                <span className="font-inter text-ui-muted text-sm">DM Toolkit</span>
            </h2>

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