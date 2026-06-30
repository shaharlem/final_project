const CATEGORIES = [
  'All',
  'Parking fines',
  'Property tax',
  'City cleaning',
  'Events',
  'Road safety',
  'Appointment requests',
  'Other'
]

const STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'sent', label: 'Sent' },
  { value: 'waiting_response', label: 'Waiting Response' },
  { value: 'responded', label: 'Responded' },
  { value: 'closed', label: 'Closed' }
]

export default function FilterBar({ category, status, onCategoryChange, onStatusChange }) {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label>Category</label>
        <select value={category} onChange={(e) => onCategoryChange(e.target.value)}>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat === 'All' ? '' : cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Status</label>
        <select value={status} onChange={(e) => onStatusChange(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value === 'all' ? '' : s.value}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
