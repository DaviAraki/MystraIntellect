import React, { useState, useEffect } from 'react'
import { User, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Message } from '@/types/message'
import { CodeBlock } from './CodeBlock'

interface MessageComponentProps {
  message: Message
}

export function MessageComponent({ message }: MessageComponentProps) {
  const [isFormatted, setIsFormatted] = useState(false)

  useEffect(() => {
    if (message.sender === 'bot' && !isFormatted) {
      setIsFormatted(true)
    }
  }, [message, isFormatted])

  return (
    <div className='mb-4 flex items-start max-w-[1200px] mx-auto w-full'>
      {message.sender === 'user' ? (
        <User className='mr-2 h-6 w-6 text-green-400 flex-shrink-0' />
      ) : (
        <Bot className='mr-2 h-6 w-6 text-green-400 flex-shrink-0' />
      )}
      <div className='bg-gray-900 rounded p-4 flex-1 overflow-hidden'>
        {message.sender === 'user' ? (
          <p className='whitespace-pre-wrap break-words'>{message.text}</p>
        ) : (
          <ReactMarkdown
            className='prose prose-invert max-w-none whitespace-pre-wrap break-words'
            components={{
              code: ({ className, children, ...props }) =>
                CodeBlock({ className, children, ...props }),
            }}
            remarkPlugins={[]}
          >
            {message.text}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}
