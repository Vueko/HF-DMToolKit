import { useState, useEffect, useMemo, createContext, useContext } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCampaignStore } from '../store/campaignStore'
import type { LoreEntry, LoreCategory } from '../types'
import { SharedMarkdown } from '../components/SharedMarkdown'

const FolderContext = createContext<{
    expandedFolders: Set<string>;
    selectedEntryId: string | null;
    toggleFolder: (id: string) => void;
    onSelectEntry: (id: string) => void;
} | null>(null);

function FolderNode({
    id,
    title,
    subtitle,
    children,
    onAdd,
    addLabel,
    isEntry = false,
    entryId = ''
}: {
    id: string,
    title: string,
    subtitle?: string,
    children?: React.ReactNode,
    onAdd?: () => void,
    addLabel?: string,
    isEntry?: boolean,
    entryId?: string
}) {
    const ctx = useContext(FolderContext)
    if (!ctx) return null
    const { expandedFolders, selectedEntryId, toggleFolder, onSelectEntry } = ctx

    const isExpanded = expandedFolders.has(id)
    const isSelected = isEntry && selectedEntryId === entryId

    return (
        <div className="flex flex-col">
            <div className="flex items-center group">
                <div
                    className={`flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer transition-colors ${isSelected ? 'bg-hope-primary/20 text-hope-gold' : 'hover:bg-ui-surface2 text-ui-text'
                        }`}
                    onClick={() => {
                        if (isEntry) {
                            onSelectEntry(entryId)
                        }
                        if (children || !isEntry) {
                            toggleFolder(id)
                        }
                    }}
                >
                    {(!isEntry || children) && (
                        <span className="text-[10px] w-3 opacity-50">{isExpanded ? '▼' : '▶'}</span>
                    )}
                    <div className="flex-1 min-w-0 flex items-baseline gap-1.5 truncate">
                        <span className={`text-sm truncate ${isEntry ? (isSelected ? 'font-medium' : (!children ? 'pl-4 opacity-90' : 'opacity-90')) : 'font-semibold'}`}>
                            {title}
                        </span>
                        {subtitle && (
                            <span className="text-[10px] text-ui-muted truncate opacity-70 font-normal">
                                {subtitle}
                            </span>
                        )}
                    </div>
                </div>
                {onAdd && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onAdd() }}
                        className="px-2 py-1 text-ui-muted hover:text-hope-primary opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        title={addLabel}
                    >
                        +
                    </button>
                )}
            </div>
            {isExpanded && children && (
                <div className="flex flex-col border-l border-ui-surface2 ml-3.5 pl-2 mt-0.5 gap-0.5">
                    {children}
                </div>
            )}
        </div>
    )
}

const CATEGORY_LABELS: Record<LoreCategory, string> = {
    continent: ' Continents',
    city: 'Cities / Towns',
    faction: 'Factions',
    npc: 'NPCs',
    character_journal: 'Character Journals',
    handout: 'Handouts & Clues'
}

function CampaignJournal() {
    const { campaigns, currentCampaignId, addLoreEntry, updateLoreEntry, removeLoreEntry } = useCampaignStore()
    const currentCampaign = campaigns.find((c) => c.id === currentCampaignId) ?? null

    const [searchParams] = useSearchParams()

    // Initialize selected entry from URL if present
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(searchParams.get('entryId') || null)
    const [isEditing, setIsEditing] = useState(false)
    const [isPlayerView, setIsPlayerView] = useState(false)
    const [publicMode, setPublicMode] = useState<'write' | 'preview'>('write')
    const [secretMode, setSecretMode] = useState<'write' | 'preview'>('write')
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
    const [searchQuery, setSearchQuery] = useState('')
    const [sidebarView, setSidebarView] = useState<'category' | 'geography'>('category')

    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev)
            if (next.has(folderId)) next.delete(folderId)
            else next.add(folderId)
            return next
        })
    }

    const folderContextValue = useMemo(() => ({
        expandedFolders,
        selectedEntryId,
        toggleFolder,
        onSelectEntry: (id: string) => {
            setSelectedEntryId(id)
            setIsEditing(false)
        }
    }), [expandedFolders, selectedEntryId])

    useEffect(() => {
        const entryId = searchParams.get('entryId')
        if (entryId && entryId !== selectedEntryId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedEntryId(entryId)
            setIsEditing(false)
        }
    }, [searchParams, selectedEntryId])

    if (!currentCampaignId || !currentCampaign) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center bg-ui-surface p-8 rounded-xl border border-ui-surface2">
                    <h2 className="text-xl text-ui-text font-display mb-2">No Campaign Selected</h2>
                    <p className="text-ui-muted text-sm">Please go to the Campaigns page to select or create a campaign.</p>
                </div>
            </div>
        )
    }

    const lore = currentCampaign.lore || []
    const selectedEntry = lore.find(l => l.id === selectedEntryId)

    const handleCreateEntry = (category: LoreCategory, initialData: Partial<LoreEntry> = {}) => {
        const newEntry: LoreEntry = {
            id: crypto.randomUUID(),
            title: `New ${category}`,
            category,
            publicContent: '',
            secretContent: '',
            createdAt: new Date().toISOString(),
            tags: [],
            ...initialData
        }
        addLoreEntry(currentCampaignId, newEntry)
        setSelectedEntryId(newEntry.id)
        setIsEditing(true)
        setIsPlayerView(false)
        setPublicMode('write')
        setSecretMode('write')

        if (initialData.continentId) toggleFolder(`continent-${initialData.continentId}`)
        if (initialData.cityId) toggleFolder(`city-${initialData.cityId}`)
        if (initialData.factionId) toggleFolder(`faction-${initialData.factionId}`)
    }

    const handleDeleteEntry = (id: string) => {
        if (confirm('Are you sure you want to delete this lore entry?')) {
            removeLoreEntry(currentCampaignId, id)
            if (selectedEntryId === id) {
                setSelectedEntryId(null)
                setIsEditing(false)
            }
        }
    }

    const continents = lore.filter(l => l.category === 'continent')
    const characterJournals = lore.filter(l => l.category === 'character_journal')
    const handouts = lore.filter(l => l.category === 'handout')

    const getCities = (continentId?: string) => lore.filter(l => l.category === 'city' && l.continentId === continentId)
    const getFactions = (continentId?: string, cityId?: string) => lore.filter(l => l.category === 'faction' && l.continentId === continentId && l.cityId === cityId)
    const getNPCs = (continentId?: string, cityId?: string, factionId?: string) => lore.filter(l => l.category === 'npc' && l.continentId === continentId && l.cityId === cityId && l.factionId === factionId)

    const globalCities = getCities(undefined)
    const globalFactions = getFactions(undefined, undefined)
    const globalNPCs = getNPCs(undefined, undefined, undefined)

    const allCities = lore.filter(l => l.category === 'city').sort((a, b) => a.title.localeCompare(b.title))
    const allFactions = lore.filter(l => l.category === 'faction').sort((a, b) => a.title.localeCompare(b.title))
    const allNPCs = lore.filter(l => l.category === 'npc').sort((a, b) => a.title.localeCompare(b.title))

    const getParentContext = (entry: LoreEntry) => {
        const parts = []
        if (entry.cityId) {
            const city = lore.find(l => l.id === entry.cityId)
            if (city) parts.push(city.title)
        }
        if (entry.continentId) {
            const continent = lore.find(l => l.id === entry.continentId)
            if (continent) parts.push(continent.title)
        }
        return parts.length > 0 ? `[${parts.join(', ')}]` : ''
    }

    const searchResults = searchQuery.trim() === '' ? [] : lore.filter(l => {
        const query = searchQuery.toLowerCase()
        return (l.title || '').toLowerCase().includes(query) ||
            (l.publicContent || '').toLowerCase().includes(query) ||
            (l.secretContent || '').toLowerCase().includes(query)
    })

    const searchResultsByCategory = (category: LoreCategory) => searchResults.filter(l => l.category === category)

    return (
        <FolderContext.Provider value={folderContextValue}>
            <div className="flex h-full w-full max-w-[1400px] mx-auto overflow-hidden bg-ui-surface rounded-xl border border-ui-surface2 my-4">

                <div className="w-80 border-r border-ui-surface2 flex flex-col bg-ui-bg/50 shrink-0">
                    <div className="p-4 border-b border-ui-surface2 flex justify-between items-center bg-ui-surface shrink-0">
                        <h2 className="font-display font-semibold text-ui-text">World Wiki</h2>
                    </div>

                    <div className="p-3 border-b border-ui-surface2 bg-ui-bg/30 shrink-0">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search lore..."
                                className="w-full bg-ui-surface border border-ui-surface2 rounded-lg pl-8 pr-3 py-1.5 text-xs text-ui-text focus:border-hope-primary outline-none transition-colors"
                            />
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ui-muted text-xs">🔍</span>
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ui-muted hover:text-ui-text text-[10px]">✕</button>
                            )}
                        </div>
                    </div>

                    <div className="flex bg-ui-surface2 p-1 rounded-lg mx-3 mt-3 shrink-0">
                        <button
                            onClick={() => setSidebarView('category')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${sidebarView === 'category' ? 'bg-ui-surface text-ui-text shadow-sm' : 'text-ui-muted hover:text-ui-text'}`}
                        >
                            🗂️ Categories
                        </button>
                        <button
                            onClick={() => setSidebarView('geography')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${sidebarView === 'geography' ? 'bg-ui-surface text-ui-text shadow-sm' : 'text-ui-muted hover:text-ui-text'}`}
                        >
                            🗺️ Geography
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">

                        {searchQuery.trim() !== '' ? (
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold text-ui-muted uppercase tracking-wider mb-2 px-2">Search Results ({searchResults.length})</span>
                                {searchResults.length === 0 && <span className="text-[10px] text-ui-muted italic pl-2">No entries found.</span>}

                                {(Object.keys(CATEGORY_LABELS) as LoreCategory[]).map(category => {
                                    const results = searchResultsByCategory(category)
                                    if (results.length === 0) return null
                                    return (
                                        <div key={category} className="mb-3">
                                            <div className="text-[10px] font-bold text-ui-muted uppercase tracking-wider mb-1 px-2 border-b border-ui-surface2 pb-1">
                                                {CATEGORY_LABELS[category]} ({results.length})
                                            </div>
                                            {results.map(entry => (
                                                <FolderNode key={entry.id} id={`search-${entry.id}`} entryId={entry.id} title={entry.title || 'Unnamed Entry'} isEntry />
                                            ))}
                                        </div>
                                    )
                                })}
                            </div>
                        ) : sidebarView === 'category' ? (
                            <>
                                <FolderNode id="cat-continents" title="🗺️ All Continents" onAdd={() => handleCreateEntry('continent')}>
                                    {continents.length === 0 && <span className="text-[10px] text-ui-muted italic pl-4 py-1">No continents</span>}
                                    {continents.map(continent => (
                                        <FolderNode key={continent.id} id={`cat-continent-${continent.id}`} entryId={continent.id} title={continent.title || 'Unnamed Continent'} isEntry />
                                    ))}
                                </FolderNode>

                                <FolderNode id="cat-cities" title="🏰 All Cities" onAdd={() => handleCreateEntry('city')}>
                                    {allCities.length === 0 && <span className="text-[10px] text-ui-muted italic pl-4 py-1">No cities</span>}
                                    {allCities.map(city => (
                                        <FolderNode key={city.id} id={`cat-city-${city.id}`} entryId={city.id} title={city.title || 'Unnamed City'} subtitle={getParentContext(city)} isEntry />
                                    ))}
                                </FolderNode>

                                <FolderNode id="cat-factions" title="⚔️ All Factions" onAdd={() => handleCreateEntry('faction')}>
                                    {allFactions.length === 0 && <span className="text-[10px] text-ui-muted italic pl-4 py-1">No factions</span>}
                                    {allFactions.map(faction => (
                                        <FolderNode key={faction.id} id={`cat-faction-${faction.id}`} entryId={faction.id} title={faction.title || 'Unnamed Faction'} subtitle={getParentContext(faction)} isEntry />
                                    ))}
                                </FolderNode>

                                <FolderNode id="cat-npcs" title="👤 All NPCs" onAdd={() => handleCreateEntry('npc')}>
                                    {allNPCs.length === 0 && <span className="text-[10px] text-ui-muted italic pl-4 py-1">No NPCs</span>}
                                    {allNPCs.map(npc => (
                                        <FolderNode key={npc.id} id={`cat-npc-${npc.id}`} entryId={npc.id} title={npc.title || 'Unnamed NPC'} subtitle={getParentContext(npc)} isEntry />
                                    ))}
                                </FolderNode>

                                <div className="mt-4 pt-2 border-t border-ui-surface2">
                                    <FolderNode id="cat-handouts" title="📜 Handouts & Clues" onAdd={() => handleCreateEntry('handout')}>
                                        {handouts.length === 0 && <span className="text-[10px] text-ui-muted italic pl-4 py-1">No handouts</span>}
                                        {handouts.map(h => (
                                            <FolderNode key={h.id} id={`cat-handout-${h.id}`} entryId={h.id} title={h.title || 'Unnamed Handout'} isEntry />
                                        ))}
                                    </FolderNode>
                                </div>

                                <FolderNode id="cat-journals" title="📖 Character Journals" onAdd={() => handleCreateEntry('character_journal')}>
                                    {characterJournals.length === 0 && <span className="text-[10px] text-ui-muted italic pl-4 py-1">No journals</span>}
                                    {characterJournals.map(j => (
                                        <FolderNode key={j.id} id={`cat-journal-${j.id}`} entryId={j.id} title={j.title || 'Unnamed Journal'} isEntry />
                                    ))}
                                </FolderNode>
                            </>
                        ) : (
                            <>
                                {continents.map(continent => {
                                    const cities = getCities(continent.id)
                                    const continentFactions = getFactions(continent.id, undefined)
                                    const continentNPCs = getNPCs(continent.id, undefined, undefined)

                                    return (
                                        <FolderNode key={continent.id} id={`geo-continent-${continent.id}`} entryId={continent.id} title={`🗺️ ${continent.title || 'Unnamed Continent'}`} isEntry>

                                            {cities.map(city => {
                                                const cityFactions = getFactions(continent.id, city.id)
                                                const cityNPCs = getNPCs(continent.id, city.id, undefined)
                                                return (
                                                    <FolderNode key={city.id} id={`geo-city-${city.id}`} entryId={city.id} title={`🏰 ${city.title || 'Unnamed City'}`} isEntry>
                                                        {cityFactions.map(faction => {
                                                            const factionNPCs = getNPCs(continent.id, city.id, faction.id)
                                                            return (
                                                                <FolderNode key={faction.id} id={`geo-faction-${faction.id}`} entryId={faction.id} title={`⚔️ ${faction.title || 'Unnamed Faction'}`} isEntry>
                                                                    {factionNPCs.map(npc => (
                                                                        <FolderNode key={npc.id} id={`geo-npc-${npc.id}`} entryId={npc.id} title={`👤 ${npc.title || 'Unnamed NPC'}`} isEntry />
                                                                    ))}
                                                                </FolderNode>
                                                            )
                                                        })}
                                                        {cityNPCs.map(npc => (
                                                            <FolderNode key={npc.id} id={`geo-npc-${npc.id}`} entryId={npc.id} title={`👤 ${npc.title || 'Unnamed NPC'}`} isEntry />
                                                        ))}
                                                    </FolderNode>
                                                )
                                            })}

                                            {continentFactions.map(faction => {
                                                const factionNPCs = getNPCs(continent.id, undefined, faction.id)
                                                return (
                                                    <FolderNode key={faction.id} id={`geo-faction-${faction.id}`} entryId={faction.id} title={`⚔️ ${faction.title || 'Unnamed Faction'}`} isEntry>
                                                        {factionNPCs.map(npc => (
                                                            <FolderNode key={npc.id} id={`geo-npc-${npc.id}`} entryId={npc.id} title={`👤 ${npc.title || 'Unnamed NPC'}`} isEntry />
                                                        ))}
                                                    </FolderNode>
                                                )
                                            })}

                                            {continentNPCs.map(npc => (
                                                <FolderNode key={npc.id} id={`geo-npc-${npc.id}`} entryId={npc.id} title={`👤 ${npc.title || 'Unnamed NPC'}`} isEntry />
                                            ))}

                                        </FolderNode>
                                    )
                                })}

                                {(globalCities.length > 0 || globalFactions.length > 0 || globalNPCs.length > 0) && (
                                    <div className="mt-2 pt-2 border-t border-ui-surface2">
                                        <FolderNode id="geo-global" title="🌍 Global / Unassigned">
                                            {globalCities.map(city => {
                                                const cityFactions = getFactions(undefined, city.id)
                                                const cityNPCs = getNPCs(undefined, city.id, undefined)
                                                return (
                                                    <FolderNode key={city.id} id={`geo-city-${city.id}`} entryId={city.id} title={`🏰 ${city.title || 'Unnamed City'}`} isEntry>
                                                        {cityFactions.map(faction => {
                                                            const factionNPCs = getNPCs(undefined, city.id, faction.id)
                                                            return (
                                                                <FolderNode key={faction.id} id={`geo-faction-${faction.id}`} entryId={faction.id} title={`⚔️ ${faction.title || 'Unnamed Faction'}`} isEntry>
                                                                    {factionNPCs.map(npc => (
                                                                        <FolderNode key={npc.id} id={`geo-npc-${npc.id}`} entryId={npc.id} title={`👤 ${npc.title || 'Unnamed NPC'}`} isEntry />
                                                                    ))}
                                                                </FolderNode>
                                                            )
                                                        })}
                                                        {cityNPCs.map(npc => (
                                                            <FolderNode key={npc.id} id={`geo-npc-${npc.id}`} entryId={npc.id} title={`👤 ${npc.title || 'Unnamed NPC'}`} isEntry />
                                                        ))}
                                                    </FolderNode>
                                                )
                                            })}

                                            {globalFactions.map(faction => {
                                                const factionNPCs = getNPCs(undefined, undefined, faction.id)
                                                return (
                                                    <FolderNode key={faction.id} id={`geo-faction-${faction.id}`} entryId={faction.id} title={`⚔️ ${faction.title || 'Unnamed Faction'}`} isEntry>
                                                        {factionNPCs.map(npc => (
                                                            <FolderNode key={npc.id} id={`geo-npc-${npc.id}`} entryId={npc.id} title={`👤 ${npc.title || 'Unnamed NPC'}`} isEntry />
                                                        ))}
                                                    </FolderNode>
                                                )
                                            })}

                                            {globalNPCs.map(npc => (
                                                <FolderNode key={npc.id} id={`geo-npc-${npc.id}`} entryId={npc.id} title={`👤 ${npc.title || 'Unnamed NPC'}`} isEntry />
                                            ))}
                                        </FolderNode>
                                    </div>
                                )}

                                <div className="mt-4 pt-2 border-t border-ui-surface2">
                                    <FolderNode id="geo-handouts" title="📜 Handouts & Clues" onAdd={() => handleCreateEntry('handout')}>
                                        {handouts.length === 0 && <span className="text-[10px] text-ui-muted italic pl-4 py-1">No handouts</span>}
                                        {handouts.map(h => (
                                            <FolderNode key={h.id} id={`geo-handout-${h.id}`} entryId={h.id} title={h.title || 'Unnamed Handout'} isEntry />
                                        ))}
                                    </FolderNode>

                                    <FolderNode id="geo-journals" title="📖 Character Journals" onAdd={() => handleCreateEntry('character_journal')}>
                                        {characterJournals.length === 0 && <span className="text-[10px] text-ui-muted italic pl-4 py-1">No journals</span>}
                                        {characterJournals.map(j => (
                                            <FolderNode key={j.id} id={`geo-journal-${j.id}`} entryId={j.id} title={j.title || 'Unnamed Journal'} isEntry />
                                        ))}
                                    </FolderNode>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden bg-ui-surface">
                    {!selectedEntry ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4">
                            <p className="text-ui-muted text-sm text-center">Select an entry from the Lore Wiki or create a new one.</p>
                            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                                {(Object.entries(CATEGORY_LABELS) as [LoreCategory, string][]).map(([key, label]) => (
                                    <button
                                        key={key}
                                        onClick={() => handleCreateEntry(key)}
                                        className="px-3 py-1.5 bg-ui-surface2 hover:bg-ui-surface text-ui-text text-xs rounded-lg transition-colors border border-ui-surface2 hover:border-hope-primary"
                                    >
                                        + {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="p-6 border-b border-ui-surface2 flex flex-col gap-4">
                                <div className="flex justify-between items-start gap-4">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={selectedEntry.title}
                                            onChange={(e) => updateLoreEntry(currentCampaignId, selectedEntry.id, { title: e.target.value })}
                                            className="flex-1 bg-ui-bg border border-ui-surface2 rounded-lg px-4 py-2 text-ui-text font-display font-semibold text-lg focus:border-hope-primary outline-none transition-colors"
                                            placeholder="Entry Title..."
                                        />
                                    ) : (
                                        <div className="flex-1 flex flex-col gap-1">
                                            <div className="flex items-center gap-3">
                                                <h1 className="text-2xl font-display font-bold text-ui-text leading-none">{selectedEntry.title || 'Untitled'}</h1>
                                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-ui-surface2 text-ui-muted">
                                                    {CATEGORY_LABELS[selectedEntry.category].split(' ')[1] || CATEGORY_LABELS[selectedEntry.category]}
                                                </span>
                                            </div>
                                            <p className="text-xs text-ui-muted">
                                                {isPlayerView ? 'Showing Public View' : 'Showing DM View (Includes Secrets)'}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 shrink-0">
                                        {!isEditing && (
                                            <button
                                                onClick={() => setIsPlayerView(!isPlayerView)}
                                                className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors border flex items-center gap-2 ${isPlayerView
                                                    ? 'bg-ui-surface2 text-ui-text border-ui-surface2'
                                                    : 'bg-fear-light/20 text-fear-light border-fear-light/30'
                                                    }`}
                                            >
                                                <span className={`w-2 h-2 rounded-full ${isPlayerView ? 'bg-ui-muted' : 'bg-fear-light'}`} />
                                                {isPlayerView ? 'Player View' : 'DM View'}
                                            </button>
                                        )}

                                        <div className="w-px h-6 bg-ui-surface2" />

                                        <button
                                            onClick={() => {
                                                if (!isEditing) {
                                                    setPublicMode('write')
                                                    setSecretMode('write')
                                                }
                                                setIsEditing(!isEditing)
                                                setIsPlayerView(false)
                                            }}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isEditing
                                                ? 'bg-ui-surface2 text-ui-text hover:bg-ui-surface'
                                                : 'bg-hope-primary text-white hover:bg-hope-gold'
                                                }`}
                                        >
                                            {isEditing ? 'Done Editing' : 'Edit'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteEntry(selectedEntry.id)}
                                            className="px-3 py-2 bg-ui-surface2 text-fear-light hover:bg-fear-light hover:text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {isEditing && selectedEntry.category !== 'continent' && selectedEntry.category !== 'character_journal' && selectedEntry.category !== 'handout' && (
                                    <div className="flex flex-wrap gap-4 pt-4 border-t border-ui-surface2 mt-2">

                                        <div className="flex flex-col gap-1.5 w-48">
                                            <label className="text-[10px] font-semibold text-ui-muted uppercase tracking-wider">Continent</label>
                                            <select
                                                value={selectedEntry.continentId || ''}
                                                onChange={(e) => updateLoreEntry(currentCampaignId, selectedEntry.id, {
                                                    continentId: e.target.value || undefined,
                                                    cityId: undefined,
                                                    factionId: undefined
                                                })}
                                                className="bg-ui-bg border border-ui-surface2 rounded px-2 py-1.5 text-ui-text text-xs focus:border-hope-primary outline-none"
                                            >
                                                <option value="">None (Global)</option>
                                                {continents.map(c => (
                                                    <option key={c.id} value={c.id}>{c.title}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {(selectedEntry.category === 'faction' || selectedEntry.category === 'npc') && (
                                            <div className="flex flex-col gap-1.5 w-48">
                                                <label className="text-[10px] font-semibold text-ui-muted uppercase tracking-wider">City</label>
                                                <select
                                                    value={selectedEntry.cityId || ''}
                                                    onChange={(e) => updateLoreEntry(currentCampaignId, selectedEntry.id, {
                                                        cityId: e.target.value || undefined,
                                                        factionId: undefined
                                                    })}
                                                    disabled={!selectedEntry.continentId}
                                                    className="bg-ui-bg border border-ui-surface2 rounded px-2 py-1.5 text-ui-text text-xs focus:border-hope-primary outline-none disabled:opacity-50"
                                                >
                                                    <option value="">None (Continent-wide)</option>
                                                    {selectedEntry.continentId && getCities(selectedEntry.continentId).map(c => (
                                                        <option key={c.id} value={c.id}>{c.title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {selectedEntry.category === 'npc' && (
                                            <div className="flex flex-col gap-1.5 w-48">
                                                <label className="text-[10px] font-semibold text-ui-muted uppercase tracking-wider">Faction</label>
                                                <select
                                                    value={selectedEntry.factionId || ''}
                                                    onChange={(e) => updateLoreEntry(currentCampaignId, selectedEntry.id, { factionId: e.target.value || undefined })}
                                                    className="bg-ui-bg border border-ui-surface2 rounded px-2 py-1.5 text-ui-text text-xs focus:border-hope-primary outline-none"
                                                >
                                                    <option value="">None (Independent)</option>
                                                    {lore.filter(l => l.category === 'faction' &&
                                                        (l.continentId === selectedEntry.continentId) &&
                                                        (!l.cityId || l.cityId === selectedEntry.cityId)
                                                    ).map(f => (
                                                        <option key={f.id} value={f.id}>{f.title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                    </div>
                                )}

                                {isEditing && selectedEntry.category === 'handout' && (
                                    <div className="flex flex-wrap gap-4 pt-4 border-t border-ui-surface2 mt-2">
                                        <div className="flex flex-col gap-1.5 w-64">
                                            <label className="text-[10px] font-semibold text-ui-muted uppercase tracking-wider">Linked Scene</label>
                                            <select
                                                value={selectedEntry.sceneId || ''}
                                                onChange={(e) => updateLoreEntry(currentCampaignId, selectedEntry.id, { sceneId: e.target.value || undefined })}
                                                className="bg-ui-bg border border-ui-surface2 rounded px-2 py-1.5 text-ui-text text-xs focus:border-hope-primary outline-none"
                                            >
                                                <option value="">None</option>
                                                {currentCampaign.scenes?.map(s => (
                                                    <option key={s.id} value={s.id}>{s.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                                            <label className="text-[10px] font-semibold text-ui-muted uppercase tracking-wider">Image URL (Optional)</label>
                                            <input
                                                type="text"
                                                value={selectedEntry.imageUrl || ''}
                                                onChange={(e) => updateLoreEntry(currentCampaignId, selectedEntry.id, { imageUrl: e.target.value })}
                                                className="bg-ui-bg border border-ui-surface2 rounded px-3 py-1.5 text-ui-text text-xs focus:border-hope-primary outline-none"
                                                placeholder="https://example.com/map.jpg"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                                {isEditing ? (
                                    <>
                                        <div className="flex flex-col gap-2 flex-1 min-h-[300px]">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <label className="text-xs font-semibold text-ui-text uppercase tracking-wider">
                                                        {selectedEntry.category === 'character_journal' ? 'Character Notes' : 'Public Lore'}
                                                    </label>
                                                    <div className="flex bg-ui-bg border border-ui-surface2 rounded p-0.5">
                                                        <button onClick={() => setPublicMode('write')} className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${publicMode === 'write' ? 'bg-ui-surface text-ui-text shadow-sm' : 'text-ui-muted hover:text-ui-text'}`}>Write</button>
                                                        <button onClick={() => setPublicMode('preview')} className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${publicMode === 'preview' ? 'bg-ui-surface text-ui-text shadow-sm' : 'text-ui-muted hover:text-ui-text'}`}>Preview</button>
                                                    </div>
                                                </div>
                                                <span className="text-ui-muted text-[10px] normal-case font-normal">Players can see this</span>
                                            </div>
                                            {publicMode === 'write' ? (
                                                <textarea
                                                    value={selectedEntry.publicContent}
                                                    onChange={(e) => updateLoreEntry(currentCampaignId, selectedEntry.id, { publicContent: e.target.value })}
                                                    className="w-full h-full bg-ui-bg border border-ui-surface2 rounded-xl p-4 text-ui-text text-sm focus:border-hope-primary outline-none transition-colors resize-none font-mono"
                                                    placeholder={selectedEntry.category === 'character_journal' ? "Write character backstories, session notes, or items here..." : "Write public history, descriptions, or known facts..."}
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-ui-surface border border-ui-surface2 rounded-xl p-4 overflow-y-auto prose max-w-none">
                                                    {selectedEntry.publicContent ? (
                                                        <SharedMarkdown>{selectedEntry.publicContent}</SharedMarkdown>
                                                    ) : (
                                                        <p className="italic opacity-50 text-sm">Nothing written yet.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {selectedEntry.category !== 'character_journal' && (
                                            <div className="flex flex-col gap-2 flex-1 min-h-[250px]">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <label className="text-xs font-semibold text-fear-light uppercase tracking-wider">
                                                            DM Secrets
                                                        </label>
                                                        <div className="flex bg-ui-bg border border-ui-surface2 rounded p-0.5">
                                                            <button onClick={() => setSecretMode('write')} className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${secretMode === 'write' ? 'bg-ui-surface text-ui-text shadow-sm' : 'text-ui-muted hover:text-ui-text'}`}>Write</button>
                                                            <button onClick={() => setSecretMode('preview')} className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${secretMode === 'preview' ? 'bg-ui-surface text-ui-text shadow-sm' : 'text-ui-muted hover:text-ui-text'}`}>Preview</button>
                                                        </div>
                                                    </div>
                                                    <span className="text-fear-light/60 text-[10px] normal-case font-normal">Hidden in Player View</span>
                                                </div>
                                                {secretMode === 'write' ? (
                                                    <textarea
                                                        value={selectedEntry.secretContent}
                                                        onChange={(e) => updateLoreEntry(currentCampaignId, selectedEntry.id, { secretContent: e.target.value })}
                                                        className="w-full h-full bg-fear-light/5 border border-fear-light/20 rounded-xl p-4 text-ui-text text-sm focus:border-fear-light outline-none transition-colors resize-none font-mono"
                                                        placeholder="Write hidden motivations, traps, stats, or upcoming twists..."
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-fear-light/5 border border-fear-light/20 rounded-xl p-5 overflow-y-auto prose prose-secret max-w-none">
                                                        {selectedEntry.secretContent ? (
                                                            <SharedMarkdown>{selectedEntry.secretContent}</SharedMarkdown>
                                                        ) : (
                                                            <p className="italic opacity-50 text-sm">Nothing written yet.</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {selectedEntry.sceneId && (
                                            <div className="mb-2">
                                                <span className="text-[10px] font-semibold uppercase tracking-wider bg-hope-primary/20 text-hope-gold px-2 py-1 rounded">
                                                    📍 Found in scene: {currentCampaign.scenes?.find(s => s.id === selectedEntry.sceneId)?.title || 'Unknown Scene'}
                                                </span>
                                            </div>
                                        )}
                                        {selectedEntry.imageUrl && (
                                            <div className="mb-6 rounded-xl overflow-hidden border border-ui-surface2">
                                                <img src={selectedEntry.imageUrl} alt={selectedEntry.title} className="w-full h-auto max-h-[500px] object-contain bg-black/50" />
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-2">
                                            <div className="prose max-w-none">
                                                {selectedEntry.publicContent ? (
                                                    <SharedMarkdown>{selectedEntry.publicContent}</SharedMarkdown>
                                                ) : (
                                                    <p className="italic opacity-50 text-sm">No public content written.</p>
                                                )}
                                            </div>
                                        </div>

                                        {!isPlayerView && selectedEntry.secretContent && selectedEntry.category !== 'character_journal' && (
                                            <div className="flex flex-col gap-2 mt-4 pt-6 border-t border-fear-light/20">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="w-2 h-2 rounded-full bg-fear-light"></span>
                                                    <h3 className="text-fear-light font-semibold text-sm uppercase tracking-wider">DM Secrets</h3>
                                                </div>
                                                <div className="bg-fear-light/5 border border-fear-light/20 rounded-xl p-5 prose prose-secret max-w-none">
                                                    <SharedMarkdown>{selectedEntry.secretContent}</SharedMarkdown>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </FolderContext.Provider>
    )
}

export default CampaignJournal
