'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageList } from '@/components/MessageList'
import { useChatViewModel } from '@/viewmodels/ChatViewModel'
import { LivePreview } from '@/components/LivePreview'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CONFIG } from '@/config/constants'

export default function ChatPage() {
  const {
    messages,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    isStreaming,
    isApiKeySet,
    validateAndSetApiKey,
    clearApiKey,
    selectedModel,
    setSelectedModel,
    error,
    chats,
    activeChatId,
    switchChat,
    createNewChat,
    renameChat,
    deleteChat,
  } = useChatViewModel()

  const [previewFiles, setPreviewFiles] = useState<Record<
    string,
    { content: string }
  > | null>(null)

  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [apiKeyInput, setApiKeyInput] = useState('')

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleSendMessage()
  }

  if (!isApiKeySet) {
    return (
      <div className='flex-grow flex items-center justify-center bg-black'>
        <div className='w-full max-w-md p-4'>
          <p className='mb-2 text-sm text-gray-400'>
            Your API key is stored locally in your browser and is never sent to
            our servers.
          </p>
          <Input
            value={apiKeyInput}
            onChange={(e) => {
              setApiKeyInput(e.target.value)
              validateAndSetApiKey(e.target.value)
            }}
            placeholder='Enter your OpenAI API key'
            type='password'
            className='mb-4'
          />
          {error && <p className='text-red-500 mt-2'>{error}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-screen bg-black text-green-400 font-mono'>
      {/* Chat List Sidebar */}
      <div className='w-64 border-r border-gray-800 flex flex-col'>
        <div className='p-4 border-b border-gray-800'>
          <Button onClick={createNewChat} className='w-full'>
            New Chat
          </Button>
        </div>
        <div className='flex-1 overflow-y-auto'>
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center justify-between p-2 hover:bg-gray-800 ${
                chat.id === activeChatId ? 'bg-gray-800' : ''
              }`}
            >
              {chat.id === editingChatId ? (
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => {
                    renameChat(chat.id, editingName)
                    setEditingChatId(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      renameChat(chat.id, editingName)
                      setEditingChatId(null)
                    }
                    if (e.key === 'Escape') {
                      setEditingChatId(null)
                    }
                  }}
                  autoFocus
                  className='flex-1 mr-2'
                />
              ) : (
                <button
                  onClick={() => switchChat(chat.id)}
                  className='flex-1 text-left truncate'
                  onDoubleClick={() => {
                    setEditingChatId(chat.id)
                    setEditingName(chat.name)
                  }}
                >
                  {chat.name}
                </button>
              )}
              <Button
                onClick={() => deleteChat(chat.id)}
                className='px-2 py-1 bg-red-600 hover:bg-red-700'
                size='sm'
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area with left margin to account for fixed sidebar */}
      <div className='flex-1 flex flex-col'>
        <header className='p-4 border-b border-gray-800 flex justify-between items-center'>
          <div className='flex items-center gap-4'>
            <h1 className='text-2xl font-bold'>MystraIntellect</h1>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Select model' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CONFIG.MODELS.GPT4_MINI}>
                  GPT-4 Mini
                </SelectItem>
                <SelectItem value={CONFIG.MODELS.GPT4}>GPT-4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={clearApiKey}
            className='bg-red-600 hover:bg-red-700 text-white'
          >
            Clear API Key
          </Button>
        </header>

        <div className='flex-grow flex'>
          <div
            className={`flex-grow flex flex-col ${
              previewFiles ? 'w-1/2' : 'w-full'
            }`}
          >
            <ErrorBoundary>
              <MessageList
                messages={messages}
                isStreaming={isStreaming}
                onPreviewCode={setPreviewFiles}
              />
              <form
                onSubmit={handleSend}
                className='p-4 border-t border-gray-800'
              >
                <div className='flex gap-2'>
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder='Type your message...'
                    disabled={isStreaming}
                    className='flex-grow'
                  />
                  <Button
                    type='submit'
                    disabled={isStreaming || !inputMessage.trim()}
                  >
                    Send
                  </Button>
                </div>
                {error && <p className='text-red-500 mt-2 text-sm'>{error}</p>}
              </form>
            </ErrorBoundary>
          </div>

          {previewFiles && (
            <LivePreview
              files={previewFiles}
              onClose={() => setPreviewFiles(null)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
