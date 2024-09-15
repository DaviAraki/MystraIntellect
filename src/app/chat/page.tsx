'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CopyIcon, User, Bot } from "lucide-react"
import { useChatViewModel } from "@/viewmodels/ChatViewModel"
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function ChatPage() {
  const { messages, inputMessage, setInputMessage, sendMessage, isStreaming } = useChatViewModel();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (autoScroll || isStreaming) {
      scrollToBottom();
    }
  }, [messages, isStreaming, autoScroll]);

  const handleScroll = () => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
      const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 10; // Allow a small buffer
      setAutoScroll(isScrolledToBottom);
    }
  };

  const CodeBlock = ({inline, className, children, ...props}: any) => {
    const match = /language-(\w+)/.exec(className || '')
    const language = match ? match[1] : ''
    
    if (!inline && language) {
      return (
        <div className="relative">
          <SyntaxHighlighter
            style={atomDark}
            language={language}
            PreTag="div"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 text-xs bg-gray-800 hover:bg-gray-700"
            onClick={() => navigator.clipboard.writeText(String(children))}
          >
            <CopyIcon className="h-4 w-4 mr-1" /> Copy
          </Button>
        </div>
      )
    }
    return <code className={className} {...props}>{children}</code>
  }

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
          <div key={message.id} className={`mb-4 flex items-start ${message.sender === 'user' ? 'justify-end' : ''}`}>
            {message.sender === 'user' ? (
              <div className="flex flex-row-reverse items-start">
                <User className="ml-2 h-6 w-6 text-green-400" />
                <div className="bg-gray-900 rounded p-2 max-w-[80%]">
                  <p>{message.text}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() => navigator.clipboard.writeText(message.text)}
                  >
                    <CopyIcon className="h-4 w-4 mr-1" /> Copy
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Bot className="mr-2 h-6 w-6 text-green-400" />
                <div className="bg-gray-900 rounded p-2 max-w-[80%]">
                  <ReactMarkdown 
                    className="prose prose-invert max-w-none"
                    components={{
                      code: CodeBlock
                    }}
                  >
                    {message.text}
                  </ReactMarkdown>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() => navigator.clipboard.writeText(message.text)}
                  >
                    <CopyIcon className="h-4 w-4 mr-1" /> Copy
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </ScrollArea>
      <div className="p-4 border-t border-gray-800">
        <div className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow bg-gray-900 text-green-400 border-gray-700 focus:border-green-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                sendMessage();
              }
            }}
          />
          <Button 
            onClick={sendMessage}
            className="bg-green-600 hover:bg-green-700 text-black"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
