// Файл: pages/api/bot-progress.js
// API для получения прогресса рассылки
import { getMessageProgress } from '../../utils/bot';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Метод не поддерживается' });
  }

  try {
    const progress = getMessageProgress();
    res.status(200).json({ success: true, progress });
  } catch (error) {
    console.error('Ошибка при получении прогресса:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}