// Файл: pages/api/statistics.js
// API для получения статистики ответов, отказов и принятий предложений
import { getStatistics } from '../../utils/bot';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Метод не поддерживается' });
  }

  try {
    const statistics = getStatistics();
    return res.status(200).json({ success: true, statistics });
  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}