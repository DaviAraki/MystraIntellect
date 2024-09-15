import { useState } from 'react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

export function useChatViewModel() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Welcome to HackerChat!", sender: "bot" },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');

    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: "You are an expert software developer AI assistant in a hacker-themed chat application. Focus on providing accurate, efficient, and helpful coding advice. Format your responses using markdown.",
          messages: messages.concat(userMessage).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        const botMessage: Message = {
          id: messages.length + 2,
          text: '',
          sender: 'bot',
        };

        setMessages(prevMessages => [...prevMessages, botMessage]);
        setIsStreaming(true);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === botMessage.id ? { ...msg, text: msg.text + chunk } : msg
            )
          );
        }

        setIsStreaming(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setIsStreaming(false);
    }
  };

  return { messages, inputMessage, setInputMessage, sendMessage, isStreaming };
}
