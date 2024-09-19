import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const assistantId = 'asst_t5SQBj41UAk05cyYtudfE9j0'

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('Authorization')?.split(' ')[1];
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 401 });
    }

    const { threadId, message } = await req.json();

    if (!assistantId || !message) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey });

    try {
      // Create a new thread if threadId is not provided
      const thread = threadId 
        ? await openai.beta.threads.retrieve(threadId)
        : await openai.beta.threads.create();

      // Add the user's message to the thread
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: message
      });

      // Run the assistant
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId
      });

      // Poll for completion
      let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      while (runStatus.status !== 'completed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      }

      // Retrieve the assistant's messages
      const messages = await openai.beta.threads.messages.list(thread.id);

      // Get the last message from the assistant
      const lastMessage = messages.data
        .filter(msg => msg.role === 'assistant')
        .pop();

      if (!lastMessage || !lastMessage.content || lastMessage.content.length === 0) {
        throw new Error('No response from assistant');
      }

      const messageContent = lastMessage.content[0];
      
      if (messageContent.type !== 'text') {
        throw new Error('Unexpected response type from assistant');
      }

      return NextResponse.json({ 
        message: messageContent.text.value,
        threadId: thread.id
      });

    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      // ... (error handling remains similar)
    }
  } catch (error) {
    // ... (error handling remains similar)
  }
}

export async function GET(req: Request) {
  try {
    const apiKey = req.headers.get('Authorization')?.split(' ')[1];
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 401 });
    }

    const openai = new OpenAI({ apiKey });

    try {
      // Make a simple API call to check if the key is valid
      await openai.models.list();
      return NextResponse.json({ valid: true });
    } catch (openaiError) {
      console.error('OpenAI API error during validation:', openaiError);

      if (openaiError instanceof OpenAI.OpenAIError) {
      if (openaiError.cause) {
        return NextResponse.json({ valid: false, error: `Invalid API key: ${openaiError.cause}` }, { status: 401 });
      } else if (openaiError.message) {
        return NextResponse.json({ valid: false, error: `API key validation failed: ${openaiError.message}` }, { status: 401 });
      } else {
        return NextResponse.json({ valid: false, error: 'An unknown error occurred while validating the API key' }, { status: 500 });
      }
    }
  }
  } catch (error) {
    console.error('Server error during API key validation:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal Server Error: Unknown error' }, { status: 500 });
  }
}
