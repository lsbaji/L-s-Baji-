import axios from 'axios';

// @ts-ignore
const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
// @ts-ignore
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

export const sendTelegramNotification = async (message: string) => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('Telegram credentials not configured');
    return;
  }

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    });
  } catch (error: any) {
    if (error.response) {
      console.error('Telegram API responded with error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Telegram API did not respond:', error.request);
    } else {
      console.error('Error setting up Telegram request:', error.message);
    }
  }
};
