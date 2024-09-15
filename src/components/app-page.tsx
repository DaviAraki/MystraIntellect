import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CopyIcon, User, Bot } from "lucide-react"
import { useChatViewModel } from "@/viewmodels/ChatViewModel"

export default function ChatApp() {
  const { messages, inputMessage, setInputMessage, sendMessage } = useChatViewModel();

  return (
    <div className="flex flex-col h-screen bg-black text-green-400 font-mono">
      <ScrollArea className="flex-grow p-4">
        {messages.map((message) => (
          <div key={message.id} className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-2 ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.sender === 'user' ? 'bg-green-600' : 'bg-gray-600'}`}>
                {message.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={`p-3 rounded-lg max-w-[80%] ${message.sender === 'user' ? 'bg-gray-800' : 'bg-gray-900'}`}>
                {message.text.split('```').map((part, index) => 
                  index % 2 === 0 ? (
                    <p key={index}>{part}</p>
                  ) : (
                    <div key={index} className="relative">
                      <pre className="bg-gray-800 p-2 rounded mt-2 mb-2 overflow-x-auto">
                        <code>{part}</code>
                      </pre>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600"
                      >
                        <CopyIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                )}
              </div>
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