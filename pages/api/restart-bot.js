// Файл: pages/api/restart-bot.js
// API для перезагрузки бота
import { restartBot, getBotStatus } from '../../utils/bot';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Метод не поддерживается' });
  }

  const currentStatus = getBotStatus();
  if (currentStatus === 'starting') {
    return res.status(400).json({ success: false, error: 'Бот в процессе запуска, подождите' });
  }

  try {
    await restartBot();
    res.status(200).json({ success: true, message: 'Бот успешно перезагружен' });
  } catch (error) {
    console.error('Ошибка при перезагрузке бота:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}