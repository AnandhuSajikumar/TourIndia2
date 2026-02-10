import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import { StateProvider } from './state/StateContext.jsx'
import { AuthProvider } from './state/AuthContext.jsx'



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StateProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StateProvider>
  </StrictMode>,
)
