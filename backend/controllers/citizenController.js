const supabase = require('../models/database')
const normalizeCategory = require('../models/normalizeCategory')

exports.getCitizens = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('requests')
      .select('citizen_name, citizen_email, status, category, created_at')
      .order('created_at', { ascending: false })
    if (error) throw error

    const map = {}
    for (const r of data) {
      const key = r.citizen_email
      if (!map[key]) {
        map[key] = {
          name: r.citizen_name,
          email: r.citizen_email,
          total: 0,
          new: 0,
          in_progress: 0,
          resolved: 0,
          categories: new Set(),
          last_request: r.created_at,
          first_request: r.created_at
        }
      }
      map[key].total++
      if (r.status === 'new') map[key].new++
      if (r.status === 'sent' || r.status === 'waiting_response') map[key].in_progress++
      if (r.status === 'responded' || r.status === 'closed') map[key].resolved++
      map[key].categories.add(normalizeCategory(r.category))
      if (new Date(r.created_at) > new Date(map[key].last_request)) {
        map[key].last_request = r.created_at
      }
      if (new Date(r.created_at) < new Date(map[key].first_request)) {
        map[key].first_request = r.created_at
      }
    }

    const citizens = Object.values(map)
      .map(c => ({ ...c, categories: Array.from(c.categories) }))
      .sort((a, b) => new Date(b.last_request) - new Date(a.last_request))

    res.json({ citizens })
  } catch (err) {
    next(err)
  }
}
