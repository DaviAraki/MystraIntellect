// components/MessageComponent.tsx
import { useState, useEffect } from 'react'
import { User, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Message } from '@/types/message'
import { CodeBlock } from './CodeBlock'

interface MessageComponentProps {
  message: Message
}

const processThinkTags = (content: string) => {
  const parts = content?.split(/(<think>|<\/think>)/).filter(Boolean)
  return parts?.map((part, index) => {
    if (part === '<think>' || part === '</think>') return null
    const isThinkContent = index > 0 && parts[index - 1] === '<think>'

    if (isThinkContent) {
      return (
        <div
          key={index}
          className='my-2 sm:my-4 p-2 sm:p-4 bg-gray-800 border border-green-400/20 rounded-lg'
        >
          <div className='text-xs sm:text-sm text-green-400 mb-1 sm:mb-2 font-semibold'>
            Reasoning Process:
          </div>
          <ReactMarkdown
            className='prose prose-invert prose-sm sm:prose-base max-w-none whitespace-pre-wrap break-words'
            components={{
              code: ({ className, children, ...props }) =>
                CodeBlock({ className, children, ...props }),
            }}
          >
            {part}
          </ReactMarkdown>
        </div>
      )
    }

    return (
      <ReactMarkdown
        key={index}
        className='prose prose-invert prose-sm sm:prose-base max-w-none whitespace-pre-wrap break-words'
        components={{
          code: ({ className, children, ...props }) =>
            CodeBlock({ className, children, ...props }),
        }}
      >
        {part}
      </ReactMarkdown>
    )
  })
}

export function MessageComponent({ message }: MessageComponentProps) {
  const [isFormatted, setIsFormatted] = useState(false)

  useEffect(() => {
    if (message.role === 'assistant' && !isFormatted) {
      setIsFormatted(true)
    }
  }, [message, isFormatted])

  return (
    <div className='mb-4 flex items-start max-w-[1200px] mx-auto w-full px-2 sm:px-4'>
      {message.role === 'user' ? (
        <User className='mr-2 h-5 w-5 sm:h-6 sm:w-6 text-green-400 flex-shrink-0 mt-1' />
      ) : (
        <Bot className='mr-2 h-5 w-5 sm:h-6 sm:w-6 text-green-400 flex-shrink-0 mt-1' />
      )}
      <div className='bg-gray-900 rounded p-2 sm:p-4 flex-1 overflow-hidden'>
        {message.role === 'user' ? (
          <p className='whitespace-pre-wrap break-words text-sm sm:text-base'>
            {message.content}
          </p>
        ) : (
          <div className='text-sm sm:text-base'>
            {processThinkTags(message.content)}
          </div>
        )}
      </div>
    </div>
  )
}
