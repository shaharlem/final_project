const Request = require('../models/Request')

exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, timestamp } = req.body

    const validStatuses = ['new', 'sent', 'waiting_response', 'responded', 'closed']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' })
    }

    const updated = await Request.updateStatus(id, status)
    res.json(updated)
  } catch (err) {
    next(err)
  }
}
