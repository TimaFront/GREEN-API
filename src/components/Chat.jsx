import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'

function Chat({ credentials }) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [message, setMessage] = useState('') 
  const [messages, setMessages] = useState([]) 
  const [chatStarted, setChatStarted] = useState(false)
  const [sending, setSending] = useState(false) 
  const [error, setError] = useState(null) 
  const [connectionStatus, setConnectionStatus] = useState('connecting')  
  
  const intervalRef = useRef(null)
  const messagesEndRef = useRef(null)

  const formatPhoneNumber = (number) => {  //Удаляю все нецифровые символы и заменяю 8 на 7
    const cleaned = number.replace(/\D/g, '');
    return cleaned.startsWith('8') ? '7' + cleaned.slice(1) : cleaned; 
  }

  const startChat = () => { // Проверяю номер на корректность 
    const formattedNumber = formatPhoneNumber(phoneNumber);
    
    if (formattedNumber.length < 10) {
      setError('Введите корректный номер телефона');
      return;
    }
    
    setPhoneNumber(formattedNumber);
    setChatStarted(true);
    setError(null);
  }

  const sendMessage = async () => { // Отправляю сообщение
    if (!message.trim()) return;
    
    setSending(true);
    setError(null);
    
    try {
      const response = await axios.post(
          `https://api.green-api.com/waInstance${credentials.idInstance}/SendMessage/${credentials.apiTokenInstance}`,
          {
            chatId: `${phoneNumber}@c.us`,
            message: message,
          }
      );
      
      if (response.data?.idMessage) {
        setMessages(prevMessages => [...prevMessages, { text: message, sent: true }]);
        setMessage('');
      } else {
        throw new Error('Не удалось отправить сообщение. Проверьте номер телефона и подключение получателя к WhatsApp');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(
        'Ошибка при отправке: ' + 
        (error.response?.data?.message || error.message) + 
        '\nУбедитесь, что:\n' +
        '1. Номер введен правильно\n' +
        '2. У получателя установлен WhatsApp\n' +
        '3. Ваш аккаунт GREEN-API активен'
      );
    } finally {
      setSending(false);
    }
  }

  const receiveMessages = async () => { // Получаю сообщение
    try {
      const response = await axios.get(
          `https://api.green-api.com/waInstance${credentials.idInstance}/ReceiveNotification/${credentials.apiTokenInstance}`
      );
      
      setConnectionStatus('connected');
      
      if (response.data?.receiptId) {
        if (response.data.body.typeWebhook === 'incomingMessageReceived') {
          const message = response.data.body.messageData?.textMessageData?.textMessage;
          const sender = response.data.body.senderData?.sender?.split('@')[0];
          
          if (message && sender === phoneNumber) {
            setMessages(prevMessages => [...prevMessages, { text: message, sent: false }]);
          }
        }
        
        await axios.delete(
            `https://api.green-api.com/waInstance${credentials.idInstance}/DeleteNotification/${credentials.apiTokenInstance}/${response.data.receiptId}`
        );
      }
    } catch (error) {
      console.error('Ошибка при получении сообщений:', error);
      setConnectionStatus('error');
    }
  }

  useEffect(() => { // Получаю сообщение каждые 3 секунды
    if (chatStarted && !intervalRef.current) {
      receiveMessages();
      intervalRef.current = setInterval(receiveMessages, 3000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [chatStarted, credentials, phoneNumber]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const resetChat = () => {
    setChatStarted(false);
    setMessages([]);
    setPhoneNumber('');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setConnectionStatus('connecting');
    setError(null);
  };

  return ( 
      <div className="chat">
        {!chatStarted ? (
            <div className="start-chat">
              <input
                  type="text"
                  placeholder="Введите номер телефона получателя (например: 79001234567)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <div className="phone-format-hint">
                Формат: 7XXXXXXXXXX (без +)
              </div>
              <button onClick={startChat}>Начать чат</button>
              {error && <div className="error-message">{error}</div>}
            </div>
        ) : (
            <>
              <div className="chat-header">
                <div className="header-left">
                    <button onClick={resetChat} className="back-button">
                        ←
                    </button>
                    <span className="chat-title">Чат с {phoneNumber}</span>
                </div>
                <span className={`connection-status ${connectionStatus}`}>
                    {connectionStatus === 'connecting' && 'Подключение...'}
                    {connectionStatus === 'connected' && 'Подключено'}
                    {connectionStatus === 'error' && 'Ошибка подключения'}
                </span>
              </div>
              <div className="messages">
                  {error && <div className="error-message">{error}</div>}
                  {messages.map((msg, index) => (
                      <div key={index} className={`message ${msg.sent ? 'sent' : 'received'}`}>
                          {msg.text}
                      </div>
                  ))}
                  <div ref={messagesEndRef} />
              </div>
              <div className="input-area">
                  <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Введите сообщение"
                      disabled={sending}
                  />
                  <button 
                      onClick={sendMessage} 
                      disabled={sending || !message.trim()}
                  >
                      {sending ? '...' : '➤'}
                  </button>
              </div>
            </>
        )}
      </div>
  );
}

export default Chat;