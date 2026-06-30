const supabase = require('./database')

const Response = {
  async create({ requestId, responseText, fromEmail }) {
    const { data, error } = await supabase
      .from('responses')
      .insert([{ request_id: requestId, response_text: responseText, from_email: fromEmail }])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async findByRequestId(requestId) {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  }
}

module.exports = Response
