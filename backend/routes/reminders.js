const express = require('express')
const router = express.Router()
const { runReminders } = require('../controllers/reminderController')

router.post('/run', runReminders)

module.exports = router
