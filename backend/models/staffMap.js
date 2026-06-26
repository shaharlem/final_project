const STAFF_MAP = {
  'Parking fines': {
    email:     'natali_za@jerusalem.muni.il',
    name:      'Natalie',
    fullName:  'Natalie Zaken',
    intro:     'I hope this message finds you well. A new parking-related request has come in from a citizen and has been routed to your desk for review.'
  },
  'Property tax': {
    email:     'Moshe_Tu@jerusalem.muni.il',
    name:      'Moshe',
    fullName:  'Moshe Tuitou',
    intro:     'A new property tax inquiry has been submitted by a citizen and forwarded to you for handling. Please review the details below at your earliest convenience.'
  },
  'Appointment requests': {
    email:     'meir_na@jerusalem.muni.il',
    name:      'Meir',
    fullName:  'Meir Nakache',
    intro:     'A citizen has submitted an appointment request through our system. The request has been assigned to you — please coordinate with the citizen to confirm a suitable time.'
  },
  'City cleaning': {
    email:     'GOGILI@jerusalem.muni.il',
    name:      'Gil',
    fullName:  'Gil Gorani',
    intro:     'A new city cleaning complaint has been reported by a citizen in your area of responsibility. Please review and dispatch a team as needed.'
  },
  'Events': {
    email:     'YNAFTALI@jerusalem.muni.il',
    name:      'Yehuda',
    fullName:  'Yehuda Naftali',
    intro:     'A citizen has submitted a new event-related request or permit application. I am forwarding it to you for review and follow-up.'
  },
  'Road safety': {
    email:     'zvi_de@jerusalem.muni.il',
    name:      'Tzvi',
    fullName:  'Tzvi Dekel',
    intro:     'A road safety concern has been reported by a citizen and flagged for your attention. Please assess the situation and take the appropriate action.'
  },
  'Other': {
    email:     'arking@jerusalem.muni.ac.il',
    name:      'Arieh',
    fullName:  'Arieh King',
    intro:     'A citizen request came in that our system was unable to automatically classify. I am bringing it directly to your attention so you can decide how best to route or handle it.'
  }
}

function getStaff(category) {
  return STAFF_MAP[category] || null
}

module.exports = { STAFF_MAP, getStaff }
