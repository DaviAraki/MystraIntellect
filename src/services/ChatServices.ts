import { Message } from "@/types/message";

export class ChatService {
  static async sendMessage(messages: Message[]): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: "You are an expert software developer AI assistant in a hacker-themed chat application. Focus on providing accurate, efficient, and helpful coding advice. Format your responses using markdown.",
        messages: messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        })),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from AI');
    }

    return response.body!.getReader();
  }
}
