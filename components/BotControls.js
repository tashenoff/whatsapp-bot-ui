import { useState, useEffect } from 'react';
import Link from 'next/link';
// Файл: components/BotControls.js
export default function BotControls({ status, onStartBot, totalContacts = 0 }) {
    const [restarting, setRestarting] = useState(false);
    const [resettingContacts, setResettingContacts] = useState(false);
    const [contactLimit, setContactLimit] = useState(0); // 0 означает "все контакты"
    const [useContactLimit, setUseContactLimit] = useState(false);
    
    // Состояние для отслеживания прогресса рассылки
    const [progress, setProgress] = useState({
      total: 0,
      sent: 0,
      error: 0
    });
    
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
    
    // Обработчик запуска бота с ограничением контактов
    const handleStartBot = () => {
      const options = useContactLimit ? { contactLimit } : {};
      onStartBot(options);
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
    
    // Обработка изменения количества контактов
    const handleContactLimitChange = (e) => {
      const value = parseInt(e.target.value) || 0;
      setContactLimit(value > totalContacts ? totalContacts : value);
    };
    
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
          
          {/* Настройки ограничения контактов */}
          {status !== 'running' && status !== 'starting' && (
            <div className="mb-4 p-3 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="useContactLimit"
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  checked={useContactLimit}
                  onChange={(e) => setUseContactLimit(e.target.checked)}
                />
                <label htmlFor="useContactLimit" className="ml-2 text-sm font-medium">
                  Ограничить количество контактов
                </label>
              </div>
              
              {useContactLimit && (
                <div className="flex items-center">
                  <input
                    type="number"
                    id="contactLimit"
                    className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-blue-300"
                    value={contactLimit}
                    onChange={handleContactLimitChange}
                    min="1"
                    max={totalContacts}
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">из {totalContacts}</span>
                </div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={handleStartBot}
              disabled={status === 'running' || status === 'starting' || restarting}
              className={`py-2 px-4 rounded text-white 
                ${status === 'running' || status === 'starting' || restarting
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'}`}
            >
              {useContactLimit && contactLimit > 0 
                ? `Запустить (${contactLimit} контактов)` 
                : 'Запустить бота'}
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
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Настройки сообщений</h3>
            <Link 
              href="/message-settings" 
              className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition"
            >
              Редактировать сообщения
            </Link>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Настройте шаблоны сообщений, задержки и ключевые слова для рассылки на странице настроек сообщений.
          </p>
        </div>
      </div>
    );
}