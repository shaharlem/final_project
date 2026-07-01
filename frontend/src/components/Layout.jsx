import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Bell, LogOut, Search, MoreHorizontal } from 'lucide-react'
import supabase from '../api/supabase'
import '../styles/layout.css'

const SEEN_KEY = 'seen_request_ids'
function getSeenIds() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')) } catch { return new Set() }
}
function addSeenId(id) {
  const s = getSeenIds(); s.add(id)
  localStorage.setItem(SEEN_KEY, JSON.stringify([...s]))
}

const NAV = [
  { path: '/',         label: 'Requests' },
  { path: '/citizens', label: 'Citizens' },
  { path: '/reports',  label: 'Reports'  },
]

export default function Layout({ children, pageTitle, pageSubtitle, newCount, onSearch, searchPlaceholder }) {
  const location  = useLocation()
  const navigate  = useNavigate()
  const [search, setSearch]       = useState('')
  const [menuOpen, setMenuOpen]   = useState(false)
  const [bellOpen, setBellOpen]   = useState(false)
  const [notifs, setNotifs]       = useState([])
  const menuRef = useRef(null)
  const bellRef = useRef(null)

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
    let lastId = null

    async function poll() {
      try {
        const res = await fetch(`${BASE}/requests`)
        const data = await res.json()
        const requests = data.requests || []
        if (!requests.length) return

        if (lastId === null) {
          lastId = requests[0].id
          return
        }

        const newOnes = requests.filter(r => r.id > lastId)
        if (newOnes.length > 0) {
          lastId = newOnes[0].id
          const seen = getSeenIds()
          newOnes.forEach(r => {
            if (!seen.has(r.id)) {
              setNotifs(prev => [r, ...prev].slice(0, 20))
            }
          })
          window.dispatchEvent(new CustomEvent('new-request'))
        }
      } catch {}
    }

    poll()
    const interval = setInterval(poll, 15000)
    return () => clearInterval(interval)
  }, [])

  function handleSearch(val) {
    setSearch(val)
    onSearch?.(val)
  }

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div className="app-shell">

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img
            src="/arieh.png"
            className="sidebar-avatar-photo"
            alt="Arieh King"
          />
          <div>
            <div className="sidebar-name">Arieh King's Office</div>
            <div className="sidebar-role">Municipality</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <div className="nav-section-label">Main</div>
          {NAV.map(({ path, label }) => {
            const active = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={`nav-item${active ? ' nav-item--active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <span className="nav-dot" aria-hidden="true" />
                <span>{label}</span>
                {label === 'Requests' && newCount > 0 && (
                  <span className="nav-badge">{newCount}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* ── Main area ── */}
      <div className="main-area">

        {/* Top bar */}
        <header className="topbar">
          <div>
            <h1 className="topbar-title">{pageTitle}</h1>
            <p className="topbar-sub">{pageSubtitle || today}</p>
          </div>

          <div className="topbar-right">
            {onSearch && (
              <label className="topbar-search">
                <Search size={13} strokeWidth={2} aria-hidden="true" />
                <input
                  type="search"
                  placeholder={searchPlaceholder || 'Search…'}
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                />
              </label>
            )}

            <div className="topbar-menu-wrap" ref={bellRef}>
              <button
                className="topbar-icon-btn notif-btn"
                aria-label="Notifications"
                onClick={() => {
                  setBellOpen(v => !v)
                  notifs.forEach(r => addSeenId(r.id))
                  if (!bellOpen) setNotifs(prev => prev.map(r => ({ ...r, _seen: true })))
                }}
              >
                <Bell size={15} strokeWidth={1.75} />
                {notifs.filter(r => !r._seen).length > 0 && (
                  <span className="notif-badge">{notifs.filter(r => !r._seen).length}</span>
                )}
              </button>
              {bellOpen && (
                <div className="topbar-menu notif-menu">
                  <div className="notif-menu-header">New requests</div>
                  {notifs.length === 0 ? (
                    <div className="notif-empty">No new requests</div>
                  ) : (
                    notifs.map(r => (
                      <div key={r.id} className="notif-item" style={{ cursor: 'pointer' }} onClick={() => {
                        setBellOpen(false)
                        navigate(`/?open=${r.id}`)
                      }}>
                        <span className="notif-name">{r.citizen_name}</span>
                        <span className="notif-cat">{r.category}</span>
                        <span className="notif-time">{(() => { const s = r.created_at; const d = new Date(s.endsWith('Z') || s.includes('+') ? s : s + 'Z'); return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' }) })()}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="topbar-menu-wrap" ref={menuRef}>
              <button
                className="topbar-icon-btn"
                aria-label="More options"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(v => !v)}
              >
                <MoreHorizontal size={15} strokeWidth={1.75} />
              </button>
              {menuOpen && (
                <div className="topbar-menu">
                  <button className="topbar-menu-item" onClick={handleLogout}>
                    <LogOut size={13} strokeWidth={1.75} aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          {children}
        </main>

      </div>
    </div>
  )
}
