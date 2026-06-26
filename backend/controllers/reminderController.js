require('dotenv').config()
const nodemailer = require('nodemailer')
const supabase = require('../models/database')
const normalizeCategory = require('../models/normalizeCategory')
const { getStaff } = require('../models/staffMap')

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000

const transporter = nodemailer.createTransport({
  service: 'outlook',
  auth: {
    user: process.env.OUTLOOK_EMAIL,
    pass: process.env.OUTLOOK_PASSWORD
  }
})

exports.runReminders = async (req, res, next) => {
  try {
    const fiveDaysAgo = new Date(Date.now() - FIVE_DAYS_MS).toISOString()

    const { data: staleRequests, error } = await supabase
      .from('requests')
      .select('id, citizen_name, citizen_email, citizen_phone, category, message, assigned_to, sent_at')
      .eq('status', 'sent')
      .lt('sent_at', fiveDaysAgo)

    if (error) throw error

    let sent = 0

    for (const request of staleRequests) {
      const { data: existingReminders } = await supabase
        .from('reminders')
        .select('sent_at')
        .eq('request_id', request.id)
        .gt('sent_at', new Date(Date.now() - FIVE_DAYS_MS).toISOString())

      if (existingReminders && existingReminders.length > 0) continue

      const category = normalizeCategory(request.category)
      const staff = getStaff(category)
      const to = (staff ? staff.email : null) || request.assigned_to
      if (!to) continue

      const name = staff ? staff.name : 'colleague'
      const daysPending = Math.floor((Date.now() - new Date(request.sent_at)) / (1000 * 60 * 60 * 24))

      await transporter.sendMail({
        from: process.env.OUTLOOK_EMAIL,
        to,
        subject: `[REMINDER] [${category}] - Pending response from ${request.citizen_name} (${daysPending} days)`,
        html: `<pre style="font-family: Arial, sans-serif; font-size: 14px; white-space: pre-wrap;">${generateReminderBody(request, category, name, daysPending)}</pre>`
      })

      await supabase.from('reminders').insert({
        request_id: request.id,
        reminder_day: daysPending,
        sent_at: new Date().toISOString()
      })

      sent++
    }

    console.log(`[Reminders] ${sent} reminder(s) sent.`)
    if (res) res.json({ success: true, remindersSent: sent, checkedAt: new Date() })
  } catch (err) {
    console.error('[Reminders] Error:', err.message)
    if (next) next(err)
  }
}

function generateReminderBody(request, category, name, days) {
  return `Dear ${name},

This is a friendly reminder that the following citizen request has been waiting for your response for ${days} days and has not yet been handled.

--------------------------------------------------
Request #${request.id} | Category: ${category}
--------------------------------------------------

Citizen name:  ${request.citizen_name}
Email:         ${request.citizen_email}
Phone:         ${request.citizen_phone || 'N/A'}

Original message:
${request.message}

--------------------------------------------------
Please follow up with the citizen at your earliest convenience.

Best regards,
Arieh King's Office — Jerusalem Municipality
`
}
