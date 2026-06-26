import { useState } from 'react'
import supabase from '../api/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f0f2f7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(26,39,68,0.12)',
        width: '100%',
        maxWidth: '400px',
        overflow: 'hidden'
      }}>
        <div style={{
          background: '#1a2744',
          padding: '28px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ width: '3px', height: '32px', background: '#c9a843', borderRadius: '2px' }} />
          <div>
            <h1 style={{ color: '#fff', fontSize: '18px', fontWeight: '500' }}>Arieh King's Office</h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', marginTop: '2px' }}>Citizen Request Dashboard</p>
          </div>
        </div>

        <form onSubmit={handleLogin} style={{ padding: '28px 32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#1a2744', marginBottom: '20px' }}>Sign in</h2>

          {error && (
            <div style={{
              background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5',
              borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#7a869a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              style={{
                width: '100%', border: '1px solid #dde2ed', borderRadius: '8px',
                padding: '10px 14px', fontSize: '14px', outline: 'none', color: '#1a2744',
                background: '#f0f2f7', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#7a869a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%', border: '1px solid #dde2ed', borderRadius: '8px',
                padding: '10px 14px', fontSize: '14px', outline: 'none', color: '#1a2744',
                background: '#f0f2f7', boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: '#c9a843', color: '#1a2744', border: 'none',
              borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
