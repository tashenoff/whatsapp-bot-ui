// Файл: components/SendMessageForm.js
// Заменен на компонент статистики

import { useState, useEffect } from 'react';

export default function BotStatistics() {
  const [statistics, setStatistics] = useState({
    totalMessages: 0,
    totalReplies: 0,
    adsRejected: 0,
    adsAccepted: 0,
    byNiche: {}
  });
  
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [niche, setNiche] = useState('');
  const [niches, setNiches] = useState([]);

  // Загрузка статистики при монтировании компонента
  useEffect(() => {
    fetchStatistics();
    
    // Обновляем статистику каждые 30 секунд
    const interval = setInterval(fetchStatistics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // Получаем данные о статистике
      const response = await fetch('/api/statistics');
      const data = await response.json();
      
      if (data.success) {
        setStatistics(data.statistics);
        
        // Получаем уникальные ниши
        const uniqueNiches = Object.keys(data.statistics.byNiche).filter(Boolean);
        setNiches(uniqueNiches);
      }
    } catch (error) {
      console.error('Ошибка при загрузке статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetStatistics = async () => {
    // Запрос подтверждения перед сбросом
    if (!window.confirm('Вы уверены, что хотите сбросить всю статистику? Это действие нельзя отменить.')) {
      return;
    }
    
    try {
      setResetting(true);
      
      // Отправляем запрос на сброс статистики
      const response = await fetch('/api/reset-statistics', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Статистика успешно сброшена');
        // Обновляем отображение статистики
        await fetchStatistics();
      } else {
        alert('Ошибка при сбросе статистики: ' + data.error);
      }
    } catch (error) {
      console.error('Ошибка при сбросе статистики:', error);
      alert('Ошибка при сбросе статистики');
    } finally {
      setResetting(false);
    }
  };

  const filterByNiche = (niche) => {
    setNiche(niche);
  };

  if (loading && !resetting) {
    return <div className="text-center py-4 dark:text-white">Загрузка статистики...</div>;
  }

  return (
    <div className="dark:text-gray-200">
      <h3 className="font-medium mb-4">Статистика</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-300">Отправлено сообщений</div>
          <div className="text-2xl font-bold">{statistics.totalMessages}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-300">Получено ответов</div>
          <div className="text-2xl font-bold">{statistics.totalReplies}</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-300">Отказались от рекламы</div>
          <div className="text-2xl font-bold">{statistics.adsRejected}</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-300">Приняли предложение</div>
          <div className="text-2xl font-bold">{statistics.adsAccepted}</div>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Фильтр по нише</label>
        <select 
          className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={niche}
          onChange={(e) => filterByNiche(e.target.value)}
        >
          <option value="">Все ниши</option>
          {niches.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      
      <div className="mt-6">
        <h4 className="font-medium mb-3">Статистика по нишам</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-sm leading-normal">
                <th className="py-3 px-4 text-left">Ниша</th>
                <th className="py-3 px-4 text-center">Всего</th>
                <th className="py-3 px-4 text-center">Согласились</th>
                <th className="py-3 px-4 text-center">Отказались</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 dark:text-gray-300 text-sm">
              {Object.entries(statistics.byNiche)
                .filter(([key]) => !niche || key === niche)
                .map(([nicheName, nicheStats]) => (
                <tr key={nicheName} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-4 text-left">{nicheName}</td>
                  <td className="py-3 px-4 text-center">{nicheStats.total}</td>
                  <td className="py-3 px-4 text-center">{nicheStats.accepted}</td>
                  <td className="py-3 px-4 text-center">{nicheStats.rejected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-4 flex justify-between">
        <button 
          onClick={resetStatistics}
          disabled={resetting}
          className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-800 disabled:opacity-50 text-sm transition"
        >
          {resetting ? 'Сброс...' : 'Сбросить статистику'}
        </button>
        
        <button 
          onClick={fetchStatistics}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 text-sm transition"
        >
          {loading ? 'Загрузка...' : 'Обновить данные'}
        </button>
      </div>
    </div>
  );
}