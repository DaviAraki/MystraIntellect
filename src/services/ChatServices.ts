import { Message } from "@/types/message";

export class ChatService {
  static async sendMessage(messages: Message[], apiKey: string, selectedModel: string): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          systemInstruction: "You are an expert software developer AI assistant. Your primary focus is on helping with coding, software architecture, best practices, and problem-solving in various programming languages and frameworks.",
          messages: messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          })),
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return response.body!.getReader();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to send message: ${error.message}`);
      }
      throw new Error('An unknown error occurred while sending the message');
    }
  }

  static async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('/api/openai', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.valid;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error validating API key:', error.message);
      } else {
        console.error('An unknown error occurred while validating the API key');
      }
      return false;
    }
  }
}
