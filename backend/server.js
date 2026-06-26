require('dotenv').config()
const express = require('express')
const cors = require('cors')

const requestRoutes = require('./routes/requests')
const emailRoutes = require('./routes/emails')
const responseRoutes = require('./routes/responses')
const reminderRoutes = require('./routes/reminders')
const errorHandler = require('./middleware/errorHandler')
const { runReminders } = require('./controllers/reminderController')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/requests', requestRoutes)
app.use('/api/emails', emailRoutes)
app.use('/api/responses', responseRoutes)
app.use('/api/reminders', reminderRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use(errorHandler)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)

  const INTERVAL_MS = 24 * 60 * 60 * 1000
  setInterval(() => {
    console.log('[Reminders] Running daily check...')
    runReminders(null, null, null)
  }, INTERVAL_MS)
})
