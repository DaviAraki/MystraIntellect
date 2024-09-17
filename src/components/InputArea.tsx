import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InputAreaProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  sendMessage: () => void;
  isDisabled?: boolean;
}

export function InputArea({ inputMessage, setInputMessage, sendMessage, isDisabled }: InputAreaProps) {
  return (
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
          disabled={isDisabled}
        />
        <Button 
          onClick={sendMessage}
          className="bg-green-600 hover:bg-green-700 text-black"
          disabled={isDisabled}
        >
          Send
        </Button>
      </div>
    </div>
  );
}
