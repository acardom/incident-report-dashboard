/**
 * @file main.jsx
 * @author Alberto Cárdeno Domínguez
 * @component MainEntrypoint
 * @description Punto de entrada de React que monta la aplicación en el DOM.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
