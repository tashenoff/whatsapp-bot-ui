// Файл: pages/api/reset-statistics.js
// API для сброса статистики ответов
import fs from 'fs';
import path from 'path';
import { resetUserDialogStates } from '../../utils/bot';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Метод не поддерживается' });
  }

  try {
    // Очищаем файл с ответами (replies.json)
    const repliesFilePath = path.join(process.cwd(), 'replies.json');
    fs.writeFileSync(repliesFilePath, JSON.stringify([], null, 2));
    
    // Сбрасываем состояние диалогов
    resetUserDialogStates();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Статистика успешно сброшена' 
    });
  } catch (error) {
    console.error('Ошибка при сбросе статистики:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}