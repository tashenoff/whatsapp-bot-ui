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
  // PUT - обновление контакта или статуса
  else if (req.method === 'PUT') {
    try {
      const { phoneNumber, status, editContact } = req.body;
      
      // Режим обновления статуса
      if (phoneNumber && status && !editContact) {
        const contacts = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
        
        const updatedContacts = contacts.map(contact => {
          if (contact.number === phoneNumber) {
            return { ...contact, messageStatus: status };
          }
          return contact;
        });
        
        fs.writeFileSync(jsonFilePath, JSON.stringify(updatedContacts, null, 2));
        
        return res.status(200).json({ success: true });
      }
      
      // Режим редактирования контакта
      if (editContact) {
        const { oldNumber, newNumber, newLink, newLinkHref } = editContact;
        
        if (!oldNumber || !newNumber || !newLink) {
          return res.status(400).json({ 
            success: false, 
            error: 'Для редактирования требуются старый номер, новый номер и описание' 
          });
        }
        
        const contacts = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
        
        // Проверка на существование нового номера (если он отличается от старого)
        if (oldNumber !== newNumber) {
          const numberExists = contacts.some(contact => 
            contact.number === newNumber && contact.number !== oldNumber
          );
          
          if (numberExists) {
            return res.status(400).json({ 
              success: false, 
              error: 'Контакт с таким номером уже существует' 
            });
          }
        }
        
        // Обновление контакта
        const updatedContacts = contacts.map(contact => {
          if (contact.number === oldNumber) {
            return { 
              ...contact, 
              number: newNumber,
              link: newLink,
              "link-href": newLinkHref || contact["link-href"] || ""
            };
          }
          return contact;
        });
        
        fs.writeFileSync(jsonFilePath, JSON.stringify(updatedContacts, null, 2));
        
        return res.status(200).json({ success: true });
      }
      
      return res.status(400).json({ 
        success: false, 
        error: 'Неверные параметры для обновления' 
      });
    } catch (error) {
      console.error('Ошибка при обновлении контакта:', error);
      res.status(500).json({ success: false, error: 'Не удалось обновить контакт' });
    }
  } 
  // POST - добавление нового контакта
  else if (req.method === 'POST') {
    try {
      const { number, link, linkHref } = req.body;
      
      if (!number || !link) {
        return res.status(400).json({ success: false, error: 'Требуются номер телефона и описание' });
      }
      
      const contacts = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
      
      // Проверка наличия контакта с таким номером
      const contactExists = contacts.some(contact => contact.number === number);
      if (contactExists) {
        return res.status(400).json({ success: false, error: 'Контакт с таким номером уже существует' });
      }
      
      // Создание нового контакта
      const newContact = {
        "web-scraper-order": Date.now().toString(),
        "web-scraper-start-url": "",
        "link": link,
        "link-href": linkHref || "",
        "desc": "",
        "number": number,
        "messageStatus": ""
      };
      
      const updatedContacts = [...contacts, newContact];
      
      fs.writeFileSync(jsonFilePath, JSON.stringify(updatedContacts, null, 2));
      
      res.status(201).json({ success: true, contact: newContact });
    } catch (error) {
      console.error('Ошибка при добавлении контакта:', error);
      res.status(500).json({ success: false, error: 'Не удалось добавить контакт' });
    }
  }
  // DELETE - удаление контакта
  else if (req.method === 'DELETE') {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ success: false, error: 'Требуется номер телефона' });
      }
      
      const contacts = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
      
      const updatedContacts = contacts.filter(contact => contact.number !== phoneNumber);
      
      // Проверка, был ли контакт удален
      if (updatedContacts.length === contacts.length) {
        return res.status(404).json({ success: false, error: 'Контакт не найден' });
      }
      
      fs.writeFileSync(jsonFilePath, JSON.stringify(updatedContacts, null, 2));
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Ошибка при удалении контакта:', error);
      res.status(500).json({ success: false, error: 'Не удалось удалить контакт' });
    }
  } else {
    res.status(405).json({ success: false, error: 'Метод не поддерживается' });
  }
}