const express = require('express');
const OpenAI = require('openai');
const supabase = require('../db');

const router = express.Router();

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
            'confidence must be a number between 0.0 and 1.0. ' +
            'category must be exactly one of: parking_fines, property_tax, appointment_requests, city_cleaning, events, road_safety, other.',
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

router.post('/requests', async (req, res) => {
  const { citizen_name, citizen_email, citizen_phone, category, message } = req.body;

  if (!citizen_name || !citizen_email || !citizen_phone || !category || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const aiResult = await categorizeMessage(message);
  const ai_confidence = aiResult ? aiResult.confidence : null;

  const { data, error } = await supabase
    .from('requests')
    .insert({
      citizen_name,
      citizen_email,
      citizen_phone,
      category,
      message,
      status: 'new',
      ai_confidence,
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase insert error:', error);
    return res.status(500).json({ error: 'Failed to save request' });
  }

  return res.status(201).json({
    id: data.id,
    category: data.category,
    created_at: data.created_at,
  });
});

module.exports = router;
