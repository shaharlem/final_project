const express = require('express');
const multer = require('multer');
const supabase = require('../db');
const { categorizeMessage } = require('../services/categorize');

const router = express.Router();

// Accept files in memory, max 10MB, allowed types only
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

router.post('/requests', upload.single('document'), async (req, res) => {
  const { citizen_name, citizen_email, citizen_phone, category, message } = req.body;

  if (!citizen_name || !citizen_email || !citizen_phone || !category || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // If a file was uploaded, send it to Supabase Storage
  let file_path = null;
  if (req.file) {
    const fileName = `${Date.now()}_${req.file.originalname}`;
    const { error: uploadError } = await supabase.storage
      .from('request-files')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (uploadError) {
      console.error('Supabase storage error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload file' });
    }
    file_path = fileName;
  }

  const ai_category = await categorizeMessage(message);

  const { data, error } = await supabase
    .from('requests')
    .insert({
      citizen_name,
      citizen_email,
      citizen_phone,
      category,
      message,
      status: 'new',
      ai_category,
      file_path,
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