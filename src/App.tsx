import { Routes, Route, Outlet } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import DMDashboard from './pages/DMDashboard'
import SceneTracker from './pages/SceneTracker'
import EnvironmentCards from './pages/EnvironmentCards'
import DMScreen from './pages/DMScreen'
import MusicPlayer from './pages/MusicPlayer'
import CampaignJournal from './pages/CampaignJournal'
import CampaignMap from './pages/CampaignMap'
import Campaigns from './pages/Campaigns'
import MusicBar from './components/MusicBar'

function Layout() {
  return (
    <div className="flex flex-col h-screen bg-ui-bg">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-6 bg-ui-canvas overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <MusicBar />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DMDashboard />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/scenes" element={<SceneTracker />} />
        <Route path="/cards" element={<EnvironmentCards />} />
        <Route path="/dm-screen" element={<DMScreen />} />
        <Route path="/music" element={<MusicPlayer />} />
        <Route path="/journal" element={<CampaignJournal />} />
        <Route path="/map" element={<CampaignMap />} />
      </Route>
    </Routes>
  )
}

export default App
