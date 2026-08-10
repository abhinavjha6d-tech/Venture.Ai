"use client";
import React, { useState, useRef } from "react";
import { Paperclip, Mic, Square, Send, X, TrendingUp, Sparkles, Activity } from "lucide-react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am Venture AI, your live AI-powered startup strategic advisor. Ask me for startup ideas, upload pitch decks/spreadsheets, or record a voice note!"
    }
  ]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Simulator states
  const [targetMrr, setTargetMrr] = useState(10000);
  const [activeUsers, setActiveUsers] = useState(500);
  const [cac, setCac] = useState(50);
  const [arpu, setArpu] = useState(100);

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
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
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

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !attachedFile && !audioBlob) return;

    let displayMessage = input;
    if (attachedFile) displayMessage += ` [Attached: ${attachedFile.name}]`;
    if (audioBlob) displayMessage += ` [Attached Voice Note]`;

    const userText = displayMessage.trim();
    const updatedMessages = [...messages, { role: "user", content: userText }];
    setMessages(updatedMessages);

    const currentFile = attachedFile;
    const currentAudio = audioBlob;

    setInput("");
    setAttachedFile(null);
    setAudioBlob(null);
    setAudioBlobUrl(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is missing or not exposed to the browser.");
      }

      const parts: any[] = [{ text: input || "Please analyze this file or voice note and provide startup insights." }];

      if (currentFile) {
        const base64File = await fileToBase64(currentFile);
        const base64Data = base64File.split(",")[1];
        parts.push({
          inlineData: {
            mimeType: currentFile.type || "application/octet-stream",
            data: base64Data
          }
        });
      }

      if (currentAudio) {
        const base64Audio = await blobToBase64(currentAudio);
        const base64AudioData = base64Audio.split(",")[1];
        parts.push({
          inlineData: {
            mimeType: "audio/webm",
            data: base64AudioData
          }
        });
      }

      const contents = updatedMessages.slice(0, -1).map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      }));

      contents.push({
        role: "user",
        parts: parts
      });

      contents.unshift({
        role: "user",
        parts: [{ text: "System Instructions: You are Venture AI, an elite, interactive AI startup strategic advisor. Brainstorm creative startup ideas, evaluate business models, analyze unit economics, review uploaded financial files or voice notes, and provide sharp, actionable venture advice." }]
      });
      contents.unshift({
        role: "model",
        parts: [{ text: "Understood. I am Venture AI, your dedicated startup strategic advisor ready to analyze files, listen to voice notes, and scale your business." }]
      });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `API Error status: ${response.status}`);
      }

      const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiReply) {
        throw new Error("Received empty text response from Gemini API.");
      }

      setMessages(prev => [...prev, { role: "assistant", content: aiReply }]);
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: `⚠️ Debug Error: ${err.message}` }
      ]);
    }
  };

  return (
    <main className="min-h-screen bg-[#030712] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-purple-500 selection:text-white">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Glass Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-purple-500/10 bg-[#030712]/80 backdrop-blur-2xl z-20 sticky top-0 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <img 
            src="/logo.png" 
            alt="Venture AI Logo" 
            className="h-9 w-9 rounded-xl object-cover shadow-lg shadow-purple-500/30 border border-purple-500/20" 
          />
          <div>
            <span className="font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-400 text-base">VENTURE AI</span>
            <span className="text-[10px] block text-purple-400 font-mono tracking-widest uppercase">Strategic Intelligence Co-Pilot</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono shadow-lg shadow-emerald-500/5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE TELEMETRY ACTIVE
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 max-w-[1800px] w-full mx-auto z-10">
        
        {/* Left Panel: Strategic Advisor Chat (Col 5) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-purple-950/10 to-slate-900/40 border border-purple-500/20 rounded-3xl flex flex-col h-[calc(100vh-104px)] backdrop-blur-2xl overflow-hidden shadow-2xl shadow-purple-950/20">
          <div className="px-5 py-3.5 border-b border-purple-500/15 flex items-center justify-between bg-purple-950/20">
            <h2 className="text-xs font-mono uppercase tracking-wider text-purple-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              AI Strategy Stream
            </h2>
            <span className="text-[10px] text-purple-400/80 font-mono px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">SECURE SESSION</span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-purple-500/20">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-none shadow-xl shadow-purple-600/25 border border-purple-400/20'
                      : 'bg-slate-900/80 border border-purple-500/25 text-slate-200 rounded-bl-none shadow-xl backdrop-blur-md'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Active File/Voice Attachments Preview */}
          {(attachedFile || audioBlobUrl) && (
            <div className="px-4 py-2.5 bg-purple-950/30 border-t border-purple-500/20 flex items-center justify-between text-xs text-purple-300">
              <div className="flex items-center gap-2 truncate">
                {attachedFile && <span className="font-mono text-purple-300">📎 {attachedFile.name}</span>}
                {audioBlobUrl && <audio controls src={audioBlobUrl} className="h-6 w-48 accent-purple-500" />}
              </div>
              <button 
                onClick={() => { setAttachedFile(null); setAudioBlobUrl(null); setAudioBlob(null); }} 
                className="text-slate-400 hover:text-white p-1 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Chat Input Form */}
          <form onSubmit={handleSendMessage} className="p-3.5 border-t border-purple-500/20 flex items-center gap-2 bg-slate-950/60">
            <label className="cursor-pointer text-slate-400 hover:text-purple-300 transition-colors p-2.5 rounded-xl hover:bg-purple-950/40 flex items-center justify-center border border-transparent hover:border-purple-500/30" title="Attach File">
              <Paperclip className="w-4 h-4" />
              <input 
                type="file" 
                accept="image/*,.csv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" 
                className="hidden" 
                onChange={(e) => { 
                  if (e.target.files?.[0]) {
                    setAttachedFile(e.target.files[0]);
                  } 
                }}
              />
            </label>

            {!isRecording ? (
              <button type="button" onClick={startRecording} className="text-slate-400 hover:text-purple-300 transition-colors p-2.5 rounded-xl hover:bg-purple-950/40 cursor-pointer border border-transparent hover:border-purple-500/30" title="Record Voice Note">
                <Mic className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={stopRecording} className="text-rose-400 animate-pulse transition-colors p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 cursor-pointer" title="Stop Recording">
                <Square className="w-4 h-4" />
              </button>
            )}

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isRecording ? "Listening to voice note..." : "Ask Venture AI for strategy, pitch feedback..."}
              disabled={isRecording}
              className="flex-1 bg-slate-900/90 border border-purple-500/30 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all text-white placeholder-slate-500 font-sans shadow-inner"
            />

            <button type="submit" className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white p-2.5 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-purple-600/30 cursor-pointer border border-purple-400/30">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Dashboard Area (Col 7) */}
        <div className="lg:col-span-7 space-y-4 overflow-y-auto max-h-[calc(100vh-104px)] pr-1 scrollbar-thin scrollbar-thumb-purple-500/20">
          
          {/* Top Header Card */}
          <div className="bg-gradient-to-r from-purple-950/20 via-slate-900/40 to-slate-900/40 border border-purple-500/20 rounded-3xl p-5 backdrop-blur-2xl shadow-xl flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Market Trajectory & Unit Economics
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Venture growth telemetry matrices</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-purple-300 text-xs font-mono shadow-sm">OPTIMIZED</span>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-slate-900/50 border border-purple-500/20 p-4 rounded-2xl backdrop-blur-xl shadow-xl hover:border-purple-500/40 transition-all">
              <p className="text-[11px] font-mono text-slate-400 mb-1">Target MRR</p>
              <p className="text-base font-bold text-white font-mono">₹{targetMrr.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900/50 border border-purple-500/20 p-4 rounded-2xl backdrop-blur-xl shadow-xl hover:border-purple-500/40 transition-all">
              <p className="text-[11px] font-mono text-slate-400 mb-1">Active Users</p>
              <p className="text-base font-bold text-white font-mono">{activeUsers.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900/50 border border-purple-500/20 p-4 rounded-2xl backdrop-blur-xl shadow-xl hover:border-pink-500/40 transition-all">
              <p className="text-[11px] font-mono text-slate-400 mb-1">CAC</p>
              <p className="text-base font-bold text-pink-400 font-mono">₹{cac}</p>
            </div>
            <div className="bg-slate-900/50 border border-purple-500/20 p-4 rounded-2xl backdrop-blur-xl shadow-xl hover:border-purple-500/40 transition-all">
              <p className="text-[11px] font-mono text-slate-400 mb-1">ARPU</p>
              <p className="text-base font-bold text-purple-400 font-mono">₹{arpu}</p>
            </div>
          </div>

          {/* Graph Section */}
          <div className="bg-slate-900/50 border border-purple-500/20 rounded-3xl p-5 backdrop-blur-2xl shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-purple-300 font-mono">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span>REVENUE TRAJECTORY MODEL</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" /> Revenue</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_8px_#f472b6]" /> LTV</span>
              </div>
            </div>

            <div className="h-44 w-full relative flex items-end justify-between px-2 pt-6 border-b border-l border-purple-500/20">
              <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" preserveAspectRatio="none" viewBox="0 0 500 150">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0 120 Q 150 90, 250 60 T 500 10" fill="none" stroke="#c084fc" strokeWidth="3" />
                <path d="M 0 135 Q 150 110, 250 85 T 500 35" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeDasharray="4 4" />
                <path d="M 0 120 Q 150 90, 250 60 T 500 10 L 500 150 L 0 150 Z" fill="url(#chartGradient)" />
              </svg>
              <div className="absolute bottom-[-22px] left-0 right-0 flex justify-between text-[11px] text-slate-400 font-mono px-2">
                <span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span><span>Q5</span>
              </div>
            </div>
          </div>

          {/* Unit Economics Simulator Panel */}
          <div className="bg-slate-900/50 border border-purple-500/20 rounded-3xl p-5 backdrop-blur-2xl shadow-xl space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-wider text-purple-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              Financial Modeling Simulator
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-2xl border border-purple-500/15">
                <div className="flex justify-between text-xs text-slate-300 font-mono">
                  <span>Target MRR</span>
                  <span className="font-semibold text-purple-400">₹{targetMrr}</span>
                </div>
                <input 
                  type="range" 
                  min="1000" 
                  max="100000" 
                  step="1000"
                  value={targetMrr} 
                  onChange={(e) => setTargetMrr(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-2xl border border-purple-500/15">
                <div className="flex justify-between text-xs text-slate-300 font-mono">
                  <span>Active Users</span>
                  <span className="font-semibold text-purple-400">{activeUsers}</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="10000" 
                  step="50"
                  value={activeUsers} 
                  onChange={(e) => setActiveUsers(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-2xl border border-purple-500/15">
                <div className="flex justify-between text-xs text-slate-300 font-mono">
                  <span>Customer Acquisition Cost (CAC)</span>
                  <span className="font-semibold text-pink-400">₹{cac}</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="500" 
                  step="5"
                  value={cac} 
                  onChange={(e) => setCac(Number(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-2xl border border-purple-500/15">
                <div className="flex justify-between text-xs text-slate-300 font-mono">
                  <span>Average Revenue Per User (ARPU)</span>
                  <span className="font-semibold text-purple-400">₹{arpu}</span>
                </div>
                <input 
                  type="range" 
                  min="20" 
                  max="1000" 
                  step="10"
                  value={arpu} 
                  onChange={(e) => setArpu(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}