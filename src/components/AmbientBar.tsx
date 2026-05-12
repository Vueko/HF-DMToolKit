import { useSoundboardStore } from '../store/soundboardStore'
import { useSoundboard } from '../context/SoundboardContext'

function AmbientBar() {
    const { activeAmbientIds, sounds } = useSoundboardStore()
    const { stopAmbient, stopAllAmbients } = useSoundboard()

    const activeAmbients = sounds.filter((s) => activeAmbientIds.includes(s.id))

    if (activeAmbients.length === 0) return null

    return (
        <div className="bg-ui-surface border-t border-fear-light/20 px-4 py-2 flex items-center gap-3 flex-wrap shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-fear-light">
                Ambients
            </span>
            {activeAmbients.map((sound) => (
                <button
                    key={sound.id}
                    onClick={() => stopAmbient(sound.id)}
                    className="bg-fear-light/15 hover:bg-fear-light/25 text-fear-light rounded-lg px-3 py-1 text-xs flex items-center gap-1.5 transition-colors"
                >
                    {sound.name}
                    <span className="opacity-60 text-[10px]">✕</span>
                </button>
            ))}
            <button
                onClick={stopAllAmbients}
                className="ml-auto text-xs text-ui-muted hover:text-red-400 transition-colors"
            >
                Detener todo
            </button>
        </div>
    )
}

export default AmbientBar
