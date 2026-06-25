const VALID_EMAILS = [
  'natalie@jerusalem.gov.il',
  'moche@jerusalem.gov.il',
  'meir@jerusalem.gov.il',
  'gil@jerusalem.gov.il',
  'yehuda@jerusalem.gov.il',
  'tzvi@jerusalem.gov.il'
]

function validateStaffEmail(email) {
  return VALID_EMAILS.includes(email)
}

module.exports = { validateStaffEmail, VALID_EMAILS }
