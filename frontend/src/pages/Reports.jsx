import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { getReports } from '../api/requests'
import Layout from '../components/Layout'
import '../styles/dashboard.css'

const STATUS_COLORS = {
  new:              '#C05C3A',
  sent:             '#2563EB',
  responded:        '#16A34A',
  closed:           '#94A3B8',
  waiting_response: '#EA580C',
}
const STATUS_LABELS = {
  new: 'New', sent: 'In progress', responded: 'Responded',
  closed: 'Closed', waiting_response: 'Waiting',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E8EE', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: '#6B7280', marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 600, color: '#111827' }}>{payload[0].value} requests</div>
    </div>
  )
}

export default function Reports() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    getReports()
      .then(d => setData(d))
      .catch(() => setError('Failed to load reports. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  const statusData = data
    ? Object.entries(data.byStatus).map(([k, v]) => ({
        name: STATUS_LABELS[k] || k,
        value: v,
        color: STATUS_COLORS[k] || '#94A3B8'
      }))
    : []

  const categoryData = data
    ? Object.entries(data.byCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => ({ name: k, count: v }))
    : []

  const last14 = data ? data.last30.slice(-14) : []

  return (
    <Layout pageTitle="Reports" pageSubtitle="Analytics from your requests data">

      {loading && <div className="loading">Loading reports...</div>}
      {error   && <div className="error-msg">{error}</div>}

      {!loading && !error && data && (<>

        {/* KPI row */}
        <div className="kpi-strip" style={{ padding: 0 }}>
          <div className="kpi-card">
            <span className="kpi-label">Total requests</span>
            <span className="kpi-value">{data.total}</span>
          </div>
          <div className="kpi-card kpi-new">
            <span className="kpi-label">New</span>
            <span className="kpi-value">{data.byStatus.new || 0}</span>
          </div>
          <div className="kpi-card kpi-sent">
            <span className="kpi-label">In progress</span>
            <span className="kpi-value">{(data.byStatus.sent || 0) + (data.byStatus.waiting_response || 0)}</span>
          </div>
          <div className="kpi-card kpi-done">
            <span className="kpi-label">Responded</span>
            <span className="kpi-value">{data.byStatus.responded || 0}</span>
          </div>
          {data.avgResponseDays != null && (
            <div className="kpi-card">
              <span className="kpi-label">Avg. response</span>
              <span className="kpi-value">{data.avgResponseDays}d</span>
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="reports-grid">

          <div className="report-card report-card-wide">
            <h3 className="report-card-title">Volume — last 14 days</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={last14} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6' }} />
                <Bar dataKey="count" fill="#1B2B4B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="report-card">
            <h3 className="report-card-title">By status</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: '#374151' }}>{v}</span>} />
                <Tooltip formatter={(v, n) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="report-card">
            <h3 className="report-card-title">By category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} layout="vertical" margin={{ top: 4, right: 16, left: 10, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} width={130} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6' }} />
                <Bar dataKey="count" fill="#C05C3A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

      </>)}
    </Layout>
  )
}
