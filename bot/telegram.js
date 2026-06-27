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

// Holds the in-progress conversation for each Telegram user
const sessions = {};

function startBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log('TELEGRAM_BOT_TOKEN missing — Telegram bot not started');
    return;
  }

  const bot = new TelegramBot(token, { polling: true });

  // /start — begin a new request
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    sessions[chatId] = { step: 'name', data: {} };
    bot.sendMessage(chatId, 'Welcome to the Citizen Requests service. What is your full name?');
  });

  // Handle category button taps
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const session = sessions[chatId];
    if (!session || session.step !== 'category') return;

    session.data.category = query.data;
    session.step = 'message';
    bot.answerCallbackQuery(query.id);
    bot.sendMessage(chatId, 'Please describe your request in detail (at least 20 characters).');
  });

  // Handle all text messages
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Ignore commands here (handled separately) and empty messages
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

      // AI categorization (same as the web form)
      const ai_category = await categorizeMessage(text);

      const { data, error } = await supabase
        .from('requests')
        .insert({
          citizen_name: session.data.citizen_name,
          citizen_email: session.data.citizen_email,
          citizen_phone: session.data.citizen_phone,
          category: session.data.category,
          message: session.data.message,
          status: 'new',
          ai_category,
        })
        .select()
        .single();

      if (error) {
        console.error('Telegram insert error:', error);
        bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again later.');
      } else {
        bot.sendMessage(chatId, `Your request was received. Case number: ${data.id}. We will get back to you soon.`);
      }

      delete sessions[chatId];
      return;
    }
  });

  console.log('Telegram bot started');
}

module.exports = { startBot };