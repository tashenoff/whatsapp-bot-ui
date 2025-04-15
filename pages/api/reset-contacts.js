// Файл: pages/api/reset-contacts.js
// API для сброса статуса всех контактов
import fs from 'fs';
import path from 'path';
import { resetUserDialogStates } from '../../utils/bot';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Метод не поддерживается' });
  }

  try {
    const jsonFilePath = path.join(process.cwd(), 'base.json');
    
    // Читаем текущий список контактов
    const contacts = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    
    // Сбрасываем статус отправки для всех контактов
    const resetContacts = contacts.map(contact => {
      // Удаляем поля связанные со статусом отправки
      const { messageStatus, messageSentDate, messageError, ...restContact } = contact;
      return restContact;
    });
    
    // Сохраняем обновленный список контактов
    fs.writeFileSync(jsonFilePath, JSON.stringify(resetContacts, null, 2));
    
    // Сбрасываем все состояния диалогов в боте
    resetUserDialogStates();
    
    res.status(200).json({ success: true, message: 'Статус всех контактов и состояния диалогов сброшены' });
  } catch (error) {
    console.error('Ошибка при сбросе статуса контактов:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}