const STATUS_CONFIG = {
  new: { label: 'New', color: '#e74c3c', bg: '#fdecea' },
  sent: { label: 'Sent', color: '#f39c12', bg: '#fef9e7' },
  waiting_response: { label: 'Waiting', color: '#e67e22', bg: '#fdf2e9' },
  responded: { label: 'Responded', color: '#27ae60', bg: '#eafaf1' },
  closed: { label: 'Closed', color: '#7f8c8d', bg: '#f2f3f4' }
}

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.new

  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      color: config.color,
      backgroundColor: config.bg,
      border: `1px solid ${config.color}`,
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      {config.label}
    </span>
  )
}
