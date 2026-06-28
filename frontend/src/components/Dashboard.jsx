import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Inbox, Sparkles, Send, CheckCircle } from 'lucide-react'
import { getRequests } from '../api/requests'
import RequestCard from './RequestCard'
import RequestModal from './RequestModal'
import Layout from './Layout'
import supabase from '../api/supabase'
import '../styles/dashboard.css'

const container   = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }
const cardVariant = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } }
}

const CHIPS = [
  { label: 'All',         value: '' },
  { label: 'New',         value: 'new' },
  { label: 'In progress', value: 'sent' },
  { label: 'Responded',   value: 'responded' },
]

const CATEGORIES = [
  { label: 'All categories', value: '' },
  { label: 'Parking fines',         value: 'Parking fines' },
  { label: 'Property tax',          value: 'Property tax' },
  { label: 'City cleaning',         value: 'City cleaning' },
  { label: 'Events',                value: 'Events' },
  { label: 'Road safety',           value: 'Road safety' },
  { label: 'Appointment requests',  value: 'Appointment requests' },
  { label: 'Other',                 value: 'Other' },
]

export default function Dashboard() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus]     = useState('')

  const fetchRequests = useCallback(async () => {
    setLoading(true); setError(null)
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
    const t = setTimeout(fetchRequests, 300)
    return () => clearTimeout(t)
  }, [fetchRequests])

  useEffect(() => {
    const ch = supabase
      .channel('requests-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, fetchRequests)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [fetchRequests])

  function handleStatusChange(id, newStatus) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
    if (selected?.id === id) setSelected(prev => ({ ...prev, status: newStatus }))
  }

  const countNew       = requests.filter(r => r.status === 'new').length
  const countProgress  = requests.filter(r => r.status === 'sent' || r.status === 'waiting_response').length
  const countResponded = requests.filter(r => r.status === 'responded').length

  const flagged = requests.filter(r => r.ai_confidence != null && r.ai_confidence < 0.8)
  const normal  = requests.filter(r => !(r.ai_confidence != null && r.ai_confidence < 0.8))

  return (
    <Layout
      pageTitle="Citizen Requests"
      newCount={countNew}
      onSearch={setSearch}
      searchPlaceholder="Search requests..."
    >

      {/* ── KPI row ── */}
      <div className="kpi-row">

        <div className="kpi-card-v2">
          <div className="kpi-card-top">
            <div className="kpi-icon kpi-icon--orange">
              <Inbox size={15} strokeWidth={2} />
            </div>
          </div>
          <div className="kpi-num">{requests.length}</div>
          <div className="kpi-lbl">Total requests</div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-card-top">
            <div className="kpi-icon kpi-icon--orange">
              <Sparkles size={15} strokeWidth={2} />
            </div>
            {countNew > 0 && (
              <span className="kpi-badge">+{countNew} today</span>
            )}
          </div>
          <div className="kpi-num kpi-num--orange">{countNew}</div>
          <div className="kpi-lbl">New</div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-card-top">
            <div className="kpi-icon kpi-icon--blue">
              <Send size={15} strokeWidth={2} />
            </div>
          </div>
          <div className="kpi-num kpi-num--blue">{countProgress}</div>
          <div className="kpi-lbl">In progress</div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-card-top">
            <div className="kpi-icon kpi-icon--green">
              <CheckCircle size={15} strokeWidth={2} />
            </div>
          </div>
          <div className="kpi-num kpi-num--green">{countResponded}</div>
          <div className="kpi-lbl">Responded</div>
        </div>

      </div>

      {/* ── Section header + chips ── */}
      <div className="section-header">
        <h2 className="section-title">Recent requests</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            className="filter-select"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <div className="chip-bar">
            {CHIPS.map(c => (
              <button
                key={c.value}
                className={`chip${status === c.value ? ' chip--active' : ''}`}
                onClick={() => setStatus(c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Cards ── */}
      {loading && <div className="loading">Loading requests...</div>}
      {error   && <div className="error-msg">{error}</div>}
      {!loading && !error && requests.length === 0 && (
        <div className="empty">No requests found.</div>
      )}
      {!loading && !error && flagged.length > 0 && (
        <div className="pinned-section">
          <div className="pinned-header">
            <span className="pinned-icon">⚑</span>
            Needs review — low AI confidence
            <span className="pinned-count">{flagged.length}</span>
          </div>
          <motion.div className="cards-grid" variants={container} initial="hidden" animate="show">
            {flagged.map(req => (
              <motion.div key={req.id} variants={cardVariant}>
                <RequestCard request={req} onClick={setSelected} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
      {!loading && !error && normal.length > 0 && (
        <motion.div className="cards-grid" variants={container} initial="hidden" animate="show">
          {normal.map(req => (
            <motion.div key={req.id} variants={cardVariant}>
              <RequestCard request={req} onClick={setSelected} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {selected && (
          <RequestModal
            request={selected}
            onClose={() => setSelected(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </AnimatePresence>

    </Layout>
  )
}
