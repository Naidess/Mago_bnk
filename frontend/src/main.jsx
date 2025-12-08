console.log('main.jsx loaded')
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from '../App'
import './styles.css'

const root = document.getElementById('root')
console.log('root element:', root)

if (!root) {
  console.error('Root element not found')
  document.body.innerHTML = '<h1>Error: Root element not found</h1>'
  throw new Error('Root element not found')
}

try {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
  console.log('App mounted')
} catch (err) {
  console.error('Render error:', err)
  root.innerHTML = `<h1>Error: ${err.message}</h1><pre>${err.stack}</pre>`
}
