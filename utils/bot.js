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
    offerMessage: 'Спасибо за ваш ответ!\n\nМы специализируемся на создании профессиональных сайтов...',
    messageDelay: 15
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
          
          // Отправляем офер в ответ на любой тип сообщения
          await ensureConnection(botClient);
          await botClient.sendText(message.from, settings.offerMessage);
          console.log(`Офер отправлен для ${message.from}`);
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
  getReplies
};