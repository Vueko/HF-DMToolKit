import { Routes, Route, Outlet } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import DMDashboard from './pages/DMDashboard'
import SceneTracker from './pages/SceneTracker'
import FearTracker from './pages/FearTracker'
import EnvironmentCards from './pages/EnvironmentCards'
import DMScreen from './pages/DMScreen'
import MusicPlayer from './pages/MusicPlayer'
import CampaignJournal from './pages/CampaignJournal'
import CampaignMap from './pages/CampaignMap'


function Layout() {
  return (
    <div className="flex min-h-screen bg-ui-bg">
      <Sidebar />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DMDashboard />} />
        <Route path="/scenes" element={<SceneTracker />} />
        <Route path="/fear" element={<FearTracker />} />
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
