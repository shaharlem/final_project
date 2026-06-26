const nodemailer = require('nodemailer')
const supabase = require('../models/database')
const normalizeCategory = require('../models/normalizeCategory')
const { getStaff } = require('../models/staffMap')

const transporter = nodemailer.createTransport({
  service: 'outlook',
  auth: {
    user: process.env.OUTLOOK_EMAIL,
    pass: process.env.OUTLOOK_PASSWORD
  }
})

exports.getEmailDraft = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: request, error } = await supabase
      .from('requests')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !request) return res.status(404).json({ error: 'Request not found' })

    const category = normalizeCategory(request.category)
    const staff = getStaff(category)
    const to = (staff ? staff.email : null) || request.assigned_to
    const subject = `[${category}] - New request from ${request.citizen_name}`
    const body = generateEmailBody({ ...request, category }, staff)

    res.json({ to, subject, body, requestId: id })
  } catch (err) {
    next(err)
  }
}

exports.sendEmail = async (req, res, next) => {
  try {
    const { requestId, to, subject, body } = req.body

    if (!requestId || !to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    await transporter.sendMail({
      from: process.env.OUTLOOK_EMAIL,
      to,
      subject,
      html: plainToHtml(body)
    })

    await supabase
      .from('requests')
      .update({ status: 'sent', sent_at: new Date(), updated_at: new Date() })
      .eq('id', requestId)

    res.json({ success: true, requestId, sentAt: new Date(), message: 'Email sent successfully' })
  } catch (err) {
    next(err)
  }
}

function generateEmailBody(request, staff) {
  const name = staff ? staff.name : 'colleague'
  const intro = staff ? staff.intro : 'A new citizen request has been submitted and forwarded to you for handling.'

  return `Dear ${name},

${intro}

--------------------------------------------------
Request #${request.id} | Category: ${request.category}
--------------------------------------------------

Citizen name:  ${request.citizen_name}
Email:         ${request.citizen_email}
Phone:         ${request.citizen_phone || 'N/A'}

Message from citizen:
${request.message}

--------------------------------------------------
Kindly follow up with the citizen at your earliest convenience.

Best regards,
Arieh King's Office — Jerusalem Municipality
`
}

function plainToHtml(text) {
  return `<pre style="font-family: Arial, sans-serif; font-size: 14px; white-space: pre-wrap;">${text}</pre>`
}
