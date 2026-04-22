import { Routes, Route } from 'react-router-dom'
import DMDashboard from './pages/DMDashboard'
import SceneTracker from './pages/SceneTracker'
import FearTracker from './pages/FearTracker'
import EnvironmentCards from './pages/EnvironmentCards'
import DMScreen from './pages/DMScreen'
import MusicPlayer from './pages/MusicPlayer'
import CampaignJournal from './pages/CampaignJournal'
import CampaignMap from './pages/CampaignMap'

function App() {
  return (
    <Routes>
      <Route path="/" element={<DMDashboard />} />
      <Route path="/dashboard" element={<DMDashboard />} />
      <Route path="/scenes" element={<SceneTracker />} />
      <Route path="/fear" element={<FearTracker />} />
      <Route path="/cards" element={<EnvironmentCards />} />
      <Route path="/dm-screen" element={<DMScreen />} />
      <Route path="/music" element={<MusicPlayer />} />
      <Route path="/journal" element={<CampaignJournal />} />
      <Route path="/map" element={<CampaignMap />} />
    </Routes>
  )
}

export default App
