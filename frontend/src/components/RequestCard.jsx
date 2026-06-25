import StatusBadge from './StatusBadge'

const CATEGORY_ICONS = {
  'Parking fines':        '🅿️',
  'Property tax':         '🏠',
  'Appointment requests': '📅',
  'City cleaning':        '🧹',
  'Events':               '🎉',
  'Road safety':          '🚦',
  'Other':                '📋'
}

function getDaysElapsed(createdAt) {
  const diff = Date.now() - new Date(createdAt).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export default function RequestCard({ request, onClick }) {
  const icon = CATEGORY_ICONS[request.category] || '📋'
  const days = getDaysElapsed(request.created_at)

  return (
    <div className="request-card" onClick={() => onClick(request)}>
      <div className="card-header">
        <span className="card-id">#{request.id}</span>
        <StatusBadge status={request.status} />
      </div>

      <div className="card-body">
        <div className="citizen-name">{request.citizen_name}</div>
        <div className="citizen-email">{request.citizen_email}</div>
        <div className="category">
          <span className="category-icon">{icon}</span>
          <span>{request.category}</span>
        </div>
      </div>

      <div className="card-footer">
        <span className="days-elapsed">
          {days === 0 ? 'Today' : `${days} day${days > 1 ? 's' : ''} ago`}
        </span>
        <button className="view-btn">View Details →</button>
      </div>
    </div>
  )
}
