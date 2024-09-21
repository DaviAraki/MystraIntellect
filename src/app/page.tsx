import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-green-400 font-mono">
      <h1 className="text-4xl mb-4">MystraIntellect: AI-Powered Developer Assistant</h1>
      <p className="text-xl mb-8">Get expert coding help and software development advice instantly</p>
      <Link
        href="/chat"
        className="rounded-full border border-solid border-green-400 transition-colors flex items-center justify-center hover:bg-green-900 text-lg h-16 px-8"
      >
        Start Coding with AI
      </Link>
    </div>
  );
}
