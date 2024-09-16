'use client';

import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatViewModel } from "@/viewmodels/ChatViewModel";
import { MessageComponent } from '@/components/MessageComponent';
import { InputArea } from '@/components/InputArea';
import { CodePreview } from '@/components/CodePreview'; // Add this import
import { Button } from "@/components/ui/button"; // Add this import

export default function ChatPage() {
  const { messages, inputMessage, setInputMessage, sendMessage, isStreaming } = useChatViewModel();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [previewFiles, setPreviewFiles] = useState<Record<string, { content: string }> | null>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAutoScroll(entry.isIntersecting);
        if (entry.isIntersecting) {
          setUserScrolled(false);
        }
      },
      { root: scrollAreaRef.current, threshold: 0.1 }
    );

    if (bottomRef.current) {
      observer.observe(bottomRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (autoScroll && !userScrolled && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming, autoScroll, userScrolled]);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollAreaViewportRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollAreaViewportRef.current;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20;
        setShowScrollToBottom(!isAtBottom);
        setAutoScroll(isAtBottom);
        if (!isAtBottom) {
          setUserScrolled(true);
        }
      }
    };

    const viewport = scrollAreaViewportRef.current;
    if (viewport) {
      viewport.addEventListener('scroll', checkScroll);
    }

    return () => {
      if (viewport) {
        viewport.removeEventListener('scroll', checkScroll);
      }
    };
  }, []);

  const handleCodeSelect = (code: string) => {
    setPreviewFiles({ 'index.js': { content: code } });
  };

  const handlePreviewCode = (files: Record<string, { content: string }>) => {
    if (Object.keys(files).length > 0) {
      setPreviewFiles(files);
      console.log('Preview files set:', files);
    } else {
      console.log('No files to preview');
    }
  };

  const handleClosePreview = () => {
    setPreviewFiles(null);
  };


  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
      setUserScrolled(false);
      setShowScrollToBottom(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-green-400 font-mono">
      <header className="p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold">MystraIntellect</h1>
      </header>
      <div className="flex-grow flex relative">
        <ScrollArea className="flex-1 p-4 scroll-area">
          <div ref={scrollAreaViewportRef}>
            {messages.map((message) => (
              <MessageComponent 
                key={message.id} 
                message={message} 
                onCodeSelect={handleCodeSelect}
                onPreviewCode={handlePreviewCode}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
        {showScrollToBottom && (
          <Button
            className="absolute bottom-4 right-4 bg-green-700 hover:bg-green-600 text-white"
            onClick={scrollToBottom}
          >
            Go to Bottom
          </Button>
        )}
        {previewFiles && (
          <CodePreview 
            files={previewFiles}
            onClose={handleClosePreview}
          />
        )}
      </div>
      <InputArea
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        sendMessage={sendMessage}
      />
    </div>
  )
}
