import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Bell, LogOut, Search, MoreHorizontal } from 'lucide-react'
import supabase from '../api/supabase'
import '../styles/layout.css'

const NAV = [
  { path: '/',         label: 'Requests' },
  { path: '/citizens', label: 'Citizens' },
  { path: '/reports',  label: 'Reports'  },
]

export default function Layout({ children, pageTitle, pageSubtitle, newCount, onSearch, searchPlaceholder }) {
  const location  = useLocation()
  const navigate  = useNavigate()
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
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
        <div className="sidebar-brand">
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

            <button className="topbar-icon-btn" aria-label="Notifications">
              <Bell size={15} strokeWidth={1.75} />
            </button>

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
