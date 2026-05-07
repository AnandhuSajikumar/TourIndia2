import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'

import Home from './pages/Home.jsx'
import ExploreMap from './pages/ExploreMap.jsx'
import RoamIndia from './pages/RoamIndia.jsx'
import Chatbot from './pages/Chatbot.jsx'
import Marketplace from './pages/Marketplace.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import NotFound from './pages/NotFound.jsx'
import Signup from './pages/Signup.jsx'
import Login from './pages/Login.jsx'
import { socket } from './lib/socket.js'
import Itinerary from './pages/Itinerary.jsx'
import { useTourismState } from './state/StateContext.jsx'

function App() {
  useEffect(() => {
    socket.on('welcome', () => {})
    return () => socket.off('welcome')
  }, [])

  const { states, selected, setSelected } = useTourismState()
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })

  useEffect(() => {
    function onStorage() {
      try { const raw = localStorage.getItem('user'); setUser(raw ? JSON.parse(raw) : null) } catch { setUser(null) }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    // reload to reset any state and routes
    window.location.href = '/'
  }

  return (
    <BrowserRouter>
      <div className="app-shell text-gray-900">
        <header className="app-header border-b">
          <nav className="content-container app-nav">
            <Link to="/" className="brand d-flex align-items-center gap-2">
              <div className="brand-icon-wrapper">
                <i className="bi bi-compass-fill"></i>
              </div>
              <span>ROAM INDIA</span>
            </Link>
            <div className="nav-actions">
              <div className="state-select-wrapper">
                <i className="bi bi-geo-alt-fill me-2 text-primary"></i>
                <select className="state-select form-select form-select-sm" value={selected} onChange={(e) => setSelected(e.target.value)}>
                  {states
                    .map((s) => s.name)
                    .sort((a, b) => {
                      if (a === selected) return -1
                      if (b === selected) return 1
                      return a.localeCompare(b)
                    })
                    .map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                </select>
              </div>
              <div className="nav-links">
                <Link to="/roam" className="nav-link-item">
                  <i className="bi bi-globe me-1"></i>
                  <span className="d-none d-md-inline">Roam</span>
                </Link>
                <Link to="/map" className="nav-link-item">
                  <i className="bi bi-map me-1"></i>
                  <span className="d-none d-md-inline">Map</span>
                </Link>
                <Link to="/itinerary" className="nav-link-item">
                  <i className="bi bi-calendar-check me-1"></i>
                  <span className="d-none d-md-inline">Itinerary</span>
                </Link>
                <Link to="/chat" className="nav-link-item">
                  <i className="bi bi-chat-dots me-1"></i>
                  <span className="d-none d-md-inline">Chat</span>
                </Link>
                <Link to="/market" className="nav-link-item">
                  <i className="bi bi-shop me-1"></i>
                  <span className="d-none d-md-inline">Market</span>
                </Link>
                <Link to="/admin" className="nav-link-item">
                  <i className="bi bi-graph-up-arrow me-1"></i>
                  <span className="d-none d-md-inline">Analytics</span>
                </Link>
              </div>
              {user ? (
                <div className="account d-flex align-items-center gap-2">
                  <div className="user-avatar bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                    <i className="bi bi-person-fill text-primary"></i>
                  </div>
                  <span className="d-none d-md-inline small fw-medium">{user.name || user.email}</span>
                  <button className="btn btn-sm btn-outline-danger rounded-pill" onClick={logout}>
                    <i className="bi bi-box-arrow-right me-1"></i>
                    <span className="d-none d-md-inline">Logout</span>
                  </button>
                </div>
              ) : (
                <div className="auth-links d-flex align-items-center gap-2">
                  <Link to="/login" className="btn btn-sm btn-outline-primary rounded-pill">
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                    <span className="d-none d-md-inline">Login</span>
                  </Link>
                  <Link to="/signup" className="btn btn-sm btn-primary rounded-pill">
                    <i className="bi bi-person-plus me-1"></i>
                    <span className="d-none d-md-inline">Sign up</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </header>
        <main className="app-main content-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/itinerary" element={<Itinerary />} />
            <Route path="/roam" element={<RoamIndia />} />
            <Route path="/map" element={<ExploreMap />} />
            <Route path="/chat" element={<Chatbot />} />
            <Route path="/market" element={<Marketplace />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer className="app-footer border-t">
          <div className="content-container py-4 text-xs text-gray-600 d-flex justify-content-between flex-wrap gap-2">
            <span>© {new Date().getFullYear()} Government of India — Digital Tourism Platform</span>
            <span className="text-muted">Empowering sustainable journeys across Bharat</span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
