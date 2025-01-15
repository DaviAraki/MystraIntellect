import { CONFIG } from '@/config/constants';

export class ChatService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessage(message: string, model: string, threadId?: string) {
    const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.CHAT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ threadId, message, model }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return this.handleStreamResponse(response);
  }

  private async handleStreamResponse(response: Response) {
    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const { value, done } = await reader.read();
    
    if (done) {
      throw new Error('Stream ended unexpectedly');
    }

    return this.processStreamResponse(reader, value);
  }

  private async processStreamResponse(reader: ReadableStreamDefaultReader<Uint8Array>, initialValue: Uint8Array) {
    const decoder = new TextDecoder();
    const firstChunk = decoder.decode(initialValue);
    const [threadIdJson, ...restOfChunk] = firstChunk.split('\n');
    const { threadId: newThreadId } = JSON.parse(threadIdJson);

    return {
      threadId: newThreadId,
      stream: this.createResponseStream(reader, restOfChunk)
    };
  }

  private createResponseStream(reader: ReadableStreamDefaultReader<Uint8Array>, initialChunk: string[]) {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(initialChunk.join('\n')));
      },
      async pull(controller) {
        const { value, done } = await reader.read();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      },
    });
  }

  static async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.VALIDATE_KEY}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
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