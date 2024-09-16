import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const { systemInstruction, messages } = await req.json();

    const enhancedSystemInstruction = `
      ${systemInstruction}
      You are an expert software developer AI assistant. Your primary focus is on helping with coding, software architecture, best practices, and problem-solving in various programming languages and frameworks. 
      - Provide concise, accurate, and efficient solutions.
      - Explain complex concepts clearly and suggest improvements when appropriate.
      - The code generated will be used to create a CodeSandbox, so be aware of the sandbox environment, keep the style in the same file as the code unless specified otherwise.
      - Be aware of modern development practices, design patterns, and performance considerations.
      - If asked about a specific technology, framework, or language, tailor your responses accordingly.
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
