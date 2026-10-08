import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './themes.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' })
      .then((registration) => {
        const checkForUpdates = () => {
          if (document.visibilityState === 'visible') {
            void registration.update().catch(() => undefined)
          }
        }

        document.addEventListener('visibilitychange', checkForUpdates)
        window.setInterval(checkForUpdates, 60 * 60 * 1000)
      })
      .catch(() => undefined)
  })
}
