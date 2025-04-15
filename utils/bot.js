const venom = require('venom-bot');
const fs = require('fs');
const path = require('path');

let botClient = null;
let botStatus = 'stopped'; // 'stopped', 'starting', 'running', 'error'

// Для отслеживания прогресса рассылки
let messageProgress = {
  total: 0,
  sent: 0,
  error: 0
};

// Объект для отслеживания состояния диалогов с пользователями
// phoneNumber -> {stage: 'initial' | 'replied_to_initial' | 'ads_question_asked' | 'completed', adsQuestionSent: boolean}
let userDialogState = {};

// Проверяет, содержит ли сообщение пользователя ключевые слова отказа
const containsRejectionKeyword = (message, keywords) => {
  if (!message || !keywords || !Array.isArray(keywords)) return false;
  
  const lowerMsg = message.toLowerCase();
  return keywords.some(keyword => lowerMsg.includes(keyword.toLowerCase()));
};

// Функция для получения текущих настроек бота
const getBotSettings = () => {
  try {
    const settingsPath = path.join(process.cwd(), 'bot-settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      return settings;
    }
  } catch (error) {
    console.error('Ошибка при чтении настроек бота:', error);
  }

  // Возвращаем настройки по умолчанию, если файл не найден или произошла ошибка
  return {
    initialMessage: 'Здравствуйте, вы занимаетесь "{service}"?',
    internetAdsQuestion: 'Спасибо за ответ! Скажите, вам интересна реклама вашего бизнеса в интернете?',
    offerMessage: 'Отлично! Мы специализируемся на создании профессиональных сайтов...',
    messageDelay: 15,
    adsQuestionDelay: 15,
    rejectionKeywords: ["нет", "не интересно", "не надо", "не хочу", "не нужно", "дорого", "отказываюсь", "против"]
  };
};

// Функция для проверки соединения и переподключения
const ensureConnection = async (client) => {
  try {
    const clientStatus = await client.getConnectionState();
    console.log('Текущий статус соединения:', clientStatus);
    if (clientStatus !== 'CONNECTED') {
      console.log('Соединение потеряно, пытаемся переподключить...');
      await client.start();
      console.log('Бот переподключён');
    }
    return clientStatus;
  } catch (error) {
    console.error('Ошибка при проверке соединения:', error);
    throw error;
  }
};

// Функция для отправки сообщения с задержкой
const sendMessageWithDelay = async (client, to, message, delaySeconds) => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      try {
        await ensureConnection(client);
        const result = await client.sendText(to, message);
        resolve(result);
      } catch (error) {
        console.error(`Ошибка при отправке сообщения для ${to}:`, error);
        resolve(null);
      }
    }, delaySeconds * 1000);
  });
};

const initializeBot = async () => {
  if (botStatus === 'running' || botStatus === 'starting') {
    console.log(`Бот уже в состоянии ${botStatus}, возвращаем существующий botClient`);
    return botClient;
  }

  try {
    botStatus = 'starting';
    console.log('Инициализация бота...');

    botClient = await venom.create(
      'whatsapp-sender-session',
      (base64Qr, asciiQR) => {
        console.log('QR-код в ASCII:\n', asciiQR);
        const matches = base64Qr.match(/^data:image\/[a-z]+;base64,(.+)$/);
        if (matches) {
          const qrImagePath = path.join(process.cwd(), 'qr-code.png');
          fs.writeFileSync(qrImagePath, matches[1], 'base64');
          console.log(`QR-код сохранён как ${qrImagePath}`);
        }
      },
      (status) => {
        console.log('Статус сессии:', status);
      },
      {
        headless: false,
        devtools: false,
        debug: true,
        logQR: true,
        disableWelcome: true,
        sessionFolderPath: path.join(process.cwd(), 'tokens'),
        puppeteerOptions: {
          executablePath: process.env.CHROME_PATH || undefined,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      }
    );

    console.log('BotClient инициализирован:', botClient ? 'Да' : 'Нет');

    // Проверяем начальный статус соединения
    const clientStatus = await ensureConnection(botClient);
    if (clientStatus !== 'CONNECTED') {
      throw new Error('WhatsApp не подключён после инициализации, статус: ' + clientStatus);
    }

    // Регистрируем обработчик входящих сообщений
    botClient.onMessage(async (message) => {
      console.log('Получено входящее сообщение:', {
        from: message.from,
        body: message.body,
        type: message.type,
        isGroupMsg: message.isGroupMsg,
      });

      if (!message.isGroupMsg) {
        // Получаем текущие настройки бота
        const settings = getBotSettings();
        
        try {
          // Сохраняем ответ пользователя в файл
          const repliesFilePath = path.join(process.cwd(), 'replies.json');
          let replies = [];
          
          if (fs.existsSync(repliesFilePath)) {
            try {
              replies = JSON.parse(fs.readFileSync(repliesFilePath, 'utf8'));
            } catch (err) {
              console.error('Ошибка при чтении файла ответов:', err);
              replies = [];
            }
          }
          
          // Форматируем номер телефона
          const phoneNumber = message.from.replace('@c.us', '');
          
          // Определяем тип сообщения и его содержимое
          let messageContent;
          let messageType = message.type;
          
          // Обрабатываем разные типы сообщений
          switch (message.type) {
            case 'chat':
              messageContent = message.body;
              break;
            case 'audio':
            case 'ptt':
              messageContent = '[Голосовое сообщение]';
              break;
            case 'image':
              messageContent = message.caption ? `[Изображение: ${message.caption}]` : '[Изображение]';
              break;
            case 'video':
              messageContent = message.caption ? `[Видео: ${message.caption}]` : '[Видео]';
              break;
            case 'document':
              messageContent = message.caption ? `[Документ: ${message.caption}]` : '[Документ]';
              break;
            case 'location':
              messageContent = '[Местоположение]';
              break;
            case 'contact':
              messageContent = '[Контакт]';
              break;
            default:
              messageContent = message.body || `[${message.type}]`;
          }
          
          // Проверяем, есть ли уже такой номер в списке
          const existingIndex = replies.findIndex(r => r.phoneNumber === phoneNumber);
          
          if (existingIndex >= 0) {
            // Обновляем существующую запись
            replies[existingIndex].replies.push({
              message: messageContent,
              type: messageType,
              timestamp: new Date().toISOString()
            });
          } else {
            // Создаем новую запись
            // Пытаемся найти имя контакта в базе контактов
            let contactName = '';
            let serviceType = '';
            
            try {
              const contactsFilePath = path.join(process.cwd(), 'base.json');
              if (fs.existsSync(contactsFilePath)) {
                const contacts = JSON.parse(fs.readFileSync(contactsFilePath, 'utf8'));
                const contact = contacts.find(c => c.number === phoneNumber || c.number === phoneNumber.replace(/^7/, '8') || phoneNumber.includes(c.number));
                if (contact) {
                  contactName = contact.link || '';
                  serviceType = contact.link || '';
                }
              }
            } catch (err) {
              console.error('Ошибка при поиске контакта:', err);
            }
            
            replies.push({
              phoneNumber,
              contactName,
              serviceType,
              status: 'replied',
              replies: [{
                message: messageContent,
                type: messageType,
                timestamp: new Date().toISOString()
              }]
            });
          }
          
          // Сохраняем обновленный список ответов
          fs.writeFileSync(repliesFilePath, JSON.stringify(replies, null, 2));
          
          // Проверяем текущий этап диалога с пользователем
          console.log(`Обработка сообщения для ${phoneNumber}, текущий этап:`, userDialogState[phoneNumber]?.stage || 'начальный', 
                      'вопрос о рекламе отправлен:', userDialogState[phoneNumber]?.adsQuestionSent || false);
          
          if (!userDialogState[phoneNumber]) {
            // Если это первое сообщение пользователя (после инициации диалога ботом)
            // Инициализируем состояние диалога и планируем отправку вопроса о рекламе
            userDialogState[phoneNumber] = { 
              stage: 'replied_to_initial', 
              adsQuestionSent: false 
            };
            
            console.log(`Планирование отправки вопроса о рекламе для ${phoneNumber} через ${settings.adsQuestionDelay} секунд`);
            
            // Отправляем вопрос о рекламе с заданной задержкой
            sendMessageWithDelay(botClient, message.from, settings.internetAdsQuestion, settings.adsQuestionDelay)
              .then(() => {
                console.log(`Вопрос о рекламе отправлен для ${message.from}`);
                // Обновляем состояние после отправки вопроса
                if (userDialogState[phoneNumber]) {
                  userDialogState[phoneNumber].adsQuestionSent = true;
                  userDialogState[phoneNumber].stage = 'ads_question_asked';
                }
              })
              .catch(error => {
                console.error(`Ошибка при отправке вопроса о рекламе для ${message.from}:`, error);
              });
          } 
          else if (userDialogState[phoneNumber].stage === 'ads_question_asked' || 
                  (userDialogState[phoneNumber].stage === 'replied_to_initial' && userDialogState[phoneNumber].adsQuestionSent)) {
            // Пользователь ответил на вопрос о рекламе в интернете
            if (message.type === 'chat' && containsRejectionKeyword(message.body, settings.rejectionKeywords)) {
              // Если пользователь ответил отказом - не отправляем офер
              userDialogState[phoneNumber].stage = 'completed';
              console.log(`Пользователь ${message.from} отказался от рекламы в интернете`);
            } else {
              // Иначе отправляем офер
              userDialogState[phoneNumber].stage = 'completed';
              await ensureConnection(botClient);
              await botClient.sendText(message.from, settings.offerMessage);
              console.log(`Офер отправлен для ${message.from}`);
            }
          }
          // Если вопрос уже отправлен или диалог завершен, просто логируем
          else if (userDialogState[phoneNumber].stage === 'completed') {
            console.log(`Диалог с ${phoneNumber} уже завершен, игнорируем сообщение`);
          }
        } catch (error) {
          console.error(`Ошибка при обработке входящего сообщения для ${message.from}:`, error);
        }
      } else {
        console.log('Сообщение от группы, пропускаем');
      }
    });

    console.log('Обработчик onMessage зарегистрирован');

    // Добавляем обработчик состояния соединения
    botClient.onStateChange((state) => {
      console.log('Состояние соединения изменилось:', state);
      if (state === 'DISCONNECTED' || state === 'CONFLICT') {
        console.log('Соединение потеряно, переподключаем...');
        botClient.start().catch((error) => {
          console.error('Ошибка при переподключении:', error);
        });
      }
    });

    // Периодическая проверка соединения
    const keepAlive = async () => {
      while (botStatus === 'running') {
        try {
          await ensureConnection(botClient);
        } catch (error) {
          console.error('Ошибка в keepAlive:', error);
          botStatus = 'error';
          botClient = null;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 30000)); // Проверяем каждые 30 секунд
      }
    };

    botStatus = 'running';
    console.log('Бот успешно запущен:', botClient ? 'botClient создан' : 'botClient не создан');

    // Запускаем keepAlive в фоновом режиме
    keepAlive().catch((error) => {
      console.error('Ошибка в keepAlive:', error);
    });

    return botClient;
  } catch (error) {
    console.error('Ошибка при инициализации бота:', error);
    botStatus = 'error';
    throw error;
  }
};

const getBotClient = async () => {
  if (!botClient || botStatus !== 'running') {
    console.log('botClient отсутствует или не запущен, инициализируем...');
    return await initializeBot();
  }

  await ensureConnection(botClient);
  console.log('Возвращаем существующий botClient');
  return botClient;
};

const getBotStatus = () => botStatus;

// Функция для получения прогресса рассылки
const getMessageProgress = () => messageProgress;

// Функция для установки прогресса рассылки
const setMessageProgress = (progress) => {
  messageProgress = { ...progress };
};

// Функция для получения списка ответов
const getReplies = () => {
  const repliesFilePath = path.join(process.cwd(), 'replies.json');
  
  if (fs.existsSync(repliesFilePath)) {
    try {
      return JSON.parse(fs.readFileSync(repliesFilePath, 'utf8'));
    } catch (err) {
      console.error('Ошибка при чтении файла ответов:', err);
      return [];
    }
  }
  
  return [];
};

// Функция для сброса состояния диалогов
const resetUserDialogStates = () => {
  userDialogState = {};
  console.log('Состояния диалогов сброшены');
};

// Функция для перезагрузки бота
const restartBot = async () => {
  try {
    console.log('Перезагрузка бота...');
    
    // Останавливаем текущий экземпляр бота
    if (botClient) {
      try {
        await botClient.close();
        console.log('Бот остановлен');
      } catch (error) {
        console.error('Ошибка при остановке бота:', error);
      }
    }
    
    // Сбрасываем состояния диалогов при перезагрузке
    resetUserDialogStates();
    
    // Сбрасываем переменные
    botClient = null;
    botStatus = 'stopped';
    
    // Сбрасываем прогресс рассылки
    setMessageProgress({ total: 0, sent: 0, error: 0 });
    
    // Инициализируем бота заново
    return await initializeBot();
  } catch (error) {
    console.error('Ошибка при перезагрузке бота:', error);
    botStatus = 'error';
    throw error;
  }
};

module.exports = { 
  initializeBot, 
  getBotClient, 
  getBotStatus, 
  getBotSettings, 
  restartBot,
  getMessageProgress,
  setMessageProgress,
  getReplies,
  resetUserDialogStates
};