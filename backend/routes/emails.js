const express = require('express')
const router = express.Router()
const emailController = require('../controllers/emailController')

router.get('/draft/:id', emailController.getEmailDraft)
router.post('/send', emailController.sendEmail)

module.exports = router
