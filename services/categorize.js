const OpenAI = require('openai');

const VALID_CATEGORIES = [
  'parking_fines',
  'property_tax',
  'appointment_requests',
  'city_cleaning',
  'events',
  'road_safety',
  'other',
];

async function categorizeMessage(message) {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You categorize citizen requests for a municipality. ' +
            'Return JSON only in this exact format: {"category": "...", "confidence": 0.95}. ' +
            'category must be exactly one of: parking_fines, property_tax, appointment_requests, city_cleaning, events, road_safety, other. ' +
            'confidence must be a number between 0 and 1 representing how confident you are in the category.',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return null;
    }

    const parsed = JSON.parse(content);
    const category = parsed.category;
    const confidence = typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : null;

    if (!VALID_CATEGORIES.includes(category)) {
      return null;
    }

    return { category, confidence };
  } catch (error) {
    console.error('OpenAI categorization error:', error);
    return null;
  }
}

module.exports = { categorizeMessage, VALID_CATEGORIES };
