// components/MessageList.tsx
import { useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageComponent } from './MessageComponent'
import { Message } from '@/types/message'
import { LoadingSpinner } from './ui/LoadingSpinner'

interface MessageListProps {
  messages: Message[]
  isStreaming: boolean
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({
        behavior: isStreaming ? 'auto' : 'smooth',
        block: 'end',
      })
    }
  }, [messages, isStreaming])

  useEffect(() => {
    if (isStreaming && bottomRef.current) {
      const scrollInterval = setInterval(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' })
      }, 100)
      return () => clearInterval(scrollInterval)
    }
  }, [isStreaming])

  return (
    <div className='relative flex-1 h-full overflow-hidden'>
      <ScrollArea className='h-full'>
        <div className='flex flex-col gap-4 p-4 min-h-full'>
          {messages.map((message, index) => (
            <MessageComponent
              key={message.id || `${message.role}-${index}`}
              message={message}
            />
          ))}
          {isStreaming && (
            <div className='flex justify-center'>
              <LoadingSpinner size='sm' />
            </div>
          )}
          <div ref={bottomRef} className='h-px' />
        </div>
      </ScrollArea>
    </div>
  )
}
