import { Message } from "@/types/message";

export class ChatService {
  static async sendMessage(messages: Message[], apiKey: string, selectedModel: string): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        systemInstruction: "You are an expert software developer AI assistant in a hacker-themed chat application. Focus on providing accurate, efficient, and helpful coding advice. Format your responses using markdown.",
        messages: messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        })),
        model: selectedModel,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from AI');
    }

    return response.body!.getReader();
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
        return false;
      }

      const data = await response.json();
      return data.valid;
    } catch (error) {
      console.error('Error validating API key:', error);
      return false;
    }
  }
}
