'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useChatViewModel } from '@/viewmodels/ChatViewModel'
import { CONFIG, ModelType } from '@/config/constants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MessageList } from '@/components/MessageList'

export default function ChatPage() {
  const {
    messages,
    isStreaming,
    handleSendMessage,
    inputMessage,
    setInputMessage,
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
    canUseSelectedModel,
  } = useChatViewModel()

  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [activeProvider, setActiveProvider] = useState<'deepseek' | 'openai'>(
    'deepseek'
  )

  const handleProviderChange = (value: string) => {
    const provider = value as 'deepseek' | 'openai'
    setActiveProvider(provider)
    // Set default model for the selected provider
    if (provider === 'deepseek') {
      setSelectedModel(CONFIG.MODELS.DEEPSEEK_CHAT)
    } else {
      setSelectedModel(CONFIG.MODELS.OPENAI_GPT4O_MINI)
    }
  }

  const handleModelChange = (value: string) => {
    setSelectedModel(value as ModelType)
  }

  const handleKeySubmit = async () => {
    if (await validateAndSetApiKey(apiKeyInput, activeProvider)) {
      setApiKeyInput('')
    }
  }

  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canUseSelectedModel()) {
      return
    }
    await handleSendMessage()
  }

  return (
    <div className='flex h-screen bg-gray-950'>
      {/* Sidebar */}
      <div className='w-64 bg-gray-900 p-4 flex flex-col'>
        <Button
          onClick={createNewChat}
          className='mb-4 bg-green-600 hover:bg-green-700'
        >
          New Chat
        </Button>

        {/* Chat List */}
        <div className='flex-1 overflow-y-auto'>
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`mb-2 p-2 rounded cursor-pointer ${
                chat.id === activeChatId ? 'bg-gray-700' : 'hover:bg-gray-800'
              }`}
            >
              {editingChatId === chat.id ? (
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
                  }}
                  autoFocus
                />
              ) : (
                <div className='flex items-center justify-between'>
                  <span
                    onClick={() => switchChat(chat.id)}
                    className='flex-1 truncate'
                  >
                    {chat.name}
                  </span>
                  <div className='flex space-x-2'>
                    <button
                      onClick={() => {
                        setEditingChatId(chat.id)
                        setEditingName(chat.name)
                      }}
                      className='text-gray-400 hover:text-white'
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => deleteChat(chat.id)}
                      className='text-gray-400 hover:text-red-500'
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* API Key Input */}
        <div className='mt-4'>
          <Select onValueChange={handleProviderChange} value={activeProvider}>
            <SelectTrigger>
              <SelectValue placeholder='Select Provider' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='deepseek'>Deepseek</SelectItem>
              <SelectItem value='openai'>OpenAI</SelectItem>
            </SelectContent>
          </Select>

          <div className='mt-2'>
            <Input
              type='password'
              placeholder={`${
                activeProvider.charAt(0).toUpperCase() + activeProvider.slice(1)
              } API Key`}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className='mb-2'
            />
            <div className='flex space-x-2'>
              <Button
                onClick={handleKeySubmit}
                className='flex-1 bg-green-600 hover:bg-green-700'
                disabled={!apiKeyInput.trim()}
              >
                Set Key
              </Button>
              {isApiKeySet[activeProvider] && (
                <Button
                  onClick={() => clearApiKey(activeProvider)}
                  variant='destructive'
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Model Selection */}
        <div className='mt-4'>
          <Select onValueChange={handleModelChange} value={selectedModel}>
            <SelectTrigger>
              <SelectValue placeholder='Select Model' />
            </SelectTrigger>
            <SelectContent>
              {activeProvider === 'deepseek' ? (
                <>
                  <SelectItem value={CONFIG.MODELS.DEEPSEEK_CHAT}>
                    Deepseek Chat
                  </SelectItem>
                  <SelectItem value={CONFIG.MODELS.DEEPSEEK_REASONER}>
                    Deepseek Reasoner
                  </SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value={CONFIG.MODELS.OPENAI_GPT4O_MINI}>
                    GPT-4o Mini
                  </SelectItem>
                  <SelectItem value={CONFIG.MODELS.OPENAI_GPT4O}>
                    GPT-4
                  </SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className='flex-1 flex flex-col'>
        {/* Messages */}
        <div className='flex-1 overflow-hidden'>
          <MessageList messages={messages} isStreaming={isStreaming} />
        </div>

        {/* Error Display */}
        {error && (
          <div className='p-4 bg-red-900 text-white'>Error: {error}</div>
        )}

        {/* Input Area */}
        <form onSubmit={handleMessageSubmit} className='p-4 bg-gray-900'>
          <div className='flex space-x-4'>
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder='Type your message...'
              className='flex-1'
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleMessageSubmit(e)
                }
              }}
            />
            <Button
              type='submit'
              className='bg-green-600 hover:bg-green-700'
              disabled={
                !inputMessage.trim() || isStreaming || !canUseSelectedModel()
              }
            >
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
