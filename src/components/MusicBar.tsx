import { useMusicStore } from '../store/musicStore'

function MusicBar() {
    const { currentTrack, isPlaying, togglePlay } = useMusicStore()

    return (
        <div className="h-16 bg-ui-surface border-t border-ui-surface2 flex items-center px-6 shrink-0">

            <div className="flex items-center gap-3 w-1/3">
                <div className="w-10 h-10 rounded bg-ui-surface2 flex items-center justify-center text-ui-muted text-lg shrink-0">
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-ui-text text-sm font-medium truncate">
                        {currentTrack ? currentTrack.title : 'No track selected'}
                    </span>
                    <span className="text-ui-muted text-xs truncate">
                        {currentTrack ? currentTrack.artist : '—'}
                    </span>
                </div>
            </div>

            <div className="flex items-center justify-center gap-4 w-1/3">
                <button className="text-ui-muted hover:text-ui-text transition-colors text-lg">
                    ⏮
                </button>
                <button
                    onClick={togglePlay}
                    className="w-9 h-9 rounded-full bg-hope-primary hover:bg-hope-gold flex items-center justify-center text-white transition-colors"
                >
                    {isPlaying ? '⏸' : '▶'}
                </button>
                <button className="text-ui-muted hover:text-ui-text transition-colors text-lg">
                    ⏭
                </button>
            </div>

            <div className="flex items-center justify-end gap-2 w-1/3">
                <span className="text-ui-muted text-sm">🔊</span>
                <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="75"
                    className="w-24 accent-hope-primary"
                />
                <span className="text-ui-muted text-xs w-8">75%</span>
            </div>

        </div>
    )
}

export default MusicBar

