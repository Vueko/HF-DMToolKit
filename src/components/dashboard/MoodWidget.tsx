import { useCampaignStore } from '../../store/campaignStore'
import { useMusicStore } from '../../store/musicStore'
import type { Track } from '../../types'

type Mood = 'calm' | 'tense' | 'epic' | 'mystery' | 'ambient'

const MOODS: { mood: Mood; label: string; active: string; inactive: string }[] = [
    { mood: 'calm',    label: 'Calm',    active: 'bg-blue-500/40 text-blue-100 border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.4)]',       inactive: 'bg-blue-500/10 text-blue-400 border-blue-500/40 hover:bg-blue-500/20' },
    { mood: 'tense',   label: 'Tense',   active: 'bg-red-500/40 text-red-100 border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]',            inactive: 'bg-red-500/10 text-red-400 border-red-500/40 hover:bg-red-500/20' },
    { mood: 'epic',    label: 'Epic',    active: 'bg-yellow-500/40 text-yellow-100 border-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.4)]',   inactive: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40 hover:bg-yellow-500/20' },
    { mood: 'mystery', label: 'Mystery', active: 'bg-purple-500/40 text-purple-100 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]',  inactive: 'bg-purple-500/10 text-purple-400 border-purple-500/40 hover:bg-purple-500/20' },
    { mood: 'ambient', label: 'Ambient', active: 'bg-green-500/40 text-green-100 border-green-400 shadow-[0_0_8px_rgba(34,197,94,0.4)]',     inactive: 'bg-green-500/10 text-green-400 border-green-500/40 hover:bg-green-500/20' },
]

function MoodWidget() {
    const { campaigns, currentCampaignId } = useCampaignStore()
    const { activePlaylistId, currentTrackIndex, isPlaying, setActivePlaylistId, setCurrentTrackIndex, setIsPlaying } = useMusicStore()

    const campaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const playlists = campaign?.playlists ?? []

    const activePlaylist = playlists.find((p) => p.id === activePlaylistId) ?? null
    const activeTrack: Track | null = activePlaylist?.tracks[currentTrackIndex] ?? null
    const currentMood = activeTrack?.mood ?? null

    const handleMoodPlay = (mood: Mood) => {
        const candidates: { playlistId: string; trackIndex: number }[] = []
        for (const pl of playlists) {
            pl.tracks.forEach((track, idx) => {
                if (track.mood === mood) candidates.push({ playlistId: pl.id, trackIndex: idx })
            })
        }
        if (candidates.length === 0) return

        const filtered = candidates.length > 1
            ? candidates.filter((c) => !(c.playlistId === activePlaylistId && c.trackIndex === currentTrackIndex))
            : candidates
        const pick = filtered[Math.floor(Math.random() * filtered.length)]

        const store = useMusicStore.getState()
        if (!store.loop) store.toggleLoop()

        setActivePlaylistId(pick.playlistId)
        setCurrentTrackIndex(pick.trackIndex)
        setIsPlaying(true)
    }

    const hasTracks = (mood: Mood) =>
        playlists.some((pl) => pl.tracks.some((t) => t.mood === mood))

    return (
        <div className="flex items-center gap-1.5">
            {MOODS.map(({ mood, label, active, inactive }) => {
                const isActive = currentMood === mood && isPlaying
                const available = hasTracks(mood)
                return (
                    <button
                        key={mood}
                        onClick={() => handleMoodPlay(mood)}
                        disabled={!available}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                            isActive ? active : `bg-transparent ${inactive}`
                        }`}
                        title={available ? `Play random ${label} track` : `No tracks tagged as "${label}"`}
                    >
                        {label}
                    </button>
                )
            })}
        </div>
    )
}

export default MoodWidget
