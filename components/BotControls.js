import { useState, useEffect } from 'react';
// Файл: components/BotControls.js
export default function BotControls({ status, onStartBot }) {
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
    const [restarting, setRestarting] = useState(false);
    const [resettingContacts, setResettingContacts] = useState(false);
    
    // Состояние для отслеживания прогресса рассылки
    const [progress, setProgress] = useState({
      total: 0,
      sent: 0,
      error: 0
    });
  
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
    
    // Периодически получаем прогресс рассылки
    useEffect(() => {
      let interval;
      
      if (status === 'running') {
        interval = setInterval(async () => {
          try {
            const response = await fetch('/api/bot-progress');
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.progress) {
                setProgress(data.progress);
              }
            }
          } catch (error) {
            console.error('Ошибка при получении прогресса:', error);
          }
        }, 2000); // Проверяем каждые 2 секунды
      }
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }, [status]);
  
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
    
    // Перезагрузка бота
    const handleRestartBot = async () => {
      try {
        setRestarting(true);
        const res = await fetch('/api/restart-bot', {
          method: 'POST'
        });
        
        const data = await res.json();
        
        if (data.success) {
          alert('Бот успешно перезагружен');
        } else {
          alert('Ошибка при перезагрузке бота: ' + data.error);
        }
      } catch (error) {
        console.error('Ошибка при перезагрузке бота:', error);
        alert('Ошибка при перезагрузке бота');
      } finally {
        setRestarting(false);
      }
    };
    
    // Сброс статуса контактов
    const handleResetContacts = async () => {
      if (window.confirm('Вы уверены, что хотите сбросить статус всех контактов? Это позволит заново отправить сообщения всем контактам.')) {
        try {
          setResettingContacts(true);
          const res = await fetch('/api/reset-contacts', {
            method: 'POST'
          });
          
          const data = await res.json();
          
          if (data.success) {
            alert('Статус всех контактов успешно сброшен');
            // Перезагружаем страницу для обновления списка контактов
            window.location.reload();
          } else {
            alert('Ошибка при сбросе статуса контактов: ' + data.error);
          }
        } catch (error) {
          console.error('Ошибка при сбросе статуса контактов:', error);
          alert('Ошибка при сбросе статуса контактов');
        } finally {
          setResettingContacts(false);
        }
      }
    };
  
    if (loading) {
      return <div className="text-center py-4">Загрузка настроек...</div>;
    }
    
    // Вычисляем прогресс в процентах
    const progressPercent = progress.total > 0 
      ? Math.round((progress.sent / progress.total) * 100) 
      : 0;
  
    return (
      <div>
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <div className="mr-3">Статус бота:</div>
            <div className={`px-3 py-1 rounded text-white 
              ${status === 'running' ? 'bg-green-600' : 
                status === 'starting' ? 'bg-yellow-500' :
                status === 'error' ? 'bg-red-600' : 'bg-gray-600'}`}>
              {status === 'running' ? 'Запущен' : 
               status === 'starting' ? 'Запускается...' :
               status === 'error' ? 'Ошибка' : 'Остановлен'}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={onStartBot}
              disabled={status === 'running' || status === 'starting' || restarting}
              className={`py-2 px-4 rounded text-white 
                ${status === 'running' || status === 'starting' || restarting
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'}`}
            >
              Запустить бота
            </button>
            
            <button
              onClick={handleRestartBot}
              disabled={status === 'starting' || restarting}
              className={`py-2 px-4 rounded text-white 
                ${restarting || status === 'starting' 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {restarting ? 'Перезагрузка...' : 'Перезагрузить бота'}
            </button>
          </div>
          
          <button
            onClick={handleResetContacts}
            disabled={resettingContacts}
            className={`w-full py-2 px-4 rounded text-white mb-4
              ${resettingContacts ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-600'}`}
          >
            {resettingContacts ? 'Сброс...' : 'Сбросить статусы контактов'}
          </button>
          
          {status === 'running' && progress.total > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium mb-1">
                Прогресс рассылки: {progress.sent} из {progress.total} 
                {progress.error > 0 && ` (ошибок: ${progress.error})`}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <div className="text-xs text-right mt-1 text-gray-600">
                {progressPercent}%
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Настройки сообщений</h3>
          
          <div className="mb-3">
            <label className="block text-gray-700 mb-2 text-sm" htmlFor="initialMessage">
              Первое сообщение
            </label>
            <textarea
              id="initialMessage"
              className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-blue-300"
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              rows="3"
            ></textarea>
            <p className="text-xs text-gray-500 mt-1">Используйте {"{service}"} для вставки услуги</p>
          </div>
          
          <div className="mb-3">
            <label className="block text-gray-700 mb-2 text-sm" htmlFor="internetAdsQuestion">
              Вопрос о рекламе в интернете
            </label>
            <textarea
              id="internetAdsQuestion"
              className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-blue-300"
              value={internetAdsQuestion}
              onChange={(e) => setInternetAdsQuestion(e.target.value)}
              rows="3"
            ></textarea>
          </div>
          
          <div className="mb-3">
            <label className="block text-gray-700 mb-2 text-sm" htmlFor="rejectionKeywords">
              Ключевые слова отказа от рекламы (через запятую)
            </label>
            <textarea
              id="rejectionKeywords"
              className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-blue-300"
              value={rejectionKeywordsText}
              onChange={handleRejectionKeywordsChange}
              rows="2"
              placeholder="нет, не интересно, не надо, не хочу, не нужно, дорого, отказываюсь, против"
            ></textarea>
            <p className="text-xs text-gray-500 mt-1">Если ответ содержит одно из этих слов, предложение не будет отправлено</p>
          </div>
          
          <div className="mb-3">
            <label className="block text-gray-700 mb-2 text-sm" htmlFor="offerMessage">
              Сообщение с предложением
            </label>
            <textarea
              id="offerMessage"
              className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-blue-300"
              value={offerMessage}
              onChange={(e) => setOfferMessage(e.target.value)}
              rows="5"
            ></textarea>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 mb-2 text-sm" htmlFor="messageDelay">
                Задержка между сообщениями (секунды)
              </label>
              <input
                type="number"
                id="messageDelay"
                className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-blue-300"
                value={messageDelay}
                onChange={(e) => setMessageDelay(parseInt(e.target.value) || 15)}
                min="5"
                max="60"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2 text-sm" htmlFor="adsQuestionDelay">
                Задержка перед вопросом о рекламе (секунды)
              </label>
              <input
                type="number"
                id="adsQuestionDelay"
                className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-blue-300"
                value={adsQuestionDelay}
                onChange={(e) => setAdsQuestionDelay(parseInt(e.target.value) || 15)}
                min="5"
                max="300"
              />
            </div>
          </div>
          
          <button
            onClick={saveSettings}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring"
          >
            Сохранить настройки
          </button>
        </div>
      </div>
    );
  }