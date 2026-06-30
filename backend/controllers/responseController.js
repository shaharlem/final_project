const nodemailer = require('nodemailer')
const supabase = require('../models/database')
const Response = require('../models/Response')
const { validateStaffEmail } = require('../middleware/auth')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
})

exports.saveResponse = async (req, res, next) => {
  try {
    const { requestId, responseText, fromEmail } = req.body

    if (!validateStaffEmail(fromEmail)) {
      return res.status(403).json({ error: 'Email not authorized' })
    }

    const response = await Response.create({ requestId, responseText, fromEmail })

    const { data: request } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (!request) return res.status(404).json({ error: 'Request not found' })

    const citizenEmailBody = `
      <div dir="rtl" style="font-family: Arial, sans-serif;">
        <h3>תשובה לבקשתך</h3>
        <p><strong>מספר דוסייה:</strong> ${request.id}</p>
        <p><strong>התשובה:</strong></p>
        <p>${responseText}</p>
        <hr>
        <p><small>עיריית ירושלים</small></p>
      </div>
    `

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: request.citizen_email,
      subject: `תשובה לבקשתך - מספר ${request.id}`,
      html: citizenEmailBody
    })

    await supabase
      .from('requests')
      .update({ status: 'responded', response_received_at: new Date(), updated_at: new Date() })
      .eq('id', requestId)

    res.json({ success: true, response })
  } catch (err) {
    next(err)
  }
}
