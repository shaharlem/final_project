import { motion } from 'framer-motion'
import {
  ParkingCircle, Home, Calendar, Trash2,
  Music, ShieldAlert, FileText, AlertTriangle
} from 'lucide-react'
import StatusBadge from './StatusBadge'

const CATEGORY_ICONS = {
  'Parking fines':        ParkingCircle,
  'Property tax':         Home,
  'Appointment requests': Calendar,
  'City cleaning':        Trash2,
  'Events':               Music,
  'Road safety':          ShieldAlert,
  'Other':                FileText,
}

function getDaysElapsed(createdAt) {
  const diff = Date.now() - new Date(createdAt).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

const LOW_CONFIDENCE = 0.8

export default function RequestCard({ request, onClick }) {
  const Icon = CATEGORY_ICONS[request.category] || FileText
  const days = getDaysElapsed(request.created_at)
  const lowConfidence = request.ai_confidence != null && request.ai_confidence < LOW_CONFIDENCE

  return (
    <motion.div
      className={`request-card${lowConfidence ? ' low-confidence' : ''}`}
      data-status={request.status}
      onClick={() => onClick(request)}
      tabIndex={0}
      role="button"
      aria-label={`Request from ${request.citizen_name} — ${request.category}`}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick(request)}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      {lowConfidence && (
        <div className="low-confidence-ribbon" aria-label={`Low AI confidence: ${Math.round(request.ai_confidence * 100)}%`}>
          LOW AI — {Math.round(request.ai_confidence * 100)}%
        </div>
      )}

      <div className="card-header">
        <span className="card-id">#{request.id}</span>
        <StatusBadge status={request.status} />
      </div>

      <div className="card-body">
        <div className="citizen-name">{request.citizen_name}</div>
        <div className="citizen-email">{request.citizen_email}</div>
        <div className="category">
          <span className="category-icon" aria-hidden="true">
            <Icon size={12} strokeWidth={2} />
          </span>
          <span>{request.category}</span>
        </div>
        {request.source === 'telegram' && (
          <span className="source-badge source-badge--telegram">Telegram</span>
        )}
      </div>

      <div className="card-footer">
        <span className="days-elapsed">
          {days === 0 ? 'Today' : `${days}d ago`}
        </span>
        {['new', 'sent', 'waiting_response'].includes(request.status) && days >= 3 && (
          <span className={`delay-badge${days >= 7 ? ' delay-badge--critical' : ' delay-badge--warning'}`}>
            {days}d without reply
          </span>
        )}
        <button className="view-btn" tabIndex={-1} aria-hidden="true">
          View →
        </button>
      </div>
    </motion.div>
  )
}
