const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export async function getRequests({ category, status, search } = {}) {
  const params = new URLSearchParams()
  if (category) params.append('category', category)
  if (status) params.append('status', status)
  if (search) params.append('search', search)

  const res = await fetch(`${BASE_URL}/requests?${params}`)
  if (!res.ok) throw new Error('Failed to fetch requests')
  return res.json()
}

export async function getRequest(id) {
  const res = await fetch(`${BASE_URL}/requests/${id}`)
  if (!res.ok) throw new Error('Request not found')
  return res.json()
}

export async function updateStatus(id, status) {
  const res = await fetch(`${BASE_URL}/requests/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, timestamp: new Date().toISOString() })
  })
  if (!res.ok) throw new Error('Failed to update status')
  return res.json()
}

export async function closeRequest(id, closedBy, notes) {
  const res = await fetch(`${BASE_URL}/requests/${id}/close`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ closedBy, notes })
  })
  if (!res.ok) throw new Error('Failed to close request')
  return res.json()
}

export async function getCitizens() {
  const res = await fetch(`${BASE_URL}/citizens`)
  if (!res.ok) throw new Error('Failed to fetch citizens')
  return res.json()
}

export async function getReports() {
  const res = await fetch(`${BASE_URL}/reports`)
  if (!res.ok) throw new Error('Failed to fetch reports')
  return res.json()
}
