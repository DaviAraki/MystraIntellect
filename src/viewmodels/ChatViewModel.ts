import { ChatService } from '@/services/ChatServices';
import { Message } from '@/types/message';
import { useState, useCallback, useEffect } from 'react';

export function useChatViewModel() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Welcome to MystraIntellect!", sender: "bot" },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini');
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);

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
    setError(null);

    try {
      const { threadId: newThreadId, stream } = await ChatService.sendMessage(inputMessage, apiKey, selectedModel, threadId);
      setThreadId(newThreadId);  // Update the threadId state
      const reader = stream.getReader();
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
      setIsStreaming(false);
      if (error instanceof Error) {
        setError(`Error: ${error.message}`);
      } else {
        setError('An unknown error occurred');
      }
    }
  }, [inputMessage, messages, addMessage, updateLastBotMessage, apiKey, selectedModel, threadId]);

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
    isStreaming, 
    apiKey, 
    setApiKey, 
    isApiKeySet, 
    setIsApiKeySet, 
    validateApiKey,
    clearApiKey, 
    selectedModel, 
    setSelectedModel,
    error,
    setError,
    threadId,
    setThreadId
  };
}

