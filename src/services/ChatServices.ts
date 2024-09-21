export class ChatService {
  static async sendMessage(
    message: string,
    apiKey: string,
    selectedModel: string,
    threadId?: string
  ): Promise<{ threadId: string; stream: ReadableStream<Uint8Array> }> {
    console.log('threadId', threadId);
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          threadId,
          message,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Read the first chunk to get the threadId
      const { value, done } = await reader.read();
      if (done) {
        throw new Error('Stream ended unexpectedly');
      }

      const firstChunk = decoder.decode(value);
      const [threadIdJson, ...restOfChunk] = firstChunk.split('\n');
      const { threadId: newThreadId } = JSON.parse(threadIdJson);

      // Create a new ReadableStream with the remaining content
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(restOfChunk.join('\n')));
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

      return { threadId: newThreadId, stream };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to send message: ${error.message}`);
      }
      throw new Error('An unknown error occurred while sending the message');
    }
  }

  static async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('/api/openai/validate-key', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
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