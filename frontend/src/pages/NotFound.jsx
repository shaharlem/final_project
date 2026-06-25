import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <h1 style={{ fontSize: '64px', color: '#ccc' }}>404</h1>
      <p style={{ fontSize: '20px', color: '#666', marginBottom: '24px' }}>Page not found</p>
      <button
        onClick={() => navigate('/')}
        style={{ padding: '10px 24px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '16px' }}
      >
        Back to Dashboard
      </button>
    </div>
  )
}
