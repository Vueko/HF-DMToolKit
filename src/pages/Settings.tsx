import { useEffect, useState } from 'react'
import { useSettingsStore, THEMES, UI_SCALES } from '../store/settingsStore'
import type { Theme } from '../store/settingsStore'
import { PageHeader, Panel, Button } from '../components/ui'
import { useVaultStore } from '../vault/vaultStore'
import { BackupControls } from '../components/BackupControls'
import { useUpdateStore } from '../store/updateStore'
import { useT } from '../i18n'

const SCALE_LABELS: Record<number, string> = { 0.9: '90%', 1.0: '100%', 1.1: '110%', 1.25: '125%' }
const THEME_LABELS: Record<Theme, string> = { midnight: 'Midnight', ember: 'Ember', slate: 'Slate', daylight: 'Daylight' }

function Settings() {
    const { uiScale, setUiScale, theme, setTheme, vaultPath, setVaultPath, language, setLanguage } = useSettingsStore()
    const pickVault = useVaultStore((s) => s.pickVault)
    const [version, setVersion] = useState('')
    const t = useT()
    useEffect(() => { window.electron.getVersion().then(setVersion) }, [])

    const updateStatus = useUpdateStore((s) => s.status)
    const updateVersion = useUpdateStore((s) => s.version)
    const updatePercent = useUpdateStore((s) => s.percent)
    const updateError = useUpdateStore((s) => s.error)
    const updateText =
        updateStatus === 'checking' ? t('settings.updateStatusChecking')
        : updateStatus === 'available' ? t('settings.updateStatusAvailable', { version: updateVersion ?? '' })
        : updateStatus === 'not-available' ? t('settings.updateStatusUpToDate')
        : updateStatus === 'downloading' ? t('settings.updateStatusDownloading', { percent: updatePercent })
        : updateStatus === 'downloaded' ? t('settings.updateStatusDownloaded', { version: updateVersion ?? '' })
        : updateStatus === 'error' ? (updateError ?? t('settings.updateStatusErrorDefault'))
        : ''

    const disconnectVault = () => {
        setVaultPath(null)
        useVaultStore.setState({ tree: null, notes: [], noteIndex: new Map(), imageIndex: new Map(), status: 'empty' })
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

            <Panel className="flex flex-col gap-4">
                <div>
                    <h3 className="text-ui-text font-display font-semibold">{t('settings.appearance')}</h3>
                    <p className="text-ui-muted text-sm">{t('settings.appearanceSubtitle')}</p>
                </div>

                <div className="flex flex-col gap-2">
                    <p className="text-ui-muted text-xs uppercase tracking-wider font-bold">{t('settings.interfaceScale')}</p>
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
                    <p className="text-ui-muted text-xs uppercase tracking-wider font-bold">{t('settings.theme')}</p>
                    <div className="flex gap-2 flex-wrap">
                        {THEMES.map((th) => (
                            <button
                                key={th}
                                onClick={() => setTheme(th)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    theme === th ? 'bg-accent text-accent-fg' : 'bg-ui-surface2 text-ui-muted hover:text-ui-text'
                                }`}
                            >
                                {THEME_LABELS[th]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <p className="text-ui-muted text-xs uppercase tracking-wider font-bold">{t('settings.language')}</p>
                    <div className="flex gap-2">
                        {(['en', 'es'] as const).map((l) => (
                            <button
                                key={l}
                                onClick={() => setLanguage(l)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    language === l ? 'bg-accent text-accent-fg' : 'bg-ui-surface2 text-ui-muted hover:text-ui-text'
                                }`}
                            >
                                {l === 'en' ? 'English' : 'Español'}
                            </button>
                        ))}
                    </div>
                </div>
            </Panel>

            <Panel className="flex flex-col gap-3">
                <div>
                    <h3 className="text-ui-text font-display font-semibold">{t('settings.vaultTitle')}</h3>
                    <p className="text-ui-muted text-sm">{t('settings.vaultSubtitle')}</p>
                </div>
                <p className="text-ui-text text-sm bg-ui-bg/40 rounded-lg px-3 py-2 truncate">
                    {vaultPath ?? t('settings.vaultNotConnected')}
                </p>
                <div className="flex gap-2">
                    <Button variant="primary" onClick={() => pickVault()}>{vaultPath ? t('settings.changeFolder') : t('settings.connectVault')}</Button>
                    {vaultPath && <Button variant="secondary" onClick={disconnectVault}>{t('settings.disconnect')}</Button>}
                </div>
            </Panel>

            <Panel className="flex flex-col gap-3">
                <div>
                    <h3 className="text-ui-text font-display font-semibold">{t('settings.backupTitle')}</h3>
                    <p className="text-ui-muted text-sm">{t('settings.backupSubtitle')}</p>
                </div>
                <BackupControls />
            </Panel>

            <Panel className="flex flex-col gap-2">
                <h3 className="text-ui-text font-display font-semibold">{t('settings.about')}</h3>
                <p className="text-ui-muted text-sm">{t('settings.aboutVersion', { version: version || '—' })}</p>
                <a href="https://github.com/Vueko/HF-DMToolKit" target="_blank" rel="noreferrer" className="text-accent hover:underline text-sm w-fit">
                    {t('settings.githubRepo')}
                </a>
            </Panel>

            <Panel className="flex flex-col gap-2">
                <h3 className="text-ui-text font-display font-semibold">{t('settings.legalTitle')}</h3>
                <p className="text-ui-muted text-sm leading-relaxed">{t('settings.legalBody')}</p>
                <a href="https://darringtonpress.com/license/" target="_blank" rel="noreferrer" className="text-accent hover:underline text-sm w-fit">
                    Darrington Press Community Gaming License
                </a>
            </Panel>
            <Panel className="flex flex-col gap-3">
                <div>
                    <h3 className="text-ui-text font-display font-semibold">{t('settings.updatesTitle')}</h3>
                    <p className="text-ui-muted text-sm">{t('settings.updatesSubtitle')}</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <Button
                        variant="secondary"
                        onClick={() => window.electron.updater.check()}
                        disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
                    >
                        {t('settings.checkUpdates')}
                    </Button>
                    {updateText && <span className="text-ui-muted text-sm">{updateText}</span>}
                </div>
            </Panel>
        </div>
    )
}

export default Settings
