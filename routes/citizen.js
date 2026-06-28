const express = require('express');
const supabase = require('../db');
const { categorizeMessage } = require('../services/categorize');

const router = express.Router();

router.post('/requests', async (req, res) => {
  const { citizen_name, citizen_email, citizen_phone, category, message } = req.body;

  if (!citizen_name || !citizen_email || !citizen_phone || !category || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const aiResult = await categorizeMessage(message);

  const { data, error } = await supabase
    .from('requests')
    .insert({
      citizen_name,
      citizen_email,
      citizen_phone,
      category,
      message,
      status: 'new',
      ai_category: aiResult ? aiResult.category : null,
      ai_confidence: aiResult ? aiResult.confidence : null,
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