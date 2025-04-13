import { getBotClient } from '../../utils/bot';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Метод не поддерживается' });
  }
  
  const { phoneNumber, message } = req.body;
  
  if (!phoneNumber || !message) {
    return res.status(400).json({ success: false, error: 'Требуется номер телефона и сообщение' });
  }
  
  try {
    const client = await getBotClient();
    
    const formattedNumber = `${phoneNumber.replace(/\D/g, '')}@c.us`;
    console.log(`Отправка сообщения на ${formattedNumber}: ${message}`);
    
    await client.sendText(formattedNumber, message);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}