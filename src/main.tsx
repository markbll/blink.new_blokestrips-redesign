import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BlinkUIProvider, Toaster } from '@blinkdotnew/ui'
import { Toaster as HotToaster } from 'react-hot-toast'
import { AppRouter } from './router'
import { ThemeProvider } from './contexts/ThemeContext'
import './index.css'

// Apply saved theme before first paint — prevents flash
;(function () {
  const saved = localStorage.getItem('bt-theme') ?? 'dark'
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light')
  }
})()

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BlinkUIProvider theme="linear" darkMode="system">
          <Toaster />
          <HotToaster position="top-right" />
          <AppRouter />
        </BlinkUIProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
