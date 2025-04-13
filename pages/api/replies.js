// Файл: pages/api/replies.js
// API для получения списка ответов пользователей
import { getReplies } from '../../utils/bot';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Метод не поддерживается' });
  }

  try {
    const replies = getReplies();
    res.status(200).json({ success: true, replies });
  } catch (error) {
    console.error('Ошибка при получении списка ответов:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}