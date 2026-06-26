const Request = require('../models/Request')
const normalizeCategory = require('../models/normalizeCategory')
const { getStaff } = require('../models/staffMap')

function normalize(request) {
  if (!request) return request
  const category = normalizeCategory(request.category)
  const staff = getStaff(category)
  return {
    ...request,
    category,
    assigned_to: request.assigned_to || (staff ? staff.email : null)
  }
}

exports.getRequests = async (req, res, next) => {
  try {
    const { category, status, search } = req.query
    const requests = await Request.findAll({ category, status, search })
    res.json({ requests: requests.map(normalize) })
  } catch (err) {
    next(err)
  }
}

exports.getRequest = async (req, res, next) => {
  try {
    const { id } = req.params
    const request = await Request.findById(id)
    res.json(normalize(request))
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
    res.json(normalize(updated))
  } catch (err) {
    next(err)
  }
}

exports.closeRequest = async (req, res, next) => {
  try {
    const { id } = req.params
    const { closedBy, notes } = req.body
    const updated = await Request.close(id, closedBy, notes)
    res.json(normalize(updated))
  } catch (err) {
    next(err)
  }
}
