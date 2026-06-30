const VALID_EMAILS = [
  'meir_na@jerusalem.muni.il',
  'natali_za@jerusalem.muni.il',
  'Moshe_Tu@jerusalem.muni.il',
  'GOGILI@jerusalem.muni.il',
  'YNAFTALI@jerusalem.muni.il',
  'zvi_de@jerusalem.muni.il',
  'ERSMADAR@jerusalem.muni.il',
  'arking@jerusalem.muni.ac.il',
  'haimtouboul@gmail.com'
]

function validateStaffEmail(email) {
  return VALID_EMAILS.includes(email)
}

module.exports = { validateStaffEmail, VALID_EMAILS }
