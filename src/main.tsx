import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import App from './app/App'

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
