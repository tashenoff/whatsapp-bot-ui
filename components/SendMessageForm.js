// Файл: components/SendMessageForm.js
import { useState, useEffect } from 'react';

export default function SendMessageForm({ selectedContact, onSendMessage }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Обновляем номер телефона при выборе контакта
  useEffect(() => {
    if (selectedContact) {
      setPhoneNumber(selectedContact.number);
      setMessage(`Здравствуйте, вы занимаетесь "${selectedContact.link}"?`);
    }
  }, [selectedContact]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!phoneNumber || !message) {
      alert('Пожалуйста, заполните все поля');
      return;
    }
    
    setSending(true);
    
    try {
      const success = await onSendMessage(phoneNumber, message);
      
      if (success) {
        // Если отправка успешна, очищаем форму
        if (!selectedContact) {
          setPhoneNumber('');
          setMessage('');
        }
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-gray-700 mb-2" htmlFor="phoneNumber">
          Номер телефона
        </label>
        <input
          type="text"
          id="phoneNumber"
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="7XXXXXXXXXX"
          disabled={sending}
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2" htmlFor="message">
          Сообщение
        </label>
        <textarea
          id="message"
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows="5"
          placeholder="Введите сообщение..."
          disabled={sending}
        ></textarea>
      </div>
      
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring"
        disabled={sending}
      >
        {sending ? 'Отправка...' : 'Отправить сообщение'}
      </button>
    </form>
  );
}