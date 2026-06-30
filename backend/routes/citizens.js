const express = require('express')
const router = express.Router()
const { getCitizens } = require('../controllers/citizenController')

router.get('/', getCitizens)

module.exports = router
