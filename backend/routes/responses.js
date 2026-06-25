const express = require('express')
const router = express.Router()
const responseController = require('../controllers/responseController')

router.post('/', responseController.saveResponse)

module.exports = router
