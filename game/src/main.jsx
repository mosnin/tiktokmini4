import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { platform } from './tiktok.js'
import './ui/base.css'

platform.login() // silent login — mandatory TikTok integration, no-op in browser

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
