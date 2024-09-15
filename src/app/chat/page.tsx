'use client';

import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatViewModel } from "@/viewmodels/ChatViewModel";
import { MessageComponent } from '@/components/MessageComponent';
import { InputArea } from '@/components/InputArea';
import { CodePreview } from '@/components/CodePreview'; // Add this import

export default function ChatPage() {
  const { messages, inputMessage, setInputMessage, sendMessage, isStreaming } = useChatViewModel();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [previewCode, setPreviewCode] = useState('');
  const [previewLanguage, setPreviewLanguage] = useState('html');

  useEffect(() => {
    if (autoScroll || isStreaming) {
      scrollToBottom();
    }
  }, [messages, isStreaming, autoScroll]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 10;
    setAutoScroll(isScrolledToBottom);
  };

  return (
    <div className="flex flex-col h-screen bg-black text-green-400 font-mono">
      <header className="p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold">Araki Chat</h1>
      </header>
      <div className="flex-grow flex">
        <ScrollArea 
          className="flex-1 p-4 scroll-area" 
          ref={scrollAreaRef}
          onScroll={handleScroll}
        >
          {messages.map((message) => (
            <MessageComponent 
              key={message.id} 
              message={message} 
              onCodeSelect={(code, language) => {
                setPreviewCode(code);
                setPreviewLanguage(language);
              }}
            />
          ))}
        </ScrollArea>
        <CodePreview code={previewCode} language={previewLanguage} />
      </div>
      <InputArea
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        sendMessage={sendMessage}
      />
    </div>
  )
}
