import { useState, useEffect } from 'react'
import { getCitizens } from '../api/requests'
import Layout from '../components/Layout'
import '../styles/dashboard.css'

function getDaysAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

export default function Citizens() {
  const [citizens, setCitizens] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [search, setSearch]     = useState('')

  useEffect(() => {
    getCitizens()
      .then(d => setCitizens(d.citizens || []))
      .catch(() => setError('Failed to load citizens. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = citizens.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout pageTitle="Citizens" pageSubtitle={`${citizens.length} unique citizens`}>

      {/* KPI row */}
      <div className="kpi-strip" style={{ padding: 0 }}>
        <div className="kpi-card">
          <span className="kpi-label">Total citizens</span>
          <span className="kpi-value">{citizens.length}</span>
        </div>
        <div className="kpi-card kpi-new">
          <span className="kpi-label">With new requests</span>
          <span className="kpi-value">{citizens.filter(c => c.new > 0).length}</span>
        </div>
        <div className="kpi-card kpi-done">
          <span className="kpi-label">Fully resolved</span>
          <span className="kpi-value">{citizens.filter(c => c.new === 0 && c.in_progress === 0 && c.resolved > 0).length}</span>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar" style={{ maxWidth: 380 }}>
        <span className="search-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </span>
        <input
          type="search"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading && <div className="loading">Loading citizens...</div>}
      {error   && <div className="error-msg">{error}</div>}
      {!loading && !error && filtered.length === 0 && <div className="empty">No citizens found.</div>}
      {!loading && !error && filtered.length > 0 && (
        <div className="citizens-table-wrap">
          <table className="citizens-table">
            <thead>
              <tr>
                <th>Citizen</th>
                <th>Email</th>
                <th>Total</th>
                <th>New</th>
                <th>In progress</th>
                <th>Resolved</th>
                <th>Categories</th>
                <th>Last request</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.email}>
                  <td className="citizen-cell-name">{c.name}</td>
                  <td className="citizen-cell-email">{c.email}</td>
                  <td><span className="citizen-count">{c.total}</span></td>
                  <td>
                    {c.new > 0
                      ? <span className="status-badge status-new"><span className="status-dot"></span>{c.new}</span>
                      : <span className="citizen-zero">—</span>}
                  </td>
                  <td>
                    {c.in_progress > 0
                      ? <span className="status-badge status-sent"><span className="status-dot"></span>{c.in_progress}</span>
                      : <span className="citizen-zero">—</span>}
                  </td>
                  <td>
                    {c.resolved > 0
                      ? <span className="status-badge status-responded"><span className="status-dot"></span>{c.resolved}</span>
                      : <span className="citizen-zero">—</span>}
                  </td>
                  <td>
                    <div className="citizen-cats">
                      {c.categories.map(cat => (
                        <span key={cat} className="citizen-cat-chip">{cat}</span>
                      ))}
                    </div>
                  </td>
                  <td className="citizen-cell-date">{getDaysAgo(c.last_request)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </Layout>
  )
}
