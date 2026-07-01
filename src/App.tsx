import { useEffect } from 'react'
import { Routes, Route, Outlet } from 'react-router-dom'
import { useFearStore } from './store/fearStore'
import { useSettingsStore } from './store/settingsStore'
import { useVaultStore } from './vault/vaultStore'
import Sidebar from './components/Sidebar'
import TitleBar from './components/TitleBar'
import DMDashboard from './pages/DMDashboard'
import SceneTracker from './pages/SceneTracker'
import EnvironmentCards from './pages/EnvironmentCards'
import DMScreen from './pages/DMScreen'
import MusicPlayer from './pages/MusicPlayer'
import WorldWiki from './pages/WorldWiki'
import CampaignMap from './pages/CampaignMap'
import Campaigns from './pages/Campaigns'
import EncounterBuilder from './pages/EncounterBuilder'
import MusicBar from './components/MusicBar'
import { SoundboardProvider } from './context/SoundboardContext'
import AmbientBar from './components/AmbientBar'
import SoundQuickBar from './components/SoundQuickBar'
import Soundboard from './pages/Soundboard'
import PlayerScreen from './pages/PlayerScreen'
import Settings from './pages/Settings'

function Layout() {
  useEffect(() => {
    window.electron.player.setFear(useFearStore.getState().fearCount)
    return useFearStore.subscribe((state) => {
      window.electron.player.setFear(state.fearCount)
    })
  }, [])

  useEffect(() => {
    useVaultStore.getState().load()
  }, [])

  const fontSize = useSettingsStore((s) => s.fontSize)
  useEffect(() => {
    const sizes: Record<string, string> = { sm: '14px', md: '16px', lg: '18px' }
    document.documentElement.style.fontSize = sizes[fontSize] ?? '16px'
  }, [fontSize])

  return (
    <div className="flex flex-col h-screen bg-ui-bg">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-6 bg-ui-canvas overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <SoundQuickBar />
      <MusicBar />
      <AmbientBar />
    </div>
  )
}

function App() {
  return (
    <SoundboardProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DMDashboard />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/scenes" element={<SceneTracker />} />
          <Route path="/cards" element={<EnvironmentCards />} />
          <Route path="/encounter" element={<EncounterBuilder />} />
          <Route path="/dm-screen" element={<DMScreen />} />
          <Route path="/music" element={<MusicPlayer />} />
          <Route path="/journal" element={<WorldWiki />} />
          <Route path="/map" element={<CampaignMap />} />
          <Route path="/soundboard" element={<Soundboard />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="/player-screen" element={<PlayerScreen />} />
      </Routes>
    </SoundboardProvider>
  )
}

export default App
