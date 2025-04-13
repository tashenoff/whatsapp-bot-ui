// Файл: components/ContactList.js
import { useState } from 'react';

export default function ContactList({ contacts, loading, onSelectContact, onUpdateStatus }) {
  const [filter, setFilter] = useState('all'); // 'all', 'sent', 'pending', 'error'
  
  if (loading) {
    return <div className="flex justify-center py-8">Загрузка контактов...</div>;
  }
  
  if (!contacts || contacts.length === 0) {
    return <div className="text-center py-8">Нет доступных контактов</div>;
  }

  // Фильтрация контактов
  const filteredContacts = contacts.filter(contact => {
    if (filter === 'all') return true;
    if (filter === 'sent') return contact.messageStatus === 'sent';
    if (filter === 'pending') return !contact.messageStatus;
    if (filter === 'error') return contact.messageStatus === 'error';
    return true;
  });

  return (
    <div>
      <div className="mb-4 flex space-x-2">
        <button 
          className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setFilter('all')}
        >
          Все
        </button>
        <button 
          className={`px-3 py-1 rounded ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setFilter('pending')}
        >
          Ожидают
        </button>
        <button 
          className={`px-3 py-1 rounded ${filter === 'sent' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setFilter('sent')}
        >
          Отправлены
        </button>
        <button 
          className={`px-3 py-1 rounded ${filter === 'error' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setFilter('error')}
        >
          Ошибки
        </button>
      </div>
      
      <div className="overflow-y-auto max-h-96">
        {filteredContacts.map((contact, index) => (
          <div 
            key={index}
            className="border-b py-2 cursor-pointer hover:bg-gray-50"
            onClick={() => onSelectContact(contact)}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{contact.number}</p>
                <p className="text-sm text-gray-600 truncate">{contact.link}</p>
              </div>
              <div>
                {contact.messageStatus === 'sent' && (
                  <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                    Отправлено
                  </span>
                )}
                {contact.messageStatus === 'error' && (
                  <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                    Ошибка
                  </span>
                )}
                {!contact.messageStatus && (
                  <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                    Ожидает
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
