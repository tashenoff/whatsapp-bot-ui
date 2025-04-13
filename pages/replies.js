// Файл: pages/replies.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';

export default function RepliesPage() {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReply, setSelectedReply] = useState(null);

  // Загрузка ответов при инициализации
  useEffect(() => {
    const fetchReplies = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/replies');
        const data = await res.json();
        
        if (data.success) {
          setReplies(data.replies);
        } else {
          console.error('Ошибка при загрузке ответов:', data.error);
        }
      } catch (error) {
        console.error('Ошибка при загрузке ответов:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReplies();
    
    // Обновляем список ответов каждые 30 секунд
    const interval = setInterval(fetchReplies, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Форматирование даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Обработчик клика по контакту
  const handleReplyClick = (reply) => {
    setSelectedReply(reply);
  };

  return (
    <Layout>
      <Head>
        <title>Ответы контактов - WhatsApp Bot Manager</title>
        <meta name="description" content="Список ответов от контактов" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-red-500">Ответы контактов</h1>
          <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
            Назад к панели управления
          </Link>
        </div>
        
        {loading ? (
          <div className="text-center py-10">
            <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-gray-600">Загрузка ответов...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Левая колонка - Список контактов с ответами */}
            <div className="md:col-span-1 bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4">Контакты ({replies.length})</h2>
              
              {replies.length === 0 ? (
                <p className="text-gray-500 text-center py-6">Пока нет ответов от контактов</p>
              ) : (
                <div className="divide-y">
                  {replies.map((reply) => (
                    <div 
                      key={reply.phoneNumber} 
                      className={`py-3 px-2 cursor-pointer hover:bg-gray-50 transition ${selectedReply?.phoneNumber === reply.phoneNumber ? 'bg-blue-50' : ''}`}
                      onClick={() => handleReplyClick(reply)}
                    >
                      <div className="font-medium">
                        {reply.contactName || 'Неизвестно'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {reply.phoneNumber}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Последний ответ: {formatDate(reply.replies[reply.replies.length - 1].timestamp)}
                      </div>
                      <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-1 inline-block">
                        {reply.replies.length} сообщ.
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Правая колонка - Детали переписки */}
            <div className="md:col-span-2 bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4">
                {selectedReply ? 
                  `${selectedReply.contactName || 'Неизвестно'} (${selectedReply.phoneNumber})` : 
                  'Выберите контакт для просмотра переписки'}
              </h2>
              
              {!selectedReply ? (
                <div className="text-center py-20 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p>Выберите контакт из списка слева, чтобы просмотреть сообщения</p>
                </div>
              ) : (
                <div>
                  {selectedReply.serviceType && (
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <div className="text-sm font-medium text-gray-600">Услуга:</div>
                      <div>{selectedReply.serviceType}</div>
                    </div>
                  )}
                  
                  <div className="space-y-4 mt-6">
                    {selectedReply.replies.map((reply, index) => (
                      <div key={index} className="bg-blue-50 p-3 rounded">
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-medium">{formatDate(reply.timestamp)}</div>
                          {reply.type && reply.type !== 'chat' && (
                            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {reply.type === 'ptt' ? 'Голосовое' : 
                               reply.type === 'audio' ? 'Аудио' :
                               reply.type === 'image' ? 'Изображение' :
                               reply.type === 'video' ? 'Видео' :
                               reply.type === 'document' ? 'Документ' :
                               reply.type === 'location' ? 'Локация' :
                               reply.type === 'contact' ? 'Контакт' : reply.type}
                            </div>
                          )}
                        </div>
                        <div className="mt-1 whitespace-pre-wrap">{reply.message}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t">
                    <a
                      href={`https://wa.me/${selectedReply.phoneNumber.replace(/^8/, '7')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                      Открыть чат в WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}