import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardPage from './pages/Dashboard'
import Login from './pages/Login'
import Citizens from './pages/Citizens'
import Reports from './pages/Reports'
import NotFound from './pages/NotFound'
import supabase from './api/supabase'

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #dde1e7', borderTopColor: '#c9a843', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={session ? <DashboardPage /> : <Navigate to="/login" />} />
        <Route path="/citizens" element={session ? <Citizens /> : <Navigate to="/login" />} />
        <Route path="/reports" element={session ? <Reports /> : <Navigate to="/login" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
