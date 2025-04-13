// Файл: pages/api/bot-status.js
// API для получения текущего статуса бота
import { getBotStatus } from '../../utils/bot';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Метод не поддерживается' });
  }

  try {
    const status = getBotStatus();
    res.status(200).json({ success: true, status });
  } catch (error) {
    console.error('Ошибка при получении статуса бота:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}