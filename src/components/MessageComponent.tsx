import React, { useState } from 'react';
import { User, Bot, CopyIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message } from '@/types/message';

interface MessageComponentProps {
  message: Message;
  onCodeSelect: (code: string, language: string) => void;
}

const CodeBlock = ({inline, className, children, onCodeSelect, ...props}: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  
  if (!inline && language) {
    return (
      <div className="relative overflow-hidden">
        <div className="sticky top-0 z-10 flex justify-end items-center space-x-2 p-2 bg-gray-900 bg-opacity-75 backdrop-blur-sm">
          <span className="text-xs bg-gray-700 px-2 py-1 rounded">
            {language}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs bg-gray-800 hover:bg-gray-700"
            onClick={() => onCodeSelect(String(children), language === 'jsx' ? 'react' : language)}
          >
            Preview Code
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs bg-gray-800 hover:bg-gray-700"
            onClick={() => {
              navigator.clipboard.writeText(String(children));
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? (
              <>
                <CheckIcon className="h-4 w-4 mr-1" /> Copied
              </>
            ) : (
              <>
                <CopyIcon className="h-4 w-4 mr-1" /> Copy
              </>
            )}
          </Button>
        </div>
        <div className="relative z-0">
          <SyntaxHighlighter
            style={atomDark}
            language={language}
            PreTag="div"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      </div>
    )
  }
  return <code className={className} {...props}>{children}</code>
}

export function MessageComponent({ message, onCodeSelect }: MessageComponentProps) {
  return (
    <div className="mb-4 flex items-start">
      {message.sender === 'user' ? (
        <User className="mr-2 h-6 w-6 text-green-400" />
      ) : (
        <Bot className="mr-2 h-6 w-6 text-green-400" />
      )}
      <div className="bg-gray-900 rounded p-2 max-w-[80%]">
        {message.sender === 'user' ? (
          <p>{message.text}</p>
        ) : (
          <ReactMarkdown 
            className="prose prose-invert max-w-none"
            components={{
              code: ({ inline, className, children, ...props }) => 
                CodeBlock({ inline, className, children, onCodeSelect, ...props })
            }}
          >
            {message.text}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
