// Файл: pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import ContactList from '../components/ContactList';
import BotStatistics from '../components/SendMessageForm'; // Компонент переименован, но файл оставлен тем же
import BotControls from '../components/BotControls';

export default function Home() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [botStatus, setBotStatus] = useState('stopped');
  const [selectedContact, setSelectedContact] = useState(null);

  // Загрузка контактов при инициализации
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await fetch('/api/contacts');
        const data = await res.json();
        setContacts(data.contacts);
      } catch (error) {
        console.error('Ошибка при загрузке контактов:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);
  
  // Проверка статуса бота
  useEffect(() => {
    // Периодически проверяем статус бота
    const checkBotStatus = async () => {
      try {
        const res = await fetch('/api/bot-status');
        const data = await res.json();
        
        if (data.success) {
          setBotStatus(data.status);
        }
      } catch (error) {
        console.error('Ошибка при проверке статуса бота:', error);
      }
    };
    
    // Проверяем статус сразу при загрузке
    checkBotStatus();
    
    // Затем проверяем статус каждые 5 секунд
    const statusInterval = setInterval(checkBotStatus, 5000);
    
    // Очищаем интервал при размонтировании компонента
    return () => clearInterval(statusInterval);
  }, []);

  // Функция запуска бота
  const startBot = async (options = {}) => {
    try {
      setBotStatus('starting');
      const res = await fetch('/api/start-bot', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      const data = await res.json();
      
      if (data.success) {
        setBotStatus('running');
      } else {
        setBotStatus('error');
        alert('Ошибка при запуске бота: ' + data.error);
      }
    } catch (error) {
      console.error('Ошибка при запуске бота:', error);
      setBotStatus('error');
    }
  };

  // Функция обновления статуса контакта
  const updateContactStatus = async (phoneNumber, status) => {
    try {
      const res = await fetch('/api/contacts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, status })
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Обновляем статус контакта в списке
        setContacts(contacts.map(contact => 
          contact.number === phoneNumber 
            ? { ...contact, messageStatus: status } 
            : contact
        ));
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Ошибка при обновлении статуса контакта:', error);
      return false;
    }
  };

  return (
    <Layout>
      <Head>
        <title>WhatsApp Bot Manager</title>
        <meta name="description" content="Интерфейс управления WhatsApp ботом" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-red-500 dark:text-red-400">WhatsApp Bot Manager</h1>
          <div className="flex space-x-2">
            <Link href="/contacts" className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 transition">
              Управление контактами
            </Link>
            <Link href="/replies" className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 transition">
              Просмотр ответов
            </Link>
            <Link href="/message-settings" className="px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded hover:bg-indigo-700 dark:hover:bg-indigo-800 transition">
              Настройки сообщений
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Левая колонка - Список контактов */}
          <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-colors duration-200">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Контакты</h2>
            <ContactList 
              contacts={contacts} 
              loading={loading} 
              onSelectContact={setSelectedContact}
              onUpdateStatus={updateContactStatus}
            />
          </div>
          
          {/* Средняя колонка - Статистика */}
          <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-colors duration-200">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Статистика</h2>
            <BotStatistics />
          </div>
          
          {/* Правая колонка - Управление ботом */}
          <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-colors duration-200">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Управление ботом</h2>
            <BotControls 
              status={botStatus}
              onStartBot={startBot}
              totalContacts={contacts.length}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}