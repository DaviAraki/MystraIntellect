import React from 'react';
import { User, Bot } from "lucide-react";
import ReactMarkdown from 'react-markdown';

import { Message } from '@/types/message';
import { CodeBlock } from './CodeBlock';
import { Button } from './ui/button';

interface MessageComponentProps {
  message: Message;
  onPreviewCode: (files: Record<string, { content: string }>) => void;
}

export function MessageComponent({ message, onPreviewCode }: MessageComponentProps) {
  const handlePreviewCode = () => {
    const files: Record<string, { content: string }> = {};
    
    const codeBlockRegex = /```(\w+)\n([\s\S]+?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(message.text)) !== null) {
      const [, language, content] = match;
      
      // Skip bash commands
      if (language.toLowerCase() === 'bash' || language.toLowerCase() === 'shell') {
        continue;
      }

      // Check for filename in a comment at the start of the code block
      const fileNameMatch = content.match(/\/\/\s*\[filename:\s*(.+?)\]|\*\s*\[filename:\s*(.+?)\]/);
      const fileName = fileNameMatch ? (fileNameMatch[1] || fileNameMatch[2]).trim() : `file.${language}`;

      // Remove the filename comment from the content
      const contentWithoutFilename = content.replace(/\/\/\s*\[filename:.+?\]|\*\s*\[filename:.+?\]/, '').trim();

      files[fileName] = { content: contentWithoutFilename };
    }


    if (Object.keys(files).length > 0) {
      onPreviewCode(files);
    } else {
      console.log('No files extracted');
    }
  };

  const hasCode = /```(\w+)\n([\s\S]+?)```/g.test(message.text);

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
                onClick={handlePreviewCode}
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
