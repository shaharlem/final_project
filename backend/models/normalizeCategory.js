const NORMALIZE = {
  'parking_fines':        'Parking fines',
  'property_tax':         'Property tax',
  'appointment_requests': 'Appointment requests',
  'city_cleaning':        'City cleaning',
  'events':               'Events',
  'road_safety':          'Road safety',
  'other':                'Other'
}

function normalizeCategory(category) {
  if (!category) return category
  return NORMALIZE[category.toLowerCase()] || category
}

module.exports = normalizeCategory
