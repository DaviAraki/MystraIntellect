import { useState, useCallback } from 'react';
import { ChatService } from '@/services/ChatServices';
import { useMessages } from './useMessages';
import { Message } from '@/types';

export function useChat(apiKey: string) {
  const { addMessage, updateLastBotMessage, setIsStreaming, ...messageState } = useMessages();
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (inputMessage: string, selectedModel: string) => {
    if (!inputMessage.trim() || !apiKey) return;

    const userMessage: Message = {
      id: messageState.messages.length + 1,
      text: inputMessage,
      sender: 'user',
    };

    addMessage(userMessage);
    setError(null);

    try {
      const chatService = new ChatService(apiKey);
      const { threadId: newThreadId, stream } = await chatService.sendMessage(
        inputMessage,
        selectedModel,
        threadId
      );
      
      setThreadId(newThreadId);
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      const botMessage: Message = {
        id: messageState.messages.length + 2,
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
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsStreaming(false);
    }
  }, [apiKey, messageState.messages.length, threadId, addMessage, updateLastBotMessage, setIsStreaming]);

  return {
    ...messageState,
    sendMessage,
    threadId,
    error
  };
} 