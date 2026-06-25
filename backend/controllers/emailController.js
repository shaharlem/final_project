const nodemailer = require('nodemailer')
const supabase = require('../models/database')

const CATEGORY_MAP = {
  'Parking fines':        'natali_za@jerusalem.muni.il',
  'Property tax':         'Moshe_Tu@jerusalem.muni.il',
  'Appointment requests': 'meir_na@jerusalem.muni.il',
  'City cleaning':        'GOGILI@jerusalem.muni.il',
  'Events':               'YNAFTALI@jerusalem.muni.il',
  'Road safety':          'zvi_de@jerusalem.muni.il',
  'Other':                'arking@jerusalem.muni.ac.il'
}

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

    const to = CATEGORY_MAP[request.category] || request.assigned_to
    const subject = `[${request.category}] - בקשה חדשה מ-${request.citizen_name}`
    const body = generateEmailBody(request)

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
      html: body
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

function generateEmailBody(request) {
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif;">
      <h3>בקשה חדשה</h3>
      <p><strong>שם:</strong> ${request.citizen_name}</p>
      <p><strong>דוא"ל:</strong> ${request.citizen_email}</p>
      <p><strong>טלפון:</strong> ${request.citizen_phone}</p>
      <p><strong>קטגוריה:</strong> ${request.category}</p>
      <p><strong>הודעה:</strong></p>
      <p>${request.message}</p>
      <hr>
      <p><small>מספר דוסייה: ${request.id}</small></p>
    </div>
  `
}
