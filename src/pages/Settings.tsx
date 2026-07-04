import { useEffect, useState } from 'react'
import { useSettingsStore, THEMES, UI_SCALES } from '../store/settingsStore'
import type { Theme } from '../store/settingsStore'
import { PageHeader, Panel, Button } from '../components/ui'
import { useVaultStore } from '../vault/vaultStore'
import { BackupControls } from '../components/BackupControls'
import { useUpdateStore } from '../store/updateStore'

const SCALE_LABELS: Record<number, string> = { 0.9: '90%', 1.0: '100%', 1.1: '110%', 1.25: '125%' }
const THEME_LABELS: Record<Theme, string> = { midnight: 'Midnight', ember: 'Ember', slate: 'Slate', daylight: 'Daylight' }

function Settings() {
    const { uiScale, setUiScale, theme, setTheme, vaultPath, setVaultPath } = useSettingsStore()
    const pickVault = useVaultStore((s) => s.pickVault)
    const [version, setVersion] = useState('')
    useEffect(() => { window.electron.getVersion().then(setVersion) }, [])

    const updateStatus = useUpdateStore((s) => s.status)
    const updateVersion = useUpdateStore((s) => s.version)
    const updatePercent = useUpdateStore((s) => s.percent)
    const updateError = useUpdateStore((s) => s.error)
    const updateText =
        updateStatus === 'checking' ? 'Comprobando…'
        : updateStatus === 'available' ? `Disponible: v${updateVersion}`
        : updateStatus === 'not-available' ? 'Estás al día'
        : updateStatus === 'downloading' ? `Descargando… ${updatePercent}%`
        : updateStatus === 'downloaded' ? `Descargada v${updateVersion} — reinicia para instalar`
        : updateStatus === 'error' ? (updateError ?? 'Error')
        : ''

    const disconnectVault = () => {
        setVaultPath(null)
        useVaultStore.setState({ tree: null, notes: [], noteIndex: new Map(), imageIndex: new Map(), status: 'empty' })
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader title="Settings" subtitle="Customize your DaggerHeart Toolkit experience" />

            <Panel className="flex flex-col gap-4">
                <div>
                    <h3 className="text-ui-text font-display font-semibold">Appearance</h3>
                    <p className="text-ui-muted text-sm">Interface scale and theme</p>
                </div>

                <div className="flex flex-col gap-2">
                    <p className="text-ui-muted text-xs uppercase tracking-wider font-bold">Interface scale</p>
                    <div className="flex gap-2">
                        {UI_SCALES.map((s) => (
                            <button
                                key={s}
                                onClick={() => setUiScale(s)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    uiScale === s ? 'bg-accent text-accent-fg' : 'bg-ui-surface2 text-ui-muted hover:text-ui-text'
                                }`}
                            >
                                {SCALE_LABELS[s]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <p className="text-ui-muted text-xs uppercase tracking-wider font-bold">Theme</p>
                    <div className="flex gap-2 flex-wrap">
                        {THEMES.map((t) => (
                            <button
                                key={t}
                                onClick={() => setTheme(t)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    theme === t ? 'bg-accent text-accent-fg' : 'bg-ui-surface2 text-ui-muted hover:text-ui-text'
                                }`}
                            >
                                {THEME_LABELS[t]}
                            </button>
                        ))}
                    </div>
                </div>
            </Panel>

            <Panel className="flex flex-col gap-3">
                <div>
                    <h3 className="text-ui-text font-display font-semibold">Vault (Obsidian)</h3>
                    <p className="text-ui-muted text-sm">Carpeta del vault para el World Wiki</p>
                </div>
                <p className="text-ui-text text-sm bg-ui-bg/40 rounded-lg px-3 py-2 truncate">
                    {vaultPath ?? 'Sin vault conectado'}
                </p>
                <div className="flex gap-2">
                    <Button variant="primary" onClick={() => pickVault()}>{vaultPath ? 'Cambiar carpeta' : 'Conectar vault'}</Button>
                    {vaultPath && <Button variant="secondary" onClick={disconnectVault}>Desconectar</Button>}
                </div>
            </Panel>

            <Panel className="flex flex-col gap-3">
                <div>
                    <h3 className="text-ui-text font-display font-semibold">Backup</h3>
                    <p className="text-ui-muted text-sm">Exporta o restaura todos tus datos</p>
                </div>
                <BackupControls />
            </Panel>

            <Panel className="flex flex-col gap-2">
                <h3 className="text-ui-text font-display font-semibold">Acerca de</h3>
                <p className="text-ui-muted text-sm">DaggerHeart Toolkit · v{version || '—'}</p>
                <a href="https://github.com/Vueko/DaggerHeart-ToolKit" target="_blank" rel="noreferrer" className="text-accent hover:underline text-sm w-fit">
                    Repositorio en GitHub →
                </a>
            </Panel>

            <Panel className="flex flex-col gap-3">
                <div>
                    <h3 className="text-ui-text font-display font-semibold">Actualizaciones</h3>
                    <p className="text-ui-muted text-sm">Busca e instala nuevas versiones</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <Button
                        variant="secondary"
                        onClick={() => window.electron.updater.check()}
                        disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
                    >
                        Buscar actualizaciones
                    </Button>
                    {updateText && <span className="text-ui-muted text-sm">{updateText}</span>}
                </div>
            </Panel>
        </div>
    )
}

export default Settings
