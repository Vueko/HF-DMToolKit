import { useState } from 'react'
import { useCampaignStore } from '../store/campaignStore'
import type { Campaign, Session } from '../types'
import { Button, Input, PageHeader, EmptyState } from '../components/ui'
import { buildFullExport, parseImport, mergeCampaignBlobs, FULL_STORE_KEYS } from '../utils/backup'

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

        const blobs: Record<string, string | null> = {}
        await Promise.all(FULL_STORE_KEYS.map(async (key) => {
            const value = await window.electron.store.get(key)
            blobs[key] = typeof value === 'string' ? value : null
        }))

        const envelope = buildFullExport(blobs)
        await window.electron.fs.writeFile(result.filePath, JSON.stringify(envelope, null, 2))
    }

    const handleImport = async () => {
        const result = await window.electron.dialog.open({
            filters: [{ name: 'JSON Backup', extensions: ['json'] }],
            properties: ['openFile'],
        })
        if (result.canceled || result.filePaths.length === 0) return

        const content = await window.electron.fs.readFile(result.filePaths[0])
        if (!content) { alert('No se pudo leer el archivo.'); return }

        const parsed = parseImport(content)
        if (parsed.kind !== 'full') {
            alert(parsed.kind === 'invalid' ? parsed.reason : 'El archivo no es un backup completo.')
            return
        }

        for (const key of FULL_STORE_KEYS) {
            const incoming = parsed.data[key]
            if (typeof incoming !== 'string') continue
            if (key === 'dh-campaigns') {
                const current = await window.electron.store.get('dh-campaigns')
                const currentBlob = typeof current === 'string' ? current : null
                window.electron.store.set(key, mergeCampaignBlobs(currentBlob, incoming))
            } else {
                window.electron.store.set(key, incoming)
            }
        }

        alert('Datos importados correctamente. La aplicación se recargará.')
        window.location.reload()
    }

    function handleAddCampaign() {
        if (!newCampaignName.trim()) return
        const campaign: Campaign = {
            id: crypto.randomUUID(),
            name: newCampaignName.trim(),
            scenes: [],
            sessions: [],
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
            encounterIds: [],
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

            <PageHeader title="Campaigns" subtitle="Manage your campaigns and sessions">
                <Button variant="secondary" onClick={handleImport} title="Importar datos desde un backup">
                    ↓ Import Data
                </Button>
                <Button variant="secondary" onClick={handleExport} title="Exportar todos los datos a un archivo JSON">
                    ↑ Export Data
                </Button>
            </PageHeader>

            <div className="grid grid-cols-2 gap-6">

                <div className="flex flex-col gap-3">
                    <h2 className="text-ui-text font-semibold text-sm">Campaigns</h2>

                    <div className="flex gap-2">
                        <Input
                            theme="hope"
                            type="text"
                            value={newCampaignName}
                            onChange={(e) => setNewCampaignName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddCampaign()}
                            placeholder="Campaign name..."
                            className="flex-1"
                        />
                        <Button variant="primary" size="sm" onClick={handleAddCampaign}>Add</Button>
                    </div>

                    <div className="flex flex-col gap-2">
                        {campaigns.length === 0 && (
                            <EmptyState size="sm" title="No campaigns yet." />
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
                                <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); removeCampaign(c.id) }}>
                                    Delete
                                </Button>
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
                                <Input
                                    theme="hope"
                                    type="text"
                                    value={newSessionName}
                                    onChange={(e) => setNewSessionName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSession()}
                                    placeholder="Session name..."
                                    className="flex-1"
                                />
                                <Button variant="primary" size="sm" onClick={handleAddSession}>Add</Button>
                            </div>

                            <div className="flex flex-col gap-2">
                                {selectedCampaign.sessions.length === 0 && (
                                    <EmptyState size="sm" title="No sessions yet." />
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
                                                    <Button variant="secondary" size="sm" onClick={() => handleSetActive(selectedCampaignId!, s.id)}>
                                                        Set Active
                                                    </Button>
                                                )}
                                                <Button variant="destructive" size="sm" onClick={() => removeSession(selectedCampaignId!, s.id)}>
                                                    Delete
                                                </Button>
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
