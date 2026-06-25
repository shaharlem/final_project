export default function EmailPreview({ draft, onChange }) {
  if (!draft) return null

  return (
    <div className="email-preview">
      <h4>Email Preview</h4>

      <div className="email-field">
        <label>To</label>
        <input
          type="email"
          value={draft.to}
          onChange={(e) => onChange({ ...draft, to: e.target.value })}
        />
      </div>

      <div className="email-field">
        <label>Subject</label>
        <input
          type="text"
          value={draft.subject}
          onChange={(e) => onChange({ ...draft, subject: e.target.value })}
        />
      </div>

      <div className="email-field">
        <label>Body</label>
        <textarea
          rows={8}
          value={draft.body}
          onChange={(e) => onChange({ ...draft, body: e.target.value })}
        />
      </div>
    </div>
  )
}
