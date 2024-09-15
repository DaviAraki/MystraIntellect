import React, { useState } from 'react';
import { User, Bot, CopyIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message } from '@/types/message';

const CodeBlock = ({inline, className, children, ...props}: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  
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
          onClick={() => {
            navigator.clipboard.writeText(String(children));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? (
            <>
              <CheckIcon className="h-4 w-4 mr-1" /> Copied!
            </>
          ) : (
            <>
              <CopyIcon className="h-4 w-4 mr-1" /> Copy
            </>
          )}
        </Button>
      </div>
    )
  }
  return <code className={className} {...props}>{children}</code>
}

export function MessageComponent({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  
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
              code: CodeBlock
            }}
          >
            {message.text}
          </ReactMarkdown>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 text-xs"
          onClick={() => {
            navigator.clipboard.writeText(message.text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? (
            <>
              <CheckIcon className="h-4 w-4 mr-1" /> Copied!
            </>
          ) : (
            <>
              <CopyIcon className="h-4 w-4 mr-1" /> Copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
