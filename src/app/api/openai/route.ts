import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('Authorization')?.split(' ')[1];
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 401 });
    }

    const { systemInstruction, messages } = await req.json();

    const openai = new OpenAI({ apiKey });

    const enhancedSystemInstruction = `
      ${systemInstruction}
      You are an expert software developer AI assistant. Your primary focus is on helping with coding, software architecture, best practices, and problem-solving in various programming languages and frameworks. 
      - Provide concise, accurate, and efficient solutions.
      - Explain complex concepts clearly and suggest improvements when appropriate.
      - Be aware of modern development practices, design patterns, and performance considerations.
      - If asked about a specific technology, framework, or language, tailor your responses accordingly.
      - When providing code solutions, specify the file names for each code block using the format: [filename: code_content] inside the markdown text.
      - If multiple files are needed, provide them in separate code blocks with their respective filenames.
    `;

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: enhancedSystemInstruction },
        ...messages
      ],
      stream: true,
      temperature: 0.7, // Adjust for a balance between creativity and precision
      max_tokens: 1000, // Increase token limit for more detailed responses
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
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const apiKey = req.headers.get('Authorization')?.split(' ')[1];
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 401 });
    }

    const openai = new OpenAI({ apiKey });

    // Make a simple API call to check if the key is valid
    await openai.models.list();

    return NextResponse.json({ valid: true });
  } catch (error) {
    if (error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response && 'status' in error.response) {
      return NextResponse.json({ valid: false, error: 'Invalid API key' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
