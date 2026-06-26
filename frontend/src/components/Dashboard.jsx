import { useState, useEffect, useCallback } from 'react'
import { getRequests, updateStatus } from '../api/requests'
import RequestCard from './RequestCard'
import RequestModal from './RequestModal'
import FilterBar from './FilterBar'
import SearchBar from './SearchBar'
import supabase from '../api/supabase'
import '../styles/dashboard.css'

export default function Dashboard() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getRequests({ category, status, search })
      setRequests(data.requests || [])
    } catch {
      setError('Failed to load requests. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [category, status, search])

  useEffect(() => {
    const timer = setTimeout(fetchRequests, 300)
    return () => clearTimeout(timer)
  }, [fetchRequests])

  useEffect(() => {
    const channel = supabase
      .channel('requests-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => {
        fetchRequests()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchRequests])

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  function handleStatusChange(id, newStatus) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    )
    if (selected?.id === id) {
      setSelected((prev) => ({ ...prev, status: newStatus }))
    }
  }

  const counts = {
    total: requests.length,
    new: requests.filter((r) => r.status === 'new').length,
    sent: requests.filter((r) => r.status === 'sent').length,
    responded: requests.filter((r) => r.status === 'responded').length
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Arieh King's Office</h1>
          <p>Citizen Request Dashboard</p>
        </div>
        <div className="header-stats">
          <div className="stat"><span>{counts.total}</span><label>Total</label></div>
          <div className="stat new"><span>{counts.new}</span><label>New</label></div>
          <div className="stat sent"><span>{counts.sent}</span><label>Sent</label></div>
          <div className="stat responded"><span>{counts.responded}</span><label>Responded</label></div>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Sign out
        </button>
      </header>

      <div className="dashboard-controls">
        <SearchBar value={search} onChange={setSearch} />
        <FilterBar
          category={category}
          status={status}
          onCategoryChange={setCategory}
          onStatusChange={setStatus}
        />
      </div>

      <div className="dashboard-content">
        {loading && <div className="loading">Loading requests...</div>}
        {error && <div className="error-msg">{error}</div>}
        {!loading && !error && requests.length === 0 && (
          <div className="empty">No requests found.</div>
        )}
        {!loading && !error && (
          <div className="cards-grid">
            {requests.map((req) => (
              <RequestCard key={req.id} request={req} onClick={setSelected} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <RequestModal
          request={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
