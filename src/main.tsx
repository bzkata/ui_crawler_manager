import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './api/mock' // Enable Mock API
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
