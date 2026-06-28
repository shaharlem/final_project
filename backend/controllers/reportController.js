const supabase = require('../models/database')
const normalizeCategory = require('../models/normalizeCategory')

exports.getReports = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('requests')
      .select('status, category, created_at, updated_at')
    if (error) throw error

    const byStatus = {}
    const byCategory = {}
    const byDay = {}
    let totalResponseMs = 0
    let respondedCount = 0

    for (const r of data) {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1
      byCategory[normalizeCategory(r.category)] = (byCategory[normalizeCategory(r.category)] || 0) + 1

      const day = r.created_at.slice(0, 10)
      byDay[day] = (byDay[day] || 0) + 1

      if ((r.status === 'responded' || r.status === 'closed') && r.updated_at) {
        const diff = new Date(r.updated_at) - new Date(r.created_at)
        if (diff > 0) { totalResponseMs += diff; respondedCount++ }
      }
    }

    // Last 30 days ordered array
    const today = new Date()
    const last30 = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      last30.push({ date: key, count: byDay[key] || 0 })
    }

    const avgResponseDays = respondedCount > 0
      ? Math.round((totalResponseMs / respondedCount) / (1000 * 60 * 60 * 24) * 10) / 10
      : null

    res.json({
      total: data.length,
      byStatus,
      byCategory,
      last30,
      avgResponseDays
    })
  } catch (err) {
    next(err)
  }
}
