import Link from "next/link";

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-green-400 font-mono">
      <Link
        href="/chat"
        className="rounded-full border border-solid border-green-400 transition-colors flex items-center justify-center hover:bg-green-900 text-lg h-16 px-8"
      >
        Enter MystraIntellect Chat
      </Link>
    </div>
  );
}
