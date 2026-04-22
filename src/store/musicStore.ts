import { create } from 'zustand';
import type { Track } from '../types';

interface MusicState {
    currentTrack: Track | null;
    playlist: Track[];
    isPlaying: boolean;

    setTrack: (track: Track | null) => void
    addToPlaylist: (track: Track) => void;
    removeFromPlaylist: (id: string) => void;
    togglePlay: () => void;
}

export const useMusicStore = create<MusicState>((set) => ({
    currentTrack: null,
    playlist: [],
    isPlaying: false,

    setTrack: (track) =>
        set({ currentTrack: track, isPlaying: track !== null }),
    addToPlaylist: (track) =>
        set((state) => ({ playlist: [...state.playlist, track] })),
    removeFromPlaylist: (id) =>
        set((state) => ({ playlist: state.playlist.filter((t) => t.id !== id) })),
    togglePlay: () =>
        set((state) => ({ isPlaying: !state.isPlaying })),
}))