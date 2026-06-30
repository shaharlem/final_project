const express = require('express')
const router = express.Router()
const statusController = require('../controllers/statusController')

router.patch('/:id', statusController.updateStatus)

module.exports = router
