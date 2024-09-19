import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('Authorization')?.split(' ')[1];
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 401 });
    }

    const { systemInstruction, messages, model } = await req.json();

    if (!systemInstruction || !messages || !model) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey });

    const enhancedSystemInstruction = `
      ${systemInstruction}
      You are an expert software developer AI assistant. Your primary focus is on helping with coding, software architecture, best practices, and problem-solving in various programming languages and frameworks. 
      - Provide concise, accurate, and efficient solutions.
      - Explain complex concepts clearly and suggest improvements when appropriate.
      - Be aware of modern development practices, design patterns, and performance considerations.
      - If asked about a specific technology, framework, or language, tailor your responses accordingly.
      - When providing code solutions, specify the file names for each code block using the format: [filename: code_content] inside the markdown text on code block .
      - If multiple files are needed, provide them in separate code blocks with their respective filenames.
    `;

    try {
      const stream = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: enhancedSystemInstruction },
          ...messages
        ],
        stream: true,
        temperature: 0.4,
        max_tokens: 1000,
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            controller.enqueue(encoder.encode(content));
          }
          controller.close();
        },
      });

      return new NextResponse(readable, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);

      if (openaiError instanceof OpenAI.OpenAIError) {

      if (openaiError.cause) {
        return NextResponse.json({ error: `OpenAI API error: ${openaiError.cause}` });
      } else if (openaiError.message) {
        return NextResponse.json({ error: `OpenAI API error: ${openaiError.message}` }, { status: 500 });
      } else {
        return NextResponse.json({ error: 'An unknown error occurred with the OpenAI API' }, { status: 500 });
      }
    }
  }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Server error:', error);
      return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error: Unknown error' }, { status: 500 });
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
