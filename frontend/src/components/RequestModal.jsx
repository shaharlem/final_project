import { useState, useEffect } from 'react'
import { getEmailDraft, sendEmail, saveResponse } from '../api/emails'
import { closeRequest } from '../api/requests'
import StatusBadge from './StatusBadge'
import EmailPreview from './EmailPreview'

export default function RequestModal({ request, onClose, onStatusChange }) {
  const [draft, setDraft] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [tab, setTab] = useState('details')
  const [responseText, setResponseText] = useState('')
  const [fromEmail, setFromEmail] = useState('')

  useEffect(() => {
    if (request) {
      getEmailDraft(request.id)
        .then(setDraft)
        .catch(() => setMessage({ type: 'error', text: 'Could not load email draft' }))
    }
  }, [request])

  if (!request) return null

  async function handleSendEmail() {
    if (!draft) return
    setLoading(true)
    try {
      await sendEmail({ requestId: request.id, ...draft })
      setMessage({ type: 'success', text: 'Email sent successfully!' })
      onStatusChange(request.id, 'sent')
    } catch {
      setMessage({ type: 'error', text: 'Failed to send email.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveResponse() {
    if (!responseText || !fromEmail) {
      setMessage({ type: 'error', text: 'Please fill in all response fields.' })
      return
    }
    setLoading(true)
    try {
      await saveResponse({ requestId: request.id, responseText, fromEmail })
      setMessage({ type: 'success', text: 'Response saved and sent to citizen!' })
      onStatusChange(request.id, 'responded')
    } catch {
      setMessage({ type: 'error', text: 'Failed to save response.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleClose() {
    setLoading(true)
    try {
      await closeRequest(request.id, '', '')
      setMessage({ type: 'success', text: 'Request closed.' })
      onStatusChange(request.id, 'closed')
    } catch {
      setMessage({ type: 'error', text: 'Failed to close request.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2>Request #{request.id}</h2>
            <StatusBadge status={request.status} />
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-tabs">
          <button className={tab === 'details' ? 'active' : ''} onClick={() => setTab('details')}>Details</button>
          <button className={tab === 'email' ? 'active' : ''} onClick={() => setTab('email')}>Send Email</button>
          <button className={tab === 'response' ? 'active' : ''} onClick={() => setTab('response')}>Add Response</button>
        </div>

        <div className="modal-body">
          {message && (
            <div className={`alert alert-${message.type}`}>{message.text}</div>
          )}

          {tab === 'details' && (
            <div>
              {request.ai_confidence != null && request.ai_confidence < 0.8 && (
                <div className="alert alert-error" style={{ marginBottom: '14px' }}>
                  ⚠️ Low AI confidence ({Math.round(request.ai_confidence * 100)}%) — please verify the category manually before sending.
                </div>
              )}
              <div className="details-grid">
                <div className="detail-row"><strong>Name</strong><span>{request.citizen_name}</span></div>
                <div className="detail-row"><strong>Email</strong><span>{request.citizen_email}</span></div>
                <div className="detail-row"><strong>Phone</strong><span>{request.citizen_phone}</span></div>
                <div className="detail-row"><strong>Category</strong><span>{request.category}</span></div>
                <div className="detail-row"><strong>Assigned to</strong><span>{request.assigned_to || '—'}</span></div>
                {request.ai_confidence != null && (
                  <div className="detail-row"><strong>AI Confidence</strong><span>{Math.round(request.ai_confidence * 100)}%</span></div>
                )}
                <div className="detail-row"><strong>Created</strong><span>{new Date(request.created_at).toLocaleString()}</span></div>
                <div className="detail-row full"><strong>Message</strong><p>{request.message}</p></div>
              </div>
            </div>
          )}

          {tab === 'email' && (
            <div>
              <EmailPreview draft={draft} onChange={setDraft} />
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={handleSendEmail} disabled={loading || !draft}>
                  {loading ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
          )}

          {tab === 'response' && (
            <div className="response-form">
              <div className="form-group">
                <label>From Email (staff)</label>
                <input
                  type="email"
                  placeholder="natalie@jerusalem.gov.il"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Response Text (will be sent to citizen in Hebrew)</label>
                <textarea
                  rows={6}
                  placeholder="Enter the response..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button className="btn btn-success" onClick={handleSaveResponse} disabled={loading}>
                  {loading ? 'Saving...' : 'Save & Send to Citizen'}
                </button>
                <button className="btn btn-gray" onClick={handleClose} disabled={loading}>
                  Close Request
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
