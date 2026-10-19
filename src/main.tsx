import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import App from './app/App'
import { useAuthStore } from './store/authSlice'
import { useObligationsStore } from './features/obligations/store/obligationsSlice'

if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as { __dev?: unknown }).__dev = {
    useAuthStore,
    useObligationsStore,
    unlock: () => {
      useAuthStore.setState({
        isAuthenticated: true,
        isUnlocked: true,
        user: { name: "Gabriel Demo", email: "gabriel@tuchauchera.cl", sub: "demo-user", picture: "" },
      })
    },
  }
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('[Tu Chauchera] Root element #root not found in DOM')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
)
