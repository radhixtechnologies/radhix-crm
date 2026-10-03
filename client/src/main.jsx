import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import logo from './assets/radhix-technologies-logo.webp'

const favicon = document.querySelector('link[rel="icon"]')
if (favicon) {
  favicon.href = logo
  favicon.type = 'image/webp'
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
