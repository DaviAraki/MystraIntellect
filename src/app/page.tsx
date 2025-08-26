"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("openai");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-green-400 font-mono">
      <h1 className="text-4xl mb-4">
        MystraIntellect: AI-Powered Developer Assistant
      </h1>
      <p className="text-xl mb-8">
        Get expert coding help and software development advice instantly
      </p>
      <Link
        href="/chat"
        className="rounded-full border border-solid border-green-400 transition-colors flex items-center justify-center hover:bg-green-900 text-lg h-16 px-8 mb-8"
      >
        Start Coding with AI
      </Link>
      <div className="text-center max-w-2xl">
        <h2 className="text-2xl mb-6">How to Get Your API Keys</h2>

        {/* Tab Navigation */}
        <div className="flex border-b border-green-400 mb-6">
          <button
            onClick={() => setActiveTab("openai")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "openai"
                ? "text-green-300 border-b-2 border-green-300"
                : "text-green-500 hover:text-green-300"
            }`}
          >
            OpenAI
          </button>
          <button
            onClick={() => setActiveTab("deepseek")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "deepseek"
                ? "text-green-300 border-b-2 border-green-300"
                : "text-green-500 hover:text-green-300"
            }`}
          >
            DeepSeek
          </button>
          <button
            onClick={() => setActiveTab("qwen")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "qwen"
                ? "text-green-300 border-b-2 border-green-300"
                : "text-green-500 hover:text-green-300"
            }`}
          >
            Qwen
          </button>
        </div>

        {/* Tab Content */}
        <div className="text-left">
          {activeTab === "openai" && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-300">
                OpenAI
              </h3>
              <ol className="list-decimal pl-6 space-y-1">
                <li>
                  Visit{" "}
                  <a
                    href="https://platform.openai.com/signup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-green-300"
                  >
                    OpenAI&apos;s website
                  </a>{" "}
                  and sign up
                </li>
                <li>Go to the API section in your account</li>
                <li>Generate a new API key</li>
                <li>Copy and securely store your API key</li>
              </ol>
            </div>
          )}

          {activeTab === "deepseek" && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-300">
                DeepSeek
              </h3>
              <ol className="list-decimal pl-6 space-y-1">
                <li>
                  Visit{" "}
                  <a
                    href="https://platform.deepseek.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-green-300"
                  >
                    DeepSeek&apos;s platform
                  </a>{" "}
                  and sign up
                </li>
                <li>Navigate to the API section</li>
                <li>Create a new API key</li>
                <li>Copy and securely store your API key</li>
              </ol>
            </div>
          )}

          {activeTab === "qwen" && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-300">
                Qwen
              </h3>
              <ol className="list-decimal pl-6 space-y-1">
                <li>
                  Visit{" "}
                  <a
                    href="https://dashscope.console.aliyun.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-green-300"
                  >
                    Alibaba Cloud DashScope
                  </a>{" "}
                  and sign up
                </li>
                <li>Go to the API Key Management section</li>
                <li>Generate a new API key</li>
                <li>Copy and securely store your API key</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
