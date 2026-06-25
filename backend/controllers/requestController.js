const Request = require('../models/Request')

exports.getRequests = async (req, res, next) => {
  try {
    const { category, status, search } = req.query
    const requests = await Request.findAll({ category, status, search })
    res.json({ requests })
  } catch (err) {
    next(err)
  }
}

exports.getRequest = async (req, res, next) => {
  try {
    const { id } = req.params
    const request = await Request.findById(id)
    res.json(request)
  } catch (err) {
    res.status(404).json({ error: 'Request not found' })
  }
}

exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = ['new', 'sent', 'waiting_response', 'responded', 'closed']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const updated = await Request.updateStatus(id, status)
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

exports.closeRequest = async (req, res, next) => {
  try {
    const { id } = req.params
    const { closedBy, notes } = req.body
    const updated = await Request.close(id, closedBy, notes)
    res.json(updated)
  } catch (err) {
    next(err)
  }
}
