require('dotenv').config()
const express = require('express')
const cors = require('cors')

const requestRoutes = require('./routes/requests')
const emailRoutes = require('./routes/emails')
const responseRoutes = require('./routes/responses')
const errorHandler = require('./middleware/errorHandler')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/requests', requestRoutes)
app.use('/api/emails', emailRoutes)
app.use('/api/responses', responseRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use(errorHandler)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
