import type { Sound } from '../../types'

const MOOD_OPTIONS = ['calm', 'tense', 'epic', 'mystery', 'ambient'] as const
type SoundMood = typeof MOOD_OPTIONS[number]

const MOOD_COLORS: Record<SoundMood, string> = {
    calm: 'bg-hope-secondary/15 text-hope-secondary border-hope-secondary/25',
    tense: 'bg-hope-primary/15 text-hope-primary border-hope-primary/25',
    epic: 'bg-hope-yellow/15 text-hope-yellow border-hope-yellow/25',
    mystery: 'bg-fear-light/15 text-fear-light border-fear-light/25',
    ambient: 'bg-ui-muted/15 text-ui-muted border-ui-muted/25',
}

interface SoundButtonProps {
    sound: Sound
    isActive: boolean
    onPlay: () => void
    onRemove: () => void
    onMoodChange?: (mood: SoundMood | undefined) => void
}

function SoundButton({ sound, isActive, onPlay, onRemove, onMoodChange }: SoundButtonProps) {
    const buttonClass =
        sound.type === 'ambient' && isActive
            ? 'bg-fear-light text-ui-canvas'
            : sound.type === 'ambient'
            ? 'bg-ui-surface2 text-ui-text border border-fear-light/30 hover:bg-ui-surface2/80'
            : 'bg-ui-surface2 text-ui-text border border-ui-surface2/60 hover:bg-ui-surface2/80'

    return (
        <div className="relative group/btn flex flex-col gap-1">
            <button
                onClick={onPlay}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${buttonClass}`}
            >
                {sound.name}
                {sound.type === 'ambient' && (
                    <span className="text-[9px] ml-1.5 opacity-60">loop</span>
                )}
                {sound.mood && (
                    <span className={`ml-1.5 text-[9px] font-bold uppercase px-1 py-0.5 rounded border ${MOOD_COLORS[sound.mood as SoundMood]}`}>
                        {sound.mood[0].toUpperCase()}
                    </span>
                )}
            </button>

            {onMoodChange && (
                <div className="flex gap-0.5 opacity-0 group-hover/btn:opacity-100 transition-opacity">
                    {MOOD_OPTIONS.map((m) => (
                        <button
                            key={m}
                            onClick={(e) => { e.stopPropagation(); onMoodChange(sound.mood === m ? undefined : m) }}
                            className={`text-[8px] font-bold uppercase px-1 py-0.5 rounded border transition-colors ${
                                sound.mood === m
                                    ? MOOD_COLORS[m]
                                    : 'border-transparent text-ui-muted/40 hover:text-ui-muted'
                            }`}
                            title={m}
                        >
                            {m[0].toUpperCase()}
                        </button>
                    ))}
                </div>
            )}

            <button
                onClick={(e) => { e.stopPropagation(); onRemove() }}
                className="absolute -top-1.5 -right-1.5 opacity-0 group-hover/btn:opacity-100 bg-ui-canvas border border-ui-surface2 rounded-full text-red-400 hover:text-red-300 text-[10px] w-4 h-4 flex items-center justify-center transition-opacity"
            >
                ✕
            </button>
        </div>
    )
}

export default SoundButton
