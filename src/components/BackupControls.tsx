import { Button } from './ui'
import { buildFullExport, parseImport, mergeCampaignBlobs, FULL_STORE_KEYS } from '../utils/backup'

export function BackupControls() {
    const handleExport = async () => {
        const blobs: Record<string, string | null> = {}
        await Promise.all(FULL_STORE_KEYS.map(async (key) => {
            const value = await window.electron.store.get(key)
            blobs[key] = typeof value === 'string' ? value : null
        }))
        const envelope = buildFullExport(blobs)
        await window.electron.dialog.saveJson(JSON.stringify(envelope, null, 2), {
            defaultPath: `daggerheart-backup-${new Date().toISOString().split('T')[0]}.json`,
            filters: [{ name: 'JSON Backup', extensions: ['json'] }],
        })
    }

    const handleImport = async () => {
        const result = await window.electron.dialog.openJson({
            filters: [{ name: 'JSON Backup', extensions: ['json'] }],
        })
        if (result.canceled) return
        if (!result.content) { alert('No se pudo leer el archivo.'); return }
        const parsed = parseImport(result.content)
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

    return (
        <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleImport} title="Importar datos desde un backup">↓ Import Data</Button>
            <Button variant="secondary" onClick={handleExport} title="Exportar todos los datos a un archivo JSON">↑ Export Data</Button>
        </div>
    )
}
