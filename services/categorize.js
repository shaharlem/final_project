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
            'Return JSON only in this exact format: {"category": "...", "confidence": 0.0}. ' +
            'category must be exactly one of: parking_fines, property_tax, appointment_requests, city_cleaning, events, road_safety, other. ' +
            'confidence must be a number between 0.0 and 1.0, reflecting how clearly the message text matches the chosen category — not how the message is worded. ' +
            'Use HIGH confidence (0.9-1.0) only when the message contains clear, specific, unambiguous keywords for one category. ' +
            'Use MEDIUM confidence (0.5-0.89) when the message is understandable but could reasonably fit more than one category, or relies on inference rather than explicit keywords. ' +
            'Use LOW confidence (below 0.5) when the message is vague, generic, off-topic, or does not clearly relate to any specific category. ' +
            'Be conservative: most real-world messages are not perfectly clear-cut, so avoid defaulting to high confidence.',
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
    const confidence = Number(parsed.confidence);

    if (!VALID_CATEGORIES.includes(category)) {
      return null;
    }

    if (Number.isNaN(confidence) || confidence < 0 || confidence > 1) {
      return null;
    }

    return { category, confidence };
  } catch (error) {
    console.error('OpenAI categorization error:', error);
    return null;
  }
}

module.exports = { categorizeMessage, VALID_CATEGORIES };