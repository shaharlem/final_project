const supabase = require('./database')

const Request = {
  async findAll({ category, status, search } = {}) {
    let query = supabase.from('requests').select('*').order('created_at', { ascending: false })

    if (category) query = query.eq('category', category)
    if (status) query = query.eq('status', status)
    if (search) query = query.or(`citizen_name.ilike.%${search}%,citizen_email.ilike.%${search}%`)

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('requests')
      .update({ status, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async close(id, closedBy, notes) {
    const { data, error } = await supabase
      .from('requests')
      .update({ status: 'closed', closed_at: new Date(), updated_at: new Date() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }
}

module.exports = Request
