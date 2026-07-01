import { useState, useEffect } from 'react'
import { getEmailDraft, sendEmail, saveResponse, getResponses } from '../api/emails'
import { closeRequest } from '../api/requests'
import StatusBadge from './StatusBadge'
import EmailPreview from './EmailPreview'
import supabase from '../api/supabase'

function toIsraelTime(dateStr) {
  if (!dateStr) return '—'
  const normalized = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z'
  return new Date(normalized).toLocaleString('en-GB', { timeZone: 'Asia/Jerusalem' })
}

export default function RequestModal({ request, allRequests = [], onClose, onStatusChange }) {
  const [draft, setDraft] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [tab, setTab] = useState('details')
  const [responseText, setResponseText] = useState('')
  const [fromEmail, setFromEmail] = useState('haimtouboul@gmail.com')
  const [fileUrl, setFileUrl] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (request) {
      setFromEmail('haimtouboul@gmail.com')
      getEmailDraft(request.id)
        .then(setDraft)
        .catch(() => setMessage({ type: 'error', text: 'Could not load email draft' }))
      getResponses(request.id)
        .then(d => setHistory(d.responses || []))
        .catch(() => setHistory([]))
    }
  }, [request])

  useEffect(() => {
    setFileUrl(null)
    if (request?.file_path) {
      const { data } = supabase.storage
        .from('request-files')
        .getPublicUrl(request.file_path)
      if (data?.publicUrl) {
        setFileUrl(data.publicUrl)
      } else {
        supabase.storage
          .from('request-files')
          .createSignedUrl(request.file_path, 3600)
          .then(({ data: d, error }) => {
            if (d?.signedUrl) setFileUrl(d.signedUrl)
            else setFileUrl('error')
          })
      }
    }
  }, [request?.file_path])

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
          <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
            History {history.length > 0 && <span className="tab-badge">{history.length}</span>}
          </button>
        </div>

        <div className="modal-body">
          {message && (
            <div className={`alert alert-${message.type}`}>{message.text}</div>
          )}

          {tab === 'details' && (
            <div>
              {(() => {
                const dupes = allRequests.filter(r => r.citizen_email === request.citizen_email && r.id !== request.id)
                return dupes.length > 0 ? (
                  <div className="alert alert-warning" style={{ marginBottom: '14px' }}>
                    ⚠️ This citizen already submitted {dupes.length} other request{dupes.length > 1 ? 's' : ''}: {dupes.map(d => `#${d.id} (${d.category} — ${d.status})`).join(', ')}
                  </div>
                ) : null
              })()}
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
                <div className="detail-row"><strong>Created</strong><span>{toIsraelTime(request.created_at)}</span></div>
                <div className="detail-row"><strong>Source</strong><span>{request.source === 'telegram' ? 'Telegram' : 'Web'}</span></div>
                <div className="detail-row full"><strong>Message</strong><p>{request.message}</p></div>
                {request.file_path && (
                  <div className="detail-row full">
                    <strong>Attached file</strong>
                    {fileUrl && fileUrl !== 'error' ? (
                      <a href={fileUrl} target="_blank" rel="noreferrer" className="file-attachment-link">
                        📎 {request.file_path.replace(/^\d+_/, '')}
                      </a>
                    ) : fileUrl === 'error' ? (
                      <span style={{ color: '#dc2626', fontSize: 13 }}>File unavailable (check Supabase Storage permissions)</span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: 13 }}>Loading…</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'email' && (
            <div>
              <EmailPreview draft={draft} onChange={setDraft} />
              {request.file_path && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0', padding: '8px 12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, fontSize: 13, color: '#0369a1' }}>
                  📎 <span>{request.file_path.replace(/^\d+_/, '')}</span>
                  <span style={{ color: '#64748b' }}>— will be attached to the email</span>
                </div>
              )}
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
                <label>Sending to (citizen)</label>
                <input type="email" value={request.citizen_email} readOnly style={{ background: '#f7f8fa', color: '#6b7280', cursor: 'default' }} />
              </div>
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

          {tab === 'history' && (
            <div className="history-list">
              {history.length === 0 ? (
                <div className="empty" style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af' }}>
                  No responses sent yet.
                </div>
              ) : (
                history.map(r => (
                  <div key={r.id} className="history-item">
                    <div className="history-meta">
                      <span className="history-from">{r.from_email}</span>
                      <span className="history-date">{toIsraelTime(r.created_at)}</span>
                    </div>
                    <p className="history-text">{r.response_text}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
