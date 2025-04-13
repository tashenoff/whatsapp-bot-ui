import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const jsonFilePath = path.join(process.cwd(), 'base.json');
  
  // GET - получение списка контактов
  if (req.method === 'GET') {
    try {
      const contacts = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
      res.status(200).json({ success: true, contacts });
    } catch (error) {
      console.error('Ошибка при чтении контактов:', error);
      res.status(500).json({ success: false, error: 'Не удалось прочитать файл контактов' });
    }
  } 
  // PUT - обновление статуса контакта
  else if (req.method === 'PUT') {
    try {
      const { phoneNumber, status } = req.body;
      
      if (!phoneNumber || !status) {
        return res.status(400).json({ success: false, error: 'Требуется номер телефона и статус' });
      }
      
      const contacts = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
      
      const updatedContacts = contacts.map(contact => {
        if (contact.number === phoneNumber) {
          return { ...contact, messageStatus: status };
        }
        return contact;
      });
      
      fs.writeFileSync(jsonFilePath, JSON.stringify(updatedContacts, null, 2));
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Ошибка при обновлении статуса контакта:', error);
      res.status(500).json({ success: false, error: 'Не удалось обновить статус контакта' });
    }
  } else {
    res.status(405).json({ success: false, error: 'Метод не поддерживается' });
  }
}