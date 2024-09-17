import { ChatService } from '@/services/ChatServices';
import { Message } from '@/types/message';
import { useState, useCallback, useEffect } from 'react';

export function useChatViewModel() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Welcome to MystraIntellect !", sender: "bot" },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);

  // Load API key from localStorage on component mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem('mystraIntellectApiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsApiKeySet(true);
    }
  }, []);

  const addMessage = useCallback((message: Message) => {
    setMessages(prevMessages => [...prevMessages, message]);
  }, []);

  const updateLastBotMessage = useCallback((text: string) => {
    setMessages(prevMessages => 
      prevMessages.map((msg, index) => 
        index === prevMessages.length - 1 ? { ...msg, text: msg.text + text } : msg
      )
    );
  }, []);

  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !apiKey) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
    };

    addMessage(userMessage);
    setInputMessage('');

    try {
      const reader = await ChatService.sendMessage(messages.concat(userMessage), apiKey);
      const decoder = new TextDecoder();

      const botMessage: Message = {
        id: messages.length + 2,
        text: '',
        sender: 'bot',
      };

      addMessage(botMessage);
      setIsStreaming(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        updateLastBotMessage(chunk);
      }

      setIsStreaming(false);
    } catch (error) {
      console.error('Error:', error);
      setIsStreaming(false);
    }
  }, [inputMessage, messages, addMessage, updateLastBotMessage, apiKey]);

  const validateApiKey = useCallback(async (key: string) => {
    const isValid = await ChatService.validateApiKey(key);
    if (isValid) {
      localStorage.setItem('mystraIntellectApiKey', key);
      setIsApiKeySet(true);
    }
    return isValid;
  }, []);

  // Add a function to clear the API key
  const clearApiKey = useCallback(() => {
    localStorage.removeItem('mystraIntellectApiKey');
    setApiKey('');
    setIsApiKeySet(false);
  }, []);

  return { 
    messages, 
    inputMessage, 
    setInputMessage, 
    sendMessage, 
    isStreaming, 
    apiKey, 
    setApiKey, 
    isApiKeySet, 
    setIsApiKeySet, 
    validateApiKey,
    clearApiKey  // Add this to the returned object
  };
}

