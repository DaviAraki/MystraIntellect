import { ChatService } from '@/services/ChatServices';
import { Message } from '@/types/message';
import { useState, useCallback, useEffect } from 'react';

export function useChatViewModel() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Welcome to MystraIntellect!", sender: "bot" },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [assistantId, setAssistantId] = useState<string>('asst_t5SQBj41UAk05cyYtudfE9j0');
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

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

  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !apiKey) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
    };

    addMessage(userMessage);
    setInputMessage('');
    setError(null);
    setIsLoading(true);

    try {
      const { message: botResponse, threadId: newThreadId } = await ChatService.sendMessage(
        inputMessage,
        apiKey,
        assistantId,
        threadId
      );

      if (!threadId) {
        setThreadId(newThreadId);
      }

      const botMessage: Message = {
        id: messages.length + 2,
        text: botResponse,
        sender: 'bot',
      };

      addMessage(botMessage);
    } catch (error) {
      if (error instanceof Error) {
        setError(`Error: ${error.message}`);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, messages, addMessage, apiKey, assistantId, threadId]);

  const validateApiKey = useCallback(async (key: string) => {
    try {
      const isValid = await ChatService.validateApiKey(key);
      if (isValid) {
        localStorage.setItem('mystraIntellectApiKey', key);
        setIsApiKeySet(true);
        setError(null);
      } else {
        setError('Invalid API key');
      }
      return isValid;
    } catch (error) {
      if (error instanceof Error) {
        setError(`Error validating API key: ${error.message}`);
      } else {
        setError('An unknown error occurred while validating the API key');
      }
      return false;
    }
  }, []);

  const clearApiKey = useCallback(() => {
    localStorage.removeItem('mystraIntellectApiKey');
    setApiKey('');
    setIsApiKeySet(false);
    setError(null);
  }, []);

  return { 
    messages, 
    inputMessage, 
    setInputMessage, 
    sendMessage, 
    isLoading, 
    apiKey, 
    setApiKey, 
    isApiKeySet, 
    setIsApiKeySet, 
    validateApiKey,
    clearApiKey, 
    assistantId, 
    setAssistantId,
    error,
    setError
  };
}

