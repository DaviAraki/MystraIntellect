# MystraIntellect - AI-Powered Developer Assistant

MystraIntellect is an AI-powered developer assistant built with Next.js and OpenAI's GPT model. It provides a hacker-themed chat interface where users can ask coding questions and receive expert advice.

## Features

- Real-time AI-powered chat interface
- Code syntax highlighting
- Code preview functionality
- Markdown support for bot responses
- Responsive design

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- OpenAI API
- ShadcnUI components

## Getting Started

1. Clone the repository:

2. Install dependencies:

3. Set up environment variables:

Create a `.env.local` file in the root directory and add your OpenAI API key:

4. Run the development server:

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app`: Contains the main application pages and API routes
- `src/components`: React components used throughout the application
- `src/lib`: Utility functions and configurations
- `src/services`: Service layer for API interactions
- `src/types`: TypeScript type definitions
- `src/viewmodels`: View models for managing component state and logic

## Key Components

- Chat interface: `src/app/chat/page.tsx`
- Message component: `src/components/MessageComponent.tsx`
- Input area: `src/components/InputArea.tsx`
- OpenAI integration: `src/app/api/openai/route.ts`

## Customization

You can customize the AI's behavior by modifying the system instruction in the `ChatService.sendMessage` method:

## To-Do List

- [ ] Add a "Clear Chat" button to the chat interface
- [ ] Add Chat History to the Chat Interface
- [ ] Add a "Settings" button to the chat interface
- [ ] Improve Preview Code Functionality
