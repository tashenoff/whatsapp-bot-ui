// Файл: pages/contacts/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';

export default function ContactsManager() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newContact, setNewContact] = useState({ number: '', link: '', linkHref: '' });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Загрузка контактов при инициализации
  useEffect(() => {
    fetchContacts();
  }, []);

  // Получение списка контактов с сервера
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/contacts');
      const data = await res.json();
      
      if (data.success) {
        setContacts(data.contacts);
        setError(null);
      } else {
        setError(data.error || 'Не удалось загрузить контакты');
      }
    } catch (error) {
      console.error('Ошибка при загрузке контактов:', error);
      setError('Ошибка при загрузке контактов');
    } finally {
      setLoading(false);
    }
  };

  // Обработка изменений в форме
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewContact(prev => ({ ...prev, [name]: value }));
  };

  // Добавление нового контакта
  const handleAddContact = async (e) => {
    e.preventDefault();
    
    // Валидация формы
    if (!newContact.number || !newContact.link) {
      setFormError('Номер телефона и описание обязательны для заполнения');
      return;
    }

    // Проверка формата номера телефона (11 цифр)
    const phoneRegex = /^\d{11}$/;
    if (!phoneRegex.test(newContact.number)) {
      setFormError('Номер телефона должен содержать 11 цифр');
      return;
    }

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newContact),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Очистка формы и отображение сообщения об успехе
        setNewContact({ number: '', link: '', linkHref: '' });
        setFormError('');
        setSuccessMessage('Контакт успешно добавлен');
        
        // Обновление списка контактов
        fetchContacts();
        
        // Скрытие сообщения об успехе через 3 секунды
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setFormError(data.error || 'Не удалось добавить контакт');
      }
    } catch (error) {
      console.error('Ошибка при добавлении контакта:', error);
      setFormError('Ошибка при добавлении контакта');
    }
  };

  // Удаление контакта
  const handleDeleteContact = async (phoneNumber) => {
    if (!confirm('Вы уверены, что хотите удалить этот контакт?')) {
      return;
    }
    
    try {
      const res = await fetch('/api/contacts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Обновление списка контактов
        fetchContacts();
        setSuccessMessage('Контакт успешно удален');
        
        // Скрытие сообщения об успехе через 3 секунды
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setError(data.error || 'Не удалось удалить контакт');
      }
    } catch (error) {
      console.error('Ошибка при удалении контакта:', error);
      setError('Ошибка при удалении контакта');
    }
  };

  return (
    <Layout>
      <Head>
        <title>Управление контактами | WhatsApp Bot Manager</title>
        <meta name="description" content="Управление контактами для WhatsApp бота" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-red-500 dark:text-red-400">Управление контактами</h1>
          <Link href="/" className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 transition">
            Вернуться на главную
          </Link>
        </div>

        {/* Форма добавления контакта */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8 transition-colors duration-200">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Добавить новый контакт</h2>
          
          {formError && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-3 rounded mb-4">
              {formError}
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-3 rounded mb-4">
              {successMessage}
            </div>
          )}
          
          <form onSubmit={handleAddContact} className="space-y-4">
            <div>
              <label htmlFor="number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Номер телефона (11 цифр)
              </label>
              <input
                type="text"
                id="number"
                name="number"
                value={newContact.number}
                onChange={handleInputChange}
                placeholder="77001234567"
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label htmlFor="link" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Описание
              </label>
              <input
                type="text"
                id="link"
                name="link"
                value={newContact.link}
                onChange={handleInputChange}
                placeholder="Описание контакта"
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label htmlFor="linkHref" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ссылка (необязательно)
              </label>
              <input
                type="text"
                id="linkHref"
                name="linkHref"
                value={newContact.linkHref}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-800 transition"
            >
              Добавить
            </button>
          </form>
        </div>
        
        {/* Список контактов */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Список контактов</h2>
          
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="py-8 text-center dark:text-gray-300">
              Загрузка контактов...
            </div>
          ) : contacts.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              Нет доступных контактов
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Номер телефона
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Описание
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Статус
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {contacts.map((contact, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {contact.number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {contact.link}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {contact.messageStatus === 'sent' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            Отправлено
                          </span>
                        )}
                        {contact.messageStatus === 'error' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                            Ошибка
                          </span>
                        )}
                        {!contact.messageStatus && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            Ожидает
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteContact(contact.number)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}