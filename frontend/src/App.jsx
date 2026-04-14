import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Aim from './pages/Aim'
import Objectives from './pages/Objectives'
import Theory from './pages/Theory'
import Simulation from './pages/Simulation'
import Analysis from './pages/Analysis'
import Quiz from './pages/Quiz'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: '#0B0F14', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1, overflow: 'hidden' }}>
          <Routes>
            <Route path="/"           element={<Navigate to="/aim" replace />} />
            <Route path="/aim"        element={<Aim />} />
            <Route path="/objectives" element={<Objectives />} />
            <Route path="/theory"     element={<Theory />} />
            <Route path="/simulation" element={<Simulation />} />
            <Route path="/analysis"   element={<Analysis />} />
            <Route path="/quiz"       element={<Quiz />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
