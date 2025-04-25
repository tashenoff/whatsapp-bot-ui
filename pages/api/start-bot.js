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
    // Получаем опции из запроса
    const options = req.body || {};
    const contactLimit = options.contactLimit || 0;

    const client = await initializeBot();
    
    const jsonFilePath = path.join(process.cwd(), 'base.json');
    const allContacts = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    
    // Получаем список контактов, для которых сообщение еще не отправлено
    const pendingContacts = allContacts.filter(contact => contact.messageStatus !== 'sent');
    
    // Выбираем контакты для обработки
    let contactsToProcess = pendingContacts;
    
    // Ограничиваем число контактов для текущей сессии, если указан лимит
    if (contactLimit > 0 && pendingContacts.length > contactLimit) {
      contactsToProcess = pendingContacts.slice(0, contactLimit);
      console.log(`Применено ограничение: будет обработано только ${contactLimit} контактов из ${pendingContacts.length} ожидающих`);
    }
    
    // Получаем список контактов, которые уже были обработаны
    const processedContacts = allContacts.filter(contact => contact.messageStatus === 'sent');
    
    // Отображаем в прогрессе только контакты, которые уже обработаны + те, которые будем обрабатывать в этой сессии
    const totalContactsForProgress = processedContacts.length + contactsToProcess.length;
    
    // Устанавливаем начальный прогресс
    setMessageProgress({ 
      total: totalContactsForProgress,
      sent: processedContacts.length,
      error: allContacts.filter(c => c.messageStatus === 'error').length
    });
    
    // Запускаем рассылку в фоновом режиме
    sendMessagesInBackground(client, allContacts, contactsToProcess, jsonFilePath)
      .catch(error => {
        console.error('Ошибка при массовой рассылке:', error);
      });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Ошибка при запуске бота:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function sendMessagesInBackground(client, allContacts, contactsToProcess, jsonFilePath) {
  // Получаем настройки бота из JSON-файла
  const settings = getBotSettings();
  const messageDelay = settings.messageDelay * 1000; // переводим в миллисекунды
  
  // Получаем текущие счетчики для прогресса
  const totalForProgress = contactsToProcess.length + allContacts.filter(c => c.messageStatus === 'sent').length;
  const sentCount = allContacts.filter(c => c.messageStatus === 'sent').length;
  const errorCount = allContacts.filter(c => c.messageStatus === 'error').length;

  // Обновляем прогресс перед началом
  setMessageProgress({ 
    total: totalForProgress, 
    sent: sentCount, 
    error: errorCount 
  });

  // Обрабатываем только выбранные контакты
  for (let i = 0; i < contactsToProcess.length; i++) {
    const contact = contactsToProcess[i];
    const contactIndex = allContacts.findIndex(c => c.number === contact.number);
    
    if (contactIndex === -1) {
      console.log(`Контакт ${contact.number} не найден в полном списке, пропускаем`);
      continue;
    }
    
    const phoneNumber = `${contact.number.replace(/\D/g, '')}@c.us`;
    // Используем настройки для начального сообщения с подстановкой услуги
    const initialMessage = settings.initialMessage.replace('{service}', contact.link);
    
    try {
      console.log(`Отправка ${i+1}/${contactsToProcess.length} на номер ${contact.number}: ${initialMessage}`);
      await client.sendText(phoneNumber, initialMessage);
      
      // Обновляем статус в полном списке контактов
      allContacts[contactIndex].messageStatus = 'sent';
      allContacts[contactIndex].messageSentDate = new Date().toISOString();
      
      // Сохраняем полный список контактов в JSON-файл
      fs.writeFileSync(jsonFilePath, JSON.stringify(allContacts, null, 2));
      
      // Обновляем прогресс после каждой отправки
      const currentSentCount = allContacts.filter(c => c.messageStatus === 'sent').length;
      const currentErrorCount = allContacts.filter(c => c.messageStatus === 'error').length;
      
      setMessageProgress({ 
        total: totalForProgress, 
        sent: currentSentCount, 
        error: currentErrorCount 
      });
      
      if (i < contactsToProcess.length - 1) {
        await new Promise(resolve => setTimeout(resolve, messageDelay));
      }
    } catch (error) {
      console.error(`Ошибка отправки на ${contact.number}:`, error);
      
      // Обновляем статус ошибки в полном списке контактов
      allContacts[contactIndex].messageStatus = 'error';
      allContacts[contactIndex].messageError = error.message;
      
      // Сохраняем полный список контактов в JSON-файл
      fs.writeFileSync(jsonFilePath, JSON.stringify(allContacts, null, 2));
      
      // Обновляем прогресс после ошибки
      const currentSentCount = allContacts.filter(c => c.messageStatus === 'sent').length;
      const currentErrorCount = allContacts.filter(c => c.messageStatus === 'error').length;
      
      setMessageProgress({ 
        total: totalForProgress, 
        sent: currentSentCount, 
        error: currentErrorCount 
      });
    }
  }
  
  console.log('Массовая рассылка завершена!');
}