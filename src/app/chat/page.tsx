'use client';

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CopyIcon, User, Bot } from "lucide-react"
import { useChatViewModel } from "@/viewmodels/ChatViewModel"

export default function ChatPage() {
  const { messages, inputMessage, setInputMessage, sendMessage } = useChatViewModel();

  return (
    <div className="flex flex-col h-screen bg-black text-green-400 font-mono">
      <header className="p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold">HackerChat</h1>
      </header>
      <ScrollArea className="flex-grow p-4">
        {messages.map((message) => (
          <div key={message.id} className="mb-4 flex items-start">
            {message.sender === 'user' ? (
              <User className="mr-2 h-6 w-6 text-green-400" />
            ) : (
              <Bot className="mr-2 h-6 w-6 text-green-400" />
            )}
            <div className="bg-gray-900 rounded p-2 max-w-[80%]">
              <p>{message.text}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => navigator.clipboard.writeText(message.text)}
              >
                <CopyIcon className="h-4 w-4 mr-1" /> Copy
              </Button>
            </div>
          </div>
        ))}
      </ScrollArea>
      <div className="p-4 border-t border-gray-800">
        <div className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow bg-gray-900 text-green-400 border-gray-700 focus:border-green-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                sendMessage();
              }
            }}
          />
          <Button 
            onClick={sendMessage}
            className="bg-green-600 hover:bg-green-700 text-black"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
