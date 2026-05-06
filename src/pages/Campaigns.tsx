import { useState } from 'react'
import { useCampaignStore } from '../store/campaignStore'
import type { Campaign, Session } from '../types'

function Campaigns() {
    const {
        campaigns,
        currentCampaignId,
        currentSessionId,
        addCampaign,
        removeCampaign,
        addSession,
        removeSession,
        setCurrentSession,
    } = useCampaignStore()

    const [newCampaignName, setNewCampaignName] = useState('')
    const [newSessionName, setNewSessionName] = useState('')
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)

    const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId) ?? null

    const handleExport = async () => {
        const result = await window.electron.dialog.save({
            defaultPath: `daggerheart-backup-${new Date().toISOString().split('T')[0]}.json`,
            filters: [{ name: 'JSON Backup', extensions: ['json'] }],
        })
        if (result.canceled || !result.filePath) return

        const [campaigns, music, fear, cards] = await Promise.all([
            window.electron.store.get('dh-campaigns'),
            window.electron.store.get('dh-music'),
            window.electron.store.get('dh-fear'),
            window.electron.store.get('dh-cards'),
        ])

        const data = { 'dh-campaigns': campaigns, 'dh-music': music, 'dh-fear': fear, 'dh-cards': cards }
        await window.electron.fs.writeFile(result.filePath, JSON.stringify(data, null, 2))
    }

    const handleImport = async () => {
        const result = await window.electron.dialog.open({
            filters: [{ name: 'JSON Backup', extensions: ['json'] }],
            properties: ['openFile'],
        })
        if (result.canceled || result.filePaths.length === 0) return

        try {
            const content = await window.electron.fs.readFile(result.filePaths[0])
            if (!content) return
            const data = JSON.parse(content)

            let imported = false
            if (data['dh-campaigns']) { window.electron.store.set('dh-campaigns', data['dh-campaigns']); imported = true }
            if (data['dh-music']) { window.electron.store.set('dh-music', data['dh-music']); imported = true }
            if (data['dh-fear']) { window.electron.store.set('dh-fear', data['dh-fear']); imported = true }
            if (data['dh-cards']) { window.electron.store.set('dh-cards', data['dh-cards']); imported = true }

            if (imported) {
                alert('Datos importados correctamente. La aplicación se reiniciará.')
                window.location.reload()
            } else {
                alert('No se encontraron datos válidos en el archivo.')
            }
        } catch {
            alert('Archivo de backup inválido.')
        }
    }

    function handleAddCampaign() {
        if (!newCampaignName.trim()) return
        const campaign: Campaign = {
            id: crypto.randomUUID(),
            name: newCampaignName.trim(),
            scenes: [],
            sessions: [],
            lore: [],
            playlists: [],
        }
        addCampaign(campaign)
        setNewCampaignName('')
        setSelectedCampaignId(campaign.id)
    }

    function handleAddSession() {
        if (!newSessionName.trim() || !selectedCampaignId) return
        const sessionCount = selectedCampaign?.sessions.length ?? 0
        const session: Session = {
            id: crypto.randomUUID(),
            name: newSessionName.trim(),
            number: sessionCount + 1,
            sceneIds: [],
            cardInstances: [],
        }
        addSession(selectedCampaignId, session)
        setNewSessionName('')
    }

    function handleSetActive(campaignId: string, sessionId: string) {
        setCurrentSession(campaignId, sessionId)
    }

    return (
        <div className="flex flex-col gap-6">

            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-ui-text font-display text-2xl font-bold">Campaigns</h1>
                    <p className="text-ui-muted text-sm">Manage your campaigns and sessions</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleImport}
                        className="px-4 py-2 bg-ui-surface2 hover:bg-ui-surface border border-ui-surface2 text-ui-text text-sm rounded-lg transition-colors shadow-sm"
                        title="Importar datos desde un backup"
                    >
                        ↓ Import Data
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-ui-surface2 hover:bg-ui-surface border border-ui-surface2 text-ui-text text-sm rounded-lg transition-colors shadow-sm"
                        title="Exportar todos los datos a un archivo JSON"
                    >
                        ↑ Export Data
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">

                <div className="flex flex-col gap-3">
                    <h2 className="text-ui-text font-semibold text-sm">Campaigns</h2>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newCampaignName}
                            onChange={(e) => setNewCampaignName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddCampaign()}
                            placeholder="Campaign name..."
                            className="flex-1 bg-ui-surface2 text-ui-text text-sm px-3 py-2 rounded-lg outline-none border border-ui-surface2 focus:border-fear-light"
                        />
                        <button
                            onClick={handleAddCampaign}
                            className="px-3 py-2 bg-fear-light hover:bg-fear-secondary text-ui-text text-sm rounded-lg transition-colors"
                        >
                            Add
                        </button>
                    </div>

                    <div className="flex flex-col gap-2">
                        {campaigns.length === 0 && (
                            <p className="text-ui-muted text-sm text-center py-4">No campaigns yet.</p>
                        )}
                        {campaigns.map((c) => (
                            <div
                                key={c.id}
                                onClick={() => setSelectedCampaignId(c.id)}
                                className={`flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-colors border ${
                                    selectedCampaignId === c.id
                                        ? 'bg-ui-surface2 border-fear-light'
                                        : 'bg-ui-surface border-ui-surface2 hover:bg-ui-surface2'
                                }`}
                            >
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-ui-text text-sm font-medium">{c.name}</span>
                                    <span className="text-ui-muted text-xs">{c.sessions.length} sessions</span>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeCampaign(c.id) }}
                                    className="text-ui-muted hover:text-red-400 transition-colors text-xs"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <h2 className="text-ui-text font-semibold text-sm">
                        Sessions {selectedCampaign ? `— ${selectedCampaign.name}` : ''}
                    </h2>

                    {!selectedCampaign ? (
                        <p className="text-ui-muted text-sm text-center py-4">Select a campaign to manage sessions.</p>
                    ) : (
                        <>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newSessionName}
                                    onChange={(e) => setNewSessionName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSession()}
                                    placeholder="Session name..."
                                    className="flex-1 bg-ui-surface2 text-ui-text text-sm px-3 py-2 rounded-lg outline-none border border-ui-surface2 focus:border-fear-light"
                                />
                                <button
                                    onClick={handleAddSession}
                                    className="px-3 py-2 bg-fear-light hover:bg-fear-secondary text-ui-text text-sm rounded-lg transition-colors"
                                >
                                    Add
                                </button>
                            </div>

                            <div className="flex flex-col gap-2">
                                {selectedCampaign.sessions.length === 0 && (
                                    <p className="text-ui-muted text-sm text-center py-4">No sessions yet.</p>
                                )}
                                {selectedCampaign.sessions.map((s) => {
                                    const isActive = currentCampaignId === selectedCampaignId && currentSessionId === s.id
                                    return (
                                        <div
                                            key={s.id}
                                            className={`flex items-center justify-between px-3 py-3 rounded-lg border transition-colors ${
                                                isActive
                                                    ? 'bg-ui-surface2 border-hope-primary'
                                                    : 'bg-ui-surface border-ui-surface2'
                                            }`}
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-ui-text text-sm font-medium">
                                                    Session {s.number} — {s.name}
                                                </span>
                                                <span className="text-ui-muted text-xs">
                                                    {s.cardInstances.length} cards · {s.sceneIds.length} scenes
                                                </span>
                                                {isActive && (
                                                    <span className="text-hope-primary text-xs font-semibold">Active Session</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!isActive && (
                                                    <button
                                                        onClick={() => handleSetActive(selectedCampaignId!, s.id)}
                                                        className="text-xs px-2 py-1 bg-ui-surface2 hover:bg-hope-primary text-ui-muted hover:text-white rounded-lg transition-colors"
                                                    >
                                                        Set Active
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => removeSession(selectedCampaignId!, s.id)}
                                                    className="text-ui-muted hover:text-red-400 transition-colors text-xs"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>

            </div>
        </div>
    )
}

export default Campaigns
