'use client';

import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatViewModel } from "@/viewmodels/ChatViewModel";
import { MessageComponent } from '@/components/MessageComponent';
import { InputArea } from '@/components/InputArea';

export default function ChatPage() {
  const { messages, inputMessage, setInputMessage, sendMessage, isStreaming } = useChatViewModel();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll || isStreaming) {
      scrollToBottom();
    }
  }, [messages, isStreaming, autoScroll]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  const handleScroll = () => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
      const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 10;
      setAutoScroll(isScrolledToBottom);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-green-400 font-mono">
      <header className="p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold">HackerChat</h1>
      </header>
      <ScrollArea 
        className="flex-grow p-4 scroll-area" 
        ref={scrollAreaRef}
        onScroll={handleScroll}
      >
        {messages.map((message) => (
          <MessageComponent key={message.id} message={message} />
        ))}
      </ScrollArea>
      <InputArea
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        sendMessage={sendMessage}
      />
    </div>
  )
}
