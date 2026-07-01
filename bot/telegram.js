const TelegramBot = require('node-telegram-bot-api');
const supabase = require('../db');
const { categorizeMessage } = require('../services/categorize');

const CATEGORIES = [
  { value: 'parking_fines', label: 'Parking fines' },
  { value: 'property_tax', label: 'Property tax' },
  { value: 'appointment_requests', label: 'Appointment requests' },
  { value: 'city_cleaning', label: 'City cleaning' },
  { value: 'events', label: 'Events' },
  { value: 'road_safety', label: 'Road safety' },
  { value: 'other', label: 'Other' },
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Holds the in-progress conversation for each Telegram user
const sessions = {};

async function saveRequest(bot, chatId, session, fileBuffer, fileName, fileMimeType) {
  let file_path = null;

  if (fileBuffer) {
    const safeName = `${Date.now()}_${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('request-files')
      .upload(safeName, fileBuffer, { contentType: fileMimeType });

    if (uploadError) {
      console.error('Telegram file upload error:', uploadError);
    } else {
      file_path = safeName;
    }
  }

  const aiResult = await categorizeMessage(session.data.message);

  const { error } = await supabase
  .from('requests')
  .insert({
    citizen_name: session.data.citizen_name,
    citizen_email: session.data.citizen_email,
    citizen_phone: session.data.citizen_phone,
    category: session.data.category,
    message: session.data.message,
    status: 'new',
    ai_category: aiResult ? aiResult.category : null,
    ai_confidence: aiResult ? aiResult.confidence : null,
    file_path,
  });

if (error) {
  console.error('Telegram insert error:', error);
  bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again later.');
} else {
  bot.sendMessage(chatId, 'Your request was received. We will get back to you soon.');
}

  delete sessions[chatId];
}

function startBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log('TELEGRAM_BOT_TOKEN missing — Telegram bot not started');
    return;
  }

  const bot = new TelegramBot(token, { polling: true });

  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    sessions[chatId] = { step: 'name', data: {} };
    bot.sendMessage(chatId, 'Welcome to the Citizen Requests service. What is your full name?');
  });

  // Handle button taps (category selection, and file yes/no)
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const session = sessions[chatId];
    if (!session) return;
    bot.answerCallbackQuery(query.id);

    if (session.step === 'category') {
      session.data.category = query.data;
      session.step = 'message';
      bot.sendMessage(chatId, 'Please describe your request in detail (at least 20 characters).');
      return;
    }

    if (session.step === 'ask_file') {
      if (query.data === 'file_yes') {
        session.step = 'awaiting_file';
        bot.sendMessage(chatId, 'Please send the file (JPG, PNG, PDF, or DOCX, up to 10MB).');
      } else {
        session.step = 'done';
        await saveRequest(bot, chatId, session, null, null, null);
      }
      return;
    }
  });

  // Handle documents and photos (attachments)
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const session = sessions[chatId];

    if (!session || session.step !== 'awaiting_file') return;
    if (!msg.document && !msg.photo) return;

    let fileId, fileName, mimeType;

    if (msg.document) {
      if (!ALLOWED_DOCUMENT_TYPES.includes(msg.document.mime_type)) {
        bot.sendMessage(chatId, 'Unsupported file type. Please send a JPG, PNG, PDF, or DOCX file.');
        return;
      }
      fileId = msg.document.file_id;
      fileName = msg.document.file_name || 'document';
      mimeType = msg.document.mime_type;
    } else {
      // photo: take the largest available size
      const largest = msg.photo[msg.photo.length - 1];
      fileId = largest.file_id;
      fileName = `${fileId}.jpg`;
      mimeType = 'image/jpeg';
    }

    try {
      const fileLink = await bot.getFileLink(fileId);
      const response = await fetch(fileLink);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length > 10 * 1024 * 1024) {
        bot.sendMessage(chatId, 'File is too large. Maximum size is 10MB. Please send a smaller file.');
        return;
      }

      session.step = 'done';
      await saveRequest(bot, chatId, session, buffer, fileName, mimeType);
    } catch (err) {
      console.error('Telegram file download error:', err);
      bot.sendMessage(chatId, 'Sorry, something went wrong while processing your file. Please try again.');
    }
  });

  // Handle all text messages (the guided conversation steps)
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || text.startsWith('/')) return;

    const session = sessions[chatId];
    if (!session) {
      bot.sendMessage(chatId, 'Send /start to submit a new request.');
      return;
    }

    if (session.step === 'name') {
      session.data.citizen_name = text;
      session.step = 'email';
      bot.sendMessage(chatId, 'Thank you. What is your email address?');
      return;
    }

    if (session.step === 'email') {
      const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!EMAIL_REGEX.test(text)) {
        bot.sendMessage(chatId, 'Please enter a valid email address');
        return;
      }
      session.data.citizen_email = text;
      session.step = 'phone';
      bot.sendMessage(chatId, 'What is your phone number?');
      return;
    }

    if (session.step === 'phone') {
      session.data.citizen_phone = text;
      session.step = 'category';
      bot.sendMessage(chatId, 'Please choose a category:', {
        reply_markup: {
          inline_keyboard: CATEGORIES.map((c) => [{ text: c.label, callback_data: c.value }]),
        },
      });
      return;
    }

    if (session.step === 'message') {
      if (text.length < 20) {
        bot.sendMessage(chatId, 'Your description is too short. Please use at least 20 characters.');
        return;
      }
      session.data.message = text;
      session.step = 'ask_file';
      bot.sendMessage(chatId, 'Would you like to attach a file?', {
        reply_markup: {
          inline_keyboard: [[
            { text: 'Yes', callback_data: 'file_yes' },
            { text: 'No', callback_data: 'file_no' },
          ]],
        },
      });
      return;
    }
  });

  console.log('Telegram bot started');
}

module.exports = { startBot };