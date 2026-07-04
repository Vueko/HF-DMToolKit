import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PageLoader } from './components/ui'
import { useFearStore } from './store/fearStore'
import { useSettingsStore } from './store/settingsStore'
import { useVaultStore } from './vault/vaultStore'
import Sidebar from './components/Sidebar'
import TitleBar from './components/TitleBar'
import MusicBar from './components/MusicBar'
import { SoundboardProvider } from './context/SoundboardContext'
import AmbientBar from './components/AmbientBar'
import SoundQuickBar from './components/SoundQuickBar'
import { UpdateNotification } from './components/UpdateNotification'
import { useUpdateStore } from './store/updateStore'

const DMDashboard = lazy(() => import('./pages/DMDashboard'))
const SceneTracker = lazy(() => import('./pages/SceneTracker'))
const EnvironmentCards = lazy(() => import('./pages/EnvironmentCards'))
const DMScreen = lazy(() => import('./pages/DMScreen'))
const MusicPlayer = lazy(() => import('./pages/MusicPlayer'))
const WorldWiki = lazy(() => import('./pages/WorldWiki'))
const CampaignMap = lazy(() => import('./pages/CampaignMap'))
const Campaigns = lazy(() => import('./pages/Campaigns'))
const EncounterBuilder = lazy(() => import('./pages/EncounterBuilder'))
const Soundboard = lazy(() => import('./pages/Soundboard'))
const Settings = lazy(() => import('./pages/Settings'))
const PlayerScreen = lazy(() => import('./pages/PlayerScreen'))

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

  const theme = useSettingsStore((s) => s.theme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const uiScale = useSettingsStore((s) => s.uiScale)
  useEffect(() => {
    window.electron.setZoom(uiScale)
  }, [uiScale])

  useEffect(() => {
    const off = window.electron.updater.onEvent((ev) => useUpdateStore.getState().apply(ev))
    window.electron.updater.check()
    return off
  }, [])

  const location = useLocation()

  return (
    <div className="flex flex-col h-screen bg-ui-bg">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-6 bg-ui-canvas overflow-y-auto">
          <Suspense fallback={<PageLoader />}>
            <ErrorBoundary key={location.pathname} variant="page">
              <div className="page-fade h-full">
                <Outlet />
              </div>
            </ErrorBoundary>
          </Suspense>
        </main>
      </div>
      <SoundQuickBar />
      <MusicBar />
      <AmbientBar />
      <UpdateNotification />
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary variant="root">
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
          <Route
            path="/player-screen"
            element={
              <Suspense fallback={<PageLoader />}>
                <PlayerScreen />
              </Suspense>
            }
          />
        </Routes>
      </SoundboardProvider>
    </ErrorBoundary>
  )
}

export default App
