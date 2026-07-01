const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export async function getEmailDraft(requestId) {
  const res = await fetch(`${BASE_URL}/emails/draft/${requestId}`)
  if (!res.ok) throw new Error('Failed to get email draft')
  return res.json()
}

export async function sendEmail({ requestId, to, subject, body }) {
  const res = await fetch(`${BASE_URL}/emails/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId, to, subject, body })
  })
  if (!res.ok) throw new Error('Failed to send email')
  return res.json()
}

export async function saveResponse({ requestId, responseText, fromEmail }) {
  const res = await fetch(`${BASE_URL}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId, responseText, fromEmail })
  })
  if (!res.ok) throw new Error('Failed to save response')
  return res.json()
}

export async function getResponses(requestId) {
  const res = await fetch(`${BASE_URL}/responses/${requestId}`)
  if (!res.ok) throw new Error('Failed to get responses')
  return res.json()
}
