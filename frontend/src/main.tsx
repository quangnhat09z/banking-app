import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SocketProvider } from './context/SocketContext.tsx'
import { ToastContainer } from 'react-toastify'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SocketProvider >
      <App />
      <ToastContainer />
    </SocketProvider>
  </StrictMode>,
)
