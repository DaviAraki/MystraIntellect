import React, { useState } from 'react';
import { CopyIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const CodeBlock = ({inline, className, children, ...props}: any) => {
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