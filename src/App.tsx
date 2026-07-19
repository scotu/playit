import { Routes, Route, Navigate } from 'react-router'
import HomeScreen from './routes/HomeScreen'
import PlayScreen from './routes/PlayScreen'
import PwaUpdater from './pwa/PwaUpdater'

export default function App() {
  return (
    <>
      <PwaUpdater />
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/play" element={<PlayScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
