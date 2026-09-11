"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  ExternalLink,
  Loader2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

interface SourceItem {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  category: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  sources?: SourceItem[];
  timestamp: Date;
  isError?: boolean;
}

const QUICK_PROMPTS = [
  "What is the latest RoDTEP rate for textiles?",
  "Any DGFT notifications on Basmati rice export?",
  "Recent customs tariff exemptions or revisions?",
  "Are there updates on India-UAE CEPA concessions?",
];

export function AskSyncAIChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText !== undefined ? queryText : input).trim();
    if (!textToSend || isLoading) return;

    if (textToSend.length < 3) {
      setErrorBanner("Please enter a question with at least 3 characters.");
      return;
    }
    if (textToSend.length > 300) {
      setErrorBanner("Question cannot exceed 300 characters.");
      return;
    }

    setErrorBanner(null);
    setInput("");

    const userMessageId = `user_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/trade-updates/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: textToSend }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg =
          data?.error?.message ||
          (res.status === 429
            ? "Too many questions submitted. Please wait a moment before trying again."
            : "Unable to complete search. Please try again.");

        setMessages((prev) => [
          ...prev,
          {
            id: `bot_err_${Date.now()}`,
            sender: "assistant",
            text: errorMsg,
            timestamp: new Date(),
            isError: true,
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: "assistant",
          text: data.answer || "No response received.",
          sources: data.sources || [],
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error("Ask Sync AI request failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: "assistant",
          text: "Network or server connection issue. Please check your connection and retry.",
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setErrorBanner(null);
  };

  return (
    <div className="w-full space-y-4">
      {/* Ask Input Card */}
      <div className="relative p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-border shadow-md focus-within:border-ocean-deep/60 focus-within:ring-2 focus-within:ring-ocean-deep/15 transition-all">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="pl-3 text-ocean-deep dark:text-ocean-light shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (errorBanner) setErrorBanner(null);
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask Sync AI: 'What is the latest RoDTEP rate for textiles?' or 'Any DGFT updates on Basmati rice?'"
            className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none py-2"
            maxLength={300}
          />

          <div className="flex items-center gap-1.5 pr-1 shrink-0">
            {input.length > 250 && (
              <span className="text-[11px] text-amber-500 font-mono hidden sm:inline">
                {300 - input.length}
              </span>
            )}

            <button
              type="button"
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="p-2.5 rounded-xl bg-navy-deep hover:bg-navy-deep/90 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs flex items-center justify-center cursor-pointer"
              title="Send question to Sync AI"
              aria-label="Send question"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {errorBanner && (
          <div className="mt-2 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorBanner}</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts (shown when empty or always available) */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <span className="text-xs text-slate-500 font-medium mr-1 flex items-center gap-1">
          <Bot className="w-3.5 h-3.5 text-ocean-deep" />
          Suggested:
        </span>
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
            className="text-left text-xs px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Conversational Bubbles Container */}
      {(messages.length > 0 || isLoading) && (
        <div className="p-4 sm:p-6 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-border shadow-sm backdrop-blur-xs space-y-4 max-h-[500px] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-navy-deep dark:text-slate-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Sync AI Intelligence Session</span>
            </div>

            <button
              type="button"
              onClick={clearChat}
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear thread</span>
            </button>
          </div>

          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-ocean-deep/10 dark:bg-ocean-light/10 text-ocean-deep dark:text-ocean-light flex items-center justify-center shrink-0 border border-ocean-deep/20 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed shadow-2xs ${
                    msg.sender === "user"
                      ? "bg-navy-deep text-white rounded-tr-none"
                      : msg.isError
                      ? "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900/40 rounded-tl-none"
                      : "bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/60 rounded-tl-none"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Sources Grounding List */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Referenced Notifications:
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {msg.sources.map((src) => (
                          <a
                            key={src.id}
                            href={src.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-ocean-deep dark:text-ocean-light hover:underline font-medium break-all"
                          >
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                              {src.sourceName}
                            </span>
                            <span className="truncate">{src.title}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    className={`mt-1.5 text-[10px] text-right ${
                      msg.sender === "user"
                        ? "text-slate-300"
                        : "text-slate-400"
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {msg.sender === "user" && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-8 h-8 rounded-full bg-ocean-deep/10 dark:bg-ocean-light/10 text-ocean-deep dark:text-ocean-light flex items-center justify-center shrink-0 border border-ocean-deep/20">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl rounded-tl-none px-4 py-3 text-sm flex items-center gap-2 shadow-2xs">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Sync AI is querying verified trade gazettes
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"></span>
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
