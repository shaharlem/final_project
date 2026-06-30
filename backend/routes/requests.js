const express = require('express')
const router = express.Router()
const requestController = require('../controllers/requestController')

router.get('/', requestController.getRequests)
router.get('/:id', requestController.getRequest)
router.patch('/:id/status', requestController.updateStatus)
router.patch('/:id/close', requestController.closeRequest)

module.exports = router
