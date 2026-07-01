const express = require('express')
const router = express.Router()
const responseController = require('../controllers/responseController')

router.post('/', responseController.saveResponse)
router.get('/:requestId', responseController.getResponses)

module.exports = router
