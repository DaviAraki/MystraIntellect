'use client';

import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatViewModel } from "@/viewmodels/ChatViewModel";
import { MessageComponent } from '@/components/MessageComponent';
import { InputArea } from '@/components/InputArea';
import { LivePreview } from '@/components/LivePreview'; // Add this import
import { Button } from "@/components/ui/button"; // Add this import
import { Input } from "@/components/ui/input"; // Add this import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ChatPage() {
  const { 
    messages, 
    inputMessage, 
    setInputMessage, 
    sendMessage, 
    isStreaming, 
    apiKey, 
    setApiKey, 
    isApiKeySet, 
    validateApiKey,
    clearApiKey,
    selectedModel,
    setSelectedModel,
    error // Add this line
  } = useChatViewModel();
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
      <header className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h1 className="text-2xl font-bold">MystraIntellect</h1>
        {isApiKeySet && (
          <Button 
            onClick={clearApiKey}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Clear API Key
          </Button>
        )}
      </header>
      {!isApiKeySet ? (
        <div className="flex-grow flex items-center justify-center">
          <div className="w-full max-w-md p-4">
            <p className="mb-2 text-sm text-gray-400">
              Your API key is stored locally in your browser and is never sent to our servers. 
              We use it only to communicate directly with OpenAI on your behalf.
            </p>
            <Input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your OpenAI API key"
              type="password"
              className="mb-4"
            />
            <Button 
              onClick={async () => {
                await validateApiKey(apiKey);
              }} 
              disabled={!apiKey.trim()}
            >
              Set API Key
            </Button>
            {error && <p className="text-red-500 mt-2">{error}</p>} {/* Add this line */}
          </div>
        </div>
      ) : (
        <div className="flex-grow flex relative">
          <ScrollArea className="flex-1 p-4 scroll-area">
            <div ref={scrollAreaViewportRef}>
              {messages.map((message) => (
                <MessageComponent 
                  key={message.id} 
                  message={message} 
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
            <LivePreview 
              files={previewFiles}
              onClose={handleClosePreview}
            />
          )}
          {error && <p className="text-red-500 absolute bottom-4 left-4">{error}</p>} {/* Add this line */}
        </div>
      )}
      {isApiKeySet && (
        <div className="p-4 border-t border-gray-800">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o-mini">GPT-4-mini</SelectItem>
              <SelectItem value="gpt-4o">GPT-4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <InputArea
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        sendMessage={sendMessage}
        isDisabled={isStreaming}
      />
    </div>
  )
}
