import { useState, useEffect } from 'react';
// Файл: components/BotMessageSettings.js
export default function BotMessageSettings() {
    // Настройки текста для бота
    const [initialMessage, setInitialMessage] = useState('Здравствуйте, вы занимаетесь "{service}"?');
    const [internetAdsQuestion, setInternetAdsQuestion] = useState('Спасибо за ответ! Скажите, вам интересна реклама вашего бизнеса в интернете?');
    const [offerMessage, setOfferMessage] = useState(`Отлично! Мы специализируемся на создании профессиональных сайтов для мастеров по ремонту бытовой техники. 
  
  Наше предложение:
  ✅ Создание современного сайта с адаптивным дизайном
  ✅ SEO-оптимизация для лучшей видимости в поисковиках
  ✅ Форма для онлайн-записи клиентов
  ✅ Интеграция с WhatsApp и другими мессенджерами
  ✅ Техническая поддержка сайта
  
  Стоимость от 30,000 тг.
  Срок изготовления: 5-7 дней.
  
  Заинтересовало предложение?`);
    
    const [messageDelay, setMessageDelay] = useState(15);
    const [adsQuestionDelay, setAdsQuestionDelay] = useState(15);
    const [rejectionKeywords, setRejectionKeywords] = useState(["нет", "не интересно", "не надо", "не хочу", "не нужно", "дорого", "отказываюсь", "против"]);
    const [rejectionKeywordsText, setRejectionKeywordsText] = useState("");
    const [loading, setLoading] = useState(true);
  
    // Преобразование массива ключевых слов в текст при загрузке компонента
    useEffect(() => {
      if (rejectionKeywords && Array.isArray(rejectionKeywords) && rejectionKeywords.length > 0) {
        setRejectionKeywordsText(rejectionKeywords.join(", "));
      }
    }, []);

    // Загружаем текущие настройки при монтировании компонента
    useEffect(() => {
      async function loadSettings() {
        try {
          setLoading(true);
          const response = await fetch('/api/bot-settings', {
            method: 'GET'
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.settings) {
              setInitialMessage(data.settings.initialMessage || initialMessage);
              setInternetAdsQuestion(data.settings.internetAdsQuestion || internetAdsQuestion);
              setOfferMessage(data.settings.offerMessage || offerMessage);
              setMessageDelay(data.settings.messageDelay || messageDelay);
              setAdsQuestionDelay(data.settings.adsQuestionDelay || adsQuestionDelay);
              
              if (data.settings.rejectionKeywords && Array.isArray(data.settings.rejectionKeywords)) {
                setRejectionKeywords(data.settings.rejectionKeywords);
                setRejectionKeywordsText(data.settings.rejectionKeywords.join(", "));
              }
            }
          }
        } catch (error) {
          console.error('Ошибка при загрузке настроек:', error);
        } finally {
          setLoading(false);
        }
      }
      
      loadSettings();
    }, []);
    
    // Обработка изменения текстового поля с ключевыми словами
    const handleRejectionKeywordsChange = (e) => {
      const text = e.target.value;
      setRejectionKeywordsText(text);
      
      // Преобразуем текст в массив, удаляя лишние пробелы
      const keywordsArray = text.split(',')
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0);
        
      setRejectionKeywords(keywordsArray);
    };

    // Сохранение настроек
    const saveSettings = async () => {
      try {
        const res = await fetch('/api/bot-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            initialMessage,
            internetAdsQuestion,
            offerMessage,
            messageDelay,
            adsQuestionDelay,
            rejectionKeywords
          })
        });
        
        const data = await res.json();
        
        if (data.success) {
          alert('Настройки сохранены');
        } else {
          alert('Ошибка при сохранении настроек: ' + data.error);
        }
      } catch (error) {
        console.error('Ошибка при сохранении настроек:', error);
        alert('Ошибка при сохранении настроек');
      }
    };
  
    if (loading) {
      return <div className="text-center py-4">Загрузка настроек...</div>;
    }
    
    return (
      <div>
        <h3 className="font-medium mb-5 text-xl">Настройки сообщений бота</h3>
        
        <div className="mb-5">
          <label className="block text-gray-700 mb-2" htmlFor="initialMessage">
            Первое сообщение
          </label>
          <textarea
            id="initialMessage"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            value={initialMessage}
            onChange={(e) => setInitialMessage(e.target.value)}
            rows="3"
          ></textarea>
          <p className="text-sm text-gray-500 mt-1">Используйте {"{service}"} для вставки услуги</p>
        </div>
        
        <div className="mb-5">
          <label className="block text-gray-700 mb-2" htmlFor="internetAdsQuestion">
            Вопрос о рекламе в интернете
          </label>
          <textarea
            id="internetAdsQuestion"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            value={internetAdsQuestion}
            onChange={(e) => setInternetAdsQuestion(e.target.value)}
            rows="3"
          ></textarea>
        </div>
        
        <div className="mb-5">
          <label className="block text-gray-700 mb-2" htmlFor="rejectionKeywords">
            Ключевые слова отказа от рекламы (через запятую)
          </label>
          <textarea
            id="rejectionKeywords"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            value={rejectionKeywordsText}
            onChange={handleRejectionKeywordsChange}
            rows="2"
            placeholder="нет, не интересно, не надо, не хочу, не нужно, дорого, отказываюсь, против"
          ></textarea>
          <p className="text-sm text-gray-500 mt-1">Если ответ содержит одно из этих слов, предложение не будет отправлено</p>
        </div>
        
        <div className="mb-5">
          <label className="block text-gray-700 mb-2" htmlFor="offerMessage">
            Сообщение с предложением
          </label>
          <textarea
            id="offerMessage"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            value={offerMessage}
            onChange={(e) => setOfferMessage(e.target.value)}
            rows="8"
          ></textarea>
          <p className="text-sm text-gray-500 mt-1">Это сообщение будет отправлено, если клиент заинтересован в рекламе</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="messageDelay">
              Задержка между сообщениями (секунды)
            </label>
            <input
              type="number"
              id="messageDelay"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              value={messageDelay}
              onChange={(e) => setMessageDelay(parseInt(e.target.value) || 15)}
              min="5"
              max="60"
            />
            <p className="text-sm text-gray-500 mt-1">Минимальное время между отправкой сообщений</p>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="adsQuestionDelay">
              Задержка перед вопросом о рекламе (секунды)
            </label>
            <input
              type="number"
              id="adsQuestionDelay"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              value={adsQuestionDelay}
              onChange={(e) => setAdsQuestionDelay(parseInt(e.target.value) || 15)}
              min="5"
              max="300"
            />
            <p className="text-sm text-gray-500 mt-1">Время ожидания перед отправкой вопроса о рекламе</p>
          </div>
        </div>
        
        <div className="pt-4">
          <button
            onClick={saveSettings}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring transition"
          >
            Сохранить настройки
          </button>
        </div>
      </div>
    );
}