"use client";
import React, { useState, useRef } from "react";
import { Paperclip, Mic, Square, Send, X } from "lucide-react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am Venture.ai, your live AI-powered startup strategic advisor. Sign in to save your history, upload financial sheets, or ask me anything about your unit economics."
    }
  ]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !attachedFile && !audioBlobUrl) return;

    setMessages(prev => [...prev, { role: "user", content: input || "[Attached File / Voice Note]" }]);
    setInput("");
    setAttachedFile(null);
    setAudioBlobUrl(null);

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "I've analyzed your input. Let's optimize your unit economics and growth strategy further!" }
      ]);
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-purple-900/30 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-600 to-pink-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-purple-500/20">
            V
          </div>
          <span className="font-semibold text-lg tracking-wide">Venture.ai</span>
        </div>
        <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-purple-500/20 cursor-pointer">
          Sign In
        </button>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        <div className="lg:col-span-5 bg-slate-900/40 border border-purple-900/30 rounded-2xl flex flex-col h-[calc(100vh-140px)] backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-purple-900/30 flex items-center justify-between bg-slate-950/40">
            <h2 className="text-sm font-semibold tracking-wide text-purple-300">Strategic Advisor Chat</h2>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-none shadow-lg shadow-purple-500/10'
                      : 'bg-slate-900/90 border border-purple-500/20 text-slate-200 rounded-bl-none shadow-inner'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {(attachedFile || audioBlobUrl) && (
            <div className="px-4 py-2 bg-slate-900/90 border-t border-purple-900/30 flex items-center justify-between text-xs text-purple-300">
              <div className="flex items-center gap-2 truncate">
                {attachedFile && <span>📎 {attachedFile.name}</span>}
                {audioBlobUrl && <audio controls src={audioBlobUrl} className="h-6 w-48" />}
              </div>
              <button onClick={() => { setAttachedFile(null); setAudioBlobUrl(null); }} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="p-4 border-t border-purple-900/30 flex items-center gap-2 bg-slate-950/50">
            <label className="cursor-pointer text-purple-400 hover:text-pink-400 transition-colors p-2 rounded-xl hover:bg-purple-950/40 flex items-center justify-center" title="Attach File">
              <Paperclip className="w-5 h-5" />
              <input 
                type="file" 
                accept="image/*,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" 
                className="hidden" 
                onChange={(e) => { 
                  if (e.target.files?.[0]) {
                    setAttachedFile(e.target.files[0]);
                  } 
                }}
              />
            </label>

            {!isRecording ? (
              <button type="button" onClick={startRecording} className="text-purple-400 hover:text-pink-400 transition-colors p-2 rounded-xl hover:bg-purple-950/40 cursor-pointer" title="Record Voice Note">
                <Mic className="w-5 h-5" />
              </button>
            ) : (
              <button type="button" onClick={stopRecording} className="text-rose-400 animate-pulse transition-colors p-2 rounded-xl bg-rose-950/40 cursor-pointer" title="Stop Recording">
                <Square className="w-5 h-5" />
              </button>
            )}

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isRecording ? "Recording voice note..." : "Ask Venture.ai..."}
              disabled={isRecording}
              className="flex-1 bg-slate-900/80 border border-purple-500/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-all text-white placeholder-slate-500"
            />

            <button type="submit" className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white px-4 py-2.5 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-purple-500/20 cursor-pointer">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/40 border border-purple-900/30 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Executive Intelligence & Growth</h1>
            <p className="text-sm text-slate-400">Real-time telemetry and advanced AI-backed ROI projections.</p>
          </div>
        </div>
      </div>
    </main>
  );
}