const express = require('express');
const multer = require('multer');
const supabase = require('../db');
const { categorizeMessage } = require('../services/categorize');

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function handleUpload(req, res, next) {
  upload.single('document')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size must be under 10MB' });
      }
      if (err.message === 'Invalid file type') {
        return res.status(400).json({ error: 'Only JPG, PNG, PDF, or DOCX files are allowed' });
      }
      return next(err);
    }
    next();
  });
}

router.post('/requests', handleUpload, async (req, res) => {
  const citizen_name = (req.body.citizen_name || '').trim();
  const citizen_email = (req.body.citizen_email || '').trim();
  const citizen_phone = (req.body.citizen_phone || '').trim();
  const category = req.body.category;
  const message = (req.body.message || '').trim();

  if (!citizen_name || !citizen_email || !citizen_phone || !category || !message) {
    return res.status(400).json({ error: 'Please fill in all required fields' });
  }

  if (!EMAIL_REGEX.test(citizen_email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  if (message.length < 20 || message.length > 20000) {
    return res.status(400).json({ error: 'Message must be between 20 and 20,000 characters' });
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