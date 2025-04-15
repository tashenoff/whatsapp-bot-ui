// Файл: pages/api/bot-settings.js
// API для сохранения и получения настроек бота
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const settingsPath = path.join(process.cwd(), 'bot-settings.json');
  
  // GET - получить текущие настройки
  if (req.method === 'GET') {
    try {
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        return res.status(200).json({ success: true, settings });
      } else {
        // Возвращаем настройки по умолчанию
        return res.status(200).json({ 
          success: true, 
          settings: {
            initialMessage: 'Здравствуйте, вы занимаетесь "{service}"?',
            internetAdsQuestion: 'Спасибо за ответ! Скажите, вам интересна реклама вашего бизнеса в интернете?',
            offerMessage: `Отлично! Мы специализируемся на создании профессиональных сайтов для мастеров по ремонту бытовой техники. 

Наше предложение:
✅ Создание современного сайта с адаптивным дизайном
✅ SEO-оптимизация для лучшей видимости в поисковиках
✅ Форма для онлайн-записи клиентов
✅ Интеграция с WhatsApp и другими мессенджерами
✅ Техническая поддержка сайта

Стоимость от 30,000 тг.
Срок изготовления: 5-7 дней.

Заинтересовало предложение?`,
            messageDelay: 15,
            adsQuestionDelay: 15,
            rejectionKeywords: ["нет", "не интересно", "не надо", "не хочу", "не нужно", "дорого", "отказываюсь", "против"]
          }
        });
      }
    } catch (error) {
      console.error('Ошибка при получении настроек:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // POST - сохранить настройки
  if (req.method === 'POST') {
    try {
      const { initialMessage, internetAdsQuestion, offerMessage, messageDelay, adsQuestionDelay, rejectionKeywords } = req.body;
      
      // Проверяем наличие обязательных полей
      if (!initialMessage || !internetAdsQuestion || !offerMessage || !messageDelay || !adsQuestionDelay) {
        return res.status(400).json({ 
          success: false, 
          error: 'Требуются все поля: initialMessage, internetAdsQuestion, offerMessage, messageDelay, adsQuestionDelay' 
        });
      }
      
      // Сохраняем настройки в JSON файл
      fs.writeFileSync(settingsPath, JSON.stringify({
        initialMessage,
        internetAdsQuestion,
        offerMessage,
        messageDelay,
        adsQuestionDelay,
        rejectionKeywords: Array.isArray(rejectionKeywords) ? rejectionKeywords : [
          "нет", "не интересно", "не надо", "не хочу", "не нужно", "дорого", "отказываюсь", "против"
        ]
      }, null, 2));
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Ошибка при сохранении настроек:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // Для остальных методов возвращаем ошибку
  res.status(405).json({ success: false, error: 'Метод не поддерживается' });
}