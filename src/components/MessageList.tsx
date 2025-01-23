import React, { useRef, useEffect } from 'react'
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
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change or during streaming
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({
        behavior: isStreaming ? 'auto' : 'smooth',
      })
    }
  }, [messages, isStreaming])

  // Additional scroll to bottom during streaming
  useEffect(() => {
    if (isStreaming && bottomRef.current) {
      const scrollInterval = setInterval(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'auto' })
      }, 100)

      return () => clearInterval(scrollInterval)
    }
  }, [isStreaming])

  return (
    <ScrollArea className='flex-grow overflow-y-auto' ref={scrollAreaRef}>
      <div className='p-4 space-y-4'>
        {messages.map((message) => (
          <MessageComponent key={message.id} message={message} />
        ))}
        {isStreaming && (
          <div className='flex justify-center'>
            <LoadingSpinner size='sm' />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
