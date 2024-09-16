import { ChatService } from '@/services/ChatServices';
import { Message } from '@/types/message';
import { useState, useCallback } from 'react';

export function useChatViewModel() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Welcome to MystraIntellect !", sender: "bot" },
  ]);
  const [inputMessage, setInputMessage] = useState('');
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

  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
    };

    addMessage(userMessage);
    setInputMessage('');

    try {
      const reader = await ChatService.sendMessage(messages.concat(userMessage));
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
  }, [inputMessage, messages, addMessage, updateLastBotMessage]);

  return { messages, inputMessage, setInputMessage, sendMessage, isStreaming };
}
