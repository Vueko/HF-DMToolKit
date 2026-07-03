import { useSettingsStore } from '../store/settingsStore'
import type { FontSize } from '../store/settingsStore'
import { PageHeader } from '../components/ui'

const SIZE_OPTIONS: { value: FontSize; label: string; description: string }[] = [
    { value: 'sm', label: 'Small', description: '14px' },
    { value: 'md', label: 'Medium', description: '16px' },
    { value: 'lg', label: 'Large', description: '18px' },
]

function Settings() {
    const { fontSize, setFontSize } = useSettingsStore()

    return (
        <div className="flex flex-col gap-6">
            <PageHeader title="Settings" subtitle="Customize your DaggerHeart Toolkit experience" />

            <div className="bg-ui-surface rounded-xl border border-ui-surface2/60 p-5 flex flex-col gap-4">
                <div>
                    <h3 className="text-ui-text font-display font-semibold">Display</h3>
                    <p className="text-ui-muted text-sm">Adjust the text size across the entire app</p>
                </div>
                <div className="flex gap-2">
                    {SIZE_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setFontSize(opt.value)}
                            className={`flex flex-col items-center gap-0.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                fontSize === opt.value
                                    ? 'bg-fear-light text-ui-text'
                                    : 'bg-ui-surface2 text-ui-muted hover:text-ui-text hover:bg-ui-surface2/80'
                            }`}
                        >
                            <span>{opt.label}</span>
                            <span className="text-[10px] opacity-60">{opt.description}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Settings
