import fs from 'fs';
import path from 'path';
import { initializeBot, getBotStatus, getBotSettings, setMessageProgress } from '../../utils/bot';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Метод не поддерживается' });
  }

  const currentStatus = getBotStatus();
  if (currentStatus === 'running' || currentStatus === 'starting') {
    return res.status(400).json({ success: false, error: 'Бот уже запущен или запускается' });
  }

  try {
    const client = await initializeBot();
    
    const jsonFilePath = path.join(process.cwd(), 'base.json');
    const contacts = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    
    // Получаем список контактов, для которых сообщение еще не отправлено
    const pendingContacts = contacts.filter(contact => contact.messageStatus !== 'sent');
    
    // Устанавливаем начальный прогресс
    setMessageProgress({ 
      total: contacts.length,
      sent: contacts.length - pendingContacts.length,
      error: 0
    });
    
    // Запускаем рассылку в фоновом режиме
    sendMessagesInBackground(client, contacts, jsonFilePath)
      .catch(error => {
        console.error('Ошибка при массовой рассылке:', error);
      });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Ошибка при запуске бота:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function sendMessagesInBackground(client, contacts, jsonFilePath) {
  // Получаем настройки бота из JSON-файла
  const settings = getBotSettings();
  const messageDelay = settings.messageDelay * 1000; // переводим в миллисекунды
  
  // Получаем список контактов, для которых сообщение еще не отправлено
  const pendingContacts = contacts.filter(contact => contact.messageStatus !== 'sent');

  // Обновляем прогресс
  setMessageProgress({ 
    total: contacts.length, 
    sent: contacts.length - pendingContacts.length, 
    error: contacts.filter(c => c.messageStatus === 'error').length 
  });

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    
    if (contact.messageStatus === 'sent') {
      console.log(`Пропускаем ${contact.number}, сообщение уже отправлено ранее`);
      continue;
    }
    
    const phoneNumber = `${contact.number.replace(/\D/g, '')}@c.us`;
    // Используем настройки для начального сообщения с подстановкой услуги
    const initialMessage = settings.initialMessage.replace('{service}', contact.link);
    
    try {
      console.log(`Отправка ${i+1}/${contacts.length} на номер ${contact.number}: ${initialMessage}`);
      await client.sendText(phoneNumber, initialMessage);
      
      contact.messageStatus = 'sent';
      contact.messageSentDate = new Date().toISOString();
      
      fs.writeFileSync(jsonFilePath, JSON.stringify(contacts, null, 2));
      
      // Обновляем прогресс после каждой отправки
      const sentCount = contacts.filter(c => c.messageStatus === 'sent').length;
      const errorCount = contacts.filter(c => c.messageStatus === 'error').length;
      
      setMessageProgress({ 
        total: contacts.length, 
        sent: sentCount, 
        error: errorCount 
      });
      
      if (i < contacts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, messageDelay));
      }
    } catch (error) {
      console.error(`Ошибка отправки на ${contact.number}:`, error);
      contact.messageStatus = 'error';
      contact.messageError = error.message;
      fs.writeFileSync(jsonFilePath, JSON.stringify(contacts, null, 2));
      
      // Обновляем прогресс после ошибки
      const sentCount = contacts.filter(c => c.messageStatus === 'sent').length;
      const errorCount = contacts.filter(c => c.messageStatus === 'error').length;
      
      setMessageProgress({ 
        total: contacts.length, 
        sent: sentCount, 
        error: errorCount 
      });
    }
  }
  
  console.log('Массовая рассылка завершена!');
}