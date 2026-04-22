import { create } from 'zustand'

interface Scene {
    id: string;
    title: string;
    summary: string;
    status: 'upcoming' | 'active' | 'completed';
}

interface SessionState {
    currentSceneId: string | null;
    scenes: Scene[];
    addScene: (scene: Scene) => void;
    updateScene: (id: string, updates: Partial<Scene>) => void;
    setCurrentScene: (id: string | null) => void;
    removeScene: (id: string) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
    currentSceneId: null,
    scenes: [],
    addScene: (scene) =>
        set((state) => ({ scenes: [...state.scenes, scene] })),
    updateScene: (id, updates) =>
        set((state) => ({
            scenes: state.scenes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),
    setCurrentScene: (id) =>
        set({ currentSceneId: id }),
    removeScene: (id) =>
        set((state) => ({ scenes: state.scenes.filter((s) => s.id !== id) })),
}))