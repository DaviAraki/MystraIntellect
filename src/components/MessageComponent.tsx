import React from 'react';
import { User, Bot } from "lucide-react";
import ReactMarkdown from 'react-markdown';

import { Message } from '@/types/message';
import { CodeBlock } from './CodeBlock';
import { Button } from './ui/button';
import { useCodePreview } from '@/hooks/useCodePreview';

interface MessageComponentProps {
  message: Message;
  onPreviewCode: (files: Record<string, { content: string }>) => void;
}

export function MessageComponent({ message, onPreviewCode }: MessageComponentProps) {
  const { handlePreviewCode, hasCode } = useCodePreview(message);

  const onPreviewClick = () => {
    const files = handlePreviewCode();
    if (Object.keys(files).length > 0) {
      onPreviewCode(files);
    } else {
      console.log('No files extracted');
    }
  };

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
          <>
            <ReactMarkdown 
              className="prose prose-invert max-w-none"
              components={{
                code: ({  className, children, ...props }) => 
                  CodeBlock({  className, children, ...props })
              }}
            >
              {message.text}
            </ReactMarkdown>
            {hasCode && (
              <Button
                onClick={onPreviewClick}
                className="mt-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white"
              >
                Preview Code
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
