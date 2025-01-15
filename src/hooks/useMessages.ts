import { useState, useCallback } from 'react';
import { Message } from '@/types';
import { CONFIG } from '@/config/constants';

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: CONFIG.UI.DEFAULT_BOT_MESSAGE, sender: 'bot' }
  ]);
  const [isStreaming, setIsStreaming] = useState(false);

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

  return {
    messages,
    isStreaming,
    setIsStreaming,
    addMessage,
    updateLastBotMessage
  };
} 