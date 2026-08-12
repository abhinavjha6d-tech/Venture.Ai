"use client";

import React, { useState, useRef, useEffect } from "react";
import { Paperclip, Mic, Square, Send, X, Sparkles, Activity, LogOut, ShieldCheck, User } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" });

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey! 👋 I'm Venture AI, your friendly startup advisor and decision partner. What's on your mind today — brainstorming an idea, working through a tough business decision, or figuring out your next growth step?" }
  ]);
  const [input, setInput] = useState("");
  const [targetMrr, setTargetMrr] = useState(10000);
  const [activeUsers, setActiveUsers] = useState(500);
  const [cac, setCac] = useState(50);
  const [arpu, setArpu] = useState(100);
  
  const [isRecording, setIsRecording] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthMessage("");

    if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setAuthError(error.message);
      else setAuthMessage("Check your email for the confirmation link!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string, overrideFile?: File | null) => {
    if (e) e.preventDefault();
    
    const textToSend = customText !== undefined ? customText : input;
    const fileToProcess = overrideFile !== undefined ? overrideFile : attachment;

    if (!textToSend.trim() && !fileToProcess) return;

    // Check for unsupported Office formats (.docx, .pptx, .xlsx)
    if (fileToProcess && (fileToProcess.name.endsWith(".docx") || fileToProcess.name.endsWith(".pptx") || fileToProcess.name.endsWith(".xlsx"))) {
      const fileTypeLabel = fileToProcess.name.endsWith(".pptx") ? "PowerPoint (.pptx)" : fileToProcess.name.endsWith(".docx") ? "Word (.docx)" : "Excel (.xlsx)";
      setMessages((prev) => [
        ...prev,
        { role: "user", content: `[Uploaded file: ${fileToProcess.name}]` },
        { role: "assistant", content: `⚠️ Gemini API doesn't support direct reading of ${fileTypeLabel} files yet. Please export your presentation or document as a **PDF** or text file, then upload it!` }
      ]);
      setAttachment(null);
      if (customText === undefined) setInput("");
      return;
    }

    const userText = textToSend.trim();
    if (customText === undefined) setInput("");
    setAttachment(null);
    
    const displayMessage = userText || (fileToProcess ? `[Uploaded file: ${fileToProcess.name}]` : "");
    const updatedMessages = [...messages, { role: "user", content: displayMessage }];
    setMessages(updatedMessages);

    try {
      const systemInstruction = `You are Venture AI, a friendly, sharp, and supportive startup advisor and decision helper. 
      You speak naturally, match the user's language style (English, Hindi, or Hinglish seamlessly based on their prompt), and give practical, actionable startup, product, and growth advice. 
      Current user telemetry context: Target MRR is ₹${targetMrr}, Active Users are ${activeUsers}, CAC is ₹${cac}, ARPU is ₹${arpu}. 
      Keep your tone conversational, motivating, and smart. Avoid robotic templates; think dynamically like an expert co-founder.`;

      let filePart = null;

      if (fileToProcess) {
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.readAsDataURL(fileToProcess);
        });

        filePart = {
          inlineData: {
            data: base64Data,
            mimeType: fileToProcess.type || "application/octet-stream",
          },
        };
      }

      const contents = updatedMessages.map((msg, index) => {
        if (index === updatedMessages.length - 1 && filePart) {
          return {
            role: "user",
            parts: [
              { text: userText || `Please review and analyze this attached file (${fileToProcess?.name}) for my startup strategy.` }, 
              filePart
            ],
          };
        }
        return {
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        };
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      const reply = response.text || "Acha sawaal hai! Isko aur detail mein analyze karte hain. Batao aage kya plan hai?";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply }
      ]);
    } catch (error) {
      console.error("Gemini API Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Oops! File processing encountered an issue. Make sure your file is a supported format (PDF, Image, Audio, or Text) and try again!" }
      ]);
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], "voice_note.webm", { type: 'audio/webm' });
          handleSendMessage(undefined, "Please listen to this voice note and respond to my query:", audioFile);
          
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Microphone permission error:", err);
        alert("Microphone access was denied or is not supported in this browser.");
        setIsRecording(false);
      }
    } else {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070514] text-white p-4 md:p-8 font-sans selection:bg-purple-500 selection:text-white">
      
      <header className="flex justify-between items-center mb-8 border-b border-purple-900/40 pb-4">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Venture AI Logo" 
            className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-purple-600/30" 
          />
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-wider bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-400 bg-clip-text text-transparent">
              VENTURE AI
            </h1>
            <p className="text-[9px] md:text-[10px] tracking-widest text-purple-400 font-semibold uppercase">STRATEGIC INTELLIGENCE CO-PILOT</p>
          </div>
        </div>

        <div>
          {session ? (
            <div className="flex items-center gap-3 bg-[#120F29] border border-purple-900/50 px-4 py-2 rounded-2xl shadow-lg">
              <div className="hidden md:flex items-center gap-2 text-xs text-purple-300">
                <User size={14} />
                <span className="truncate max-w-[140px]">{session.user.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 px-3 py-1.5 rounded-xl text-xs transition"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-purple-950/30 border border-purple-900/50 px-4 py-2 rounded-2xl text-xs text-purple-300">
              <ShieldCheck size={16} className="text-purple-400" />
              <span>Secure Session</span>
            </div>
          )}
        </div>
      </header>

      {session ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-[#120F29]/90 border border-purple-900/50 rounded-3xl p-5 flex flex-col h-[680px] shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4 border-b border-purple-900/40 pb-3">
              <div className="flex items-center gap-2 text-purple-400">
                <Sparkles size={18} />
                <h2 className="text-sm font-bold tracking-wide uppercase">AI Strategy Stream</h2>
              </div>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-full font-semibold">
                SECURE SESSION
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin scrollbar-thumb-purple-900">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white rounded-br-none shadow-lg shadow-purple-600/20"
                        : "bg-[#1a1638] border border-purple-900/40 text-gray-200 rounded-bl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {attachment && (
              <div className="flex items-center justify-between bg-purple-950/40 border border-purple-900/50 p-2.5 rounded-xl mb-3 text-xs">
                <span className="text-purple-300 truncate">Attached: {attachment.name}</span>
                <button onClick={() => setAttachment(null)} className="text-red-400 hover:text-red-300">
                  <X size={14} />
                </button>
              </div>
            )}

            <form onSubmit={(e) => handleSendMessage(e)} className="relative mt-auto flex items-center gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => e.target.files && setAttachment(e.target.files[0])} 
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#0a071e] hover:bg-purple-950/50 border border-purple-900/50 p-3 rounded-xl text-purple-400 transition"
                title="Attach PDF, Image, or Audio file"
              >
                <Paperclip size={18} />
              </button>

              <button
                type="button"
                onClick={toggleRecording}
                className={`border p-3 rounded-xl transition ${isRecording ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse" : "bg-[#0a071e] hover:bg-purple-950/50 border-purple-900/50 text-purple-400"}`}
                title={isRecording ? "Stop recording voice note" : "Record voice note"}
              >
                {isRecording ? <Square size={18} /> : <Mic size={18} />}
              </button>

              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Chat naturally in English, Hindi or Hinglish..."
                  className="w-full bg-[#0a071e] border border-purple-900/50 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 p-2 rounded-lg text-white transition shadow-md shadow-purple-600/40"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>

          <div className="flex flex-col gap-6">
            
            <div className="bg-[#120F29]/90 border border-purple-900/50 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-base font-black tracking-wider text-white">Market Trajectory & Unit Economics</h2>
                  <p className="text-xs text-purple-400">Venture growth telemetry matrices</p>
                </div>
                <span className="bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  OPTIMIZED
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-[#0a071e] border border-purple-900/40 p-3.5 rounded-2xl">
                  <span className="text-[11px] text-gray-400 block mb-1">Target MRR</span>
                  <span className="text-lg font-black text-white">₹{targetMrr.toLocaleString()}</span>
                </div>
                <div className="bg-[#0a071e] border border-purple-900/40 p-3.5 rounded-2xl">
                  <span className="text-[11px] text-gray-400 block mb-1">Active Users</span>
                  <span className="text-lg font-black text-white">{activeUsers.toLocaleString()}</span>
                </div>
                <div className="bg-[#0a071e] border border-purple-900/40 p-3.5 rounded-2xl">
                  <span className="text-[11px] text-gray-400 block mb-1">CAC</span>
                  <span className="text-lg font-black text-pink-400">₹{cac}</span>
                </div>
                <div className="bg-[#0a071e] border border-purple-900/40 p-3.5 rounded-2xl">
                  <span className="text-[11px] text-gray-400 block mb-1">ARPU</span>
                  <span className="text-lg font-black text-purple-400">₹{arpu}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#120F29]/90 border border-purple-900/50 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-purple-400" />
                  <span className="text-xs font-bold tracking-wider text-white uppercase">REVENUE TRAJECTORY MODEL</span>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1 text-cyan-400"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span> Revenue</span>
                  <span className="flex items-center gap-1 text-pink-400"><span className="w-2 h-2 rounded-full bg-pink-400 inline-block"></span> LTV</span>
                </div>
              </div>

              <div className="h-36 w-full relative flex items-end pt-4">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M 0,${Math.max(20, 140 - (targetMrr / 800))} Q 125,${Math.max(10, 110 - (activeUsers / 80))} 250,${Math.max(10, 80 - (targetMrr / 1500))} T 500,${Math.max(5, 40 - (targetMrr / 2000))} L 500,150 L 0,150 Z`}
                    fill="url(#grad)"
                  />
                  <path
                    d={`M 0,${Math.max(30, 130 - (targetMrr / 900))} Q 125,${Math.max(15, 95 - (activeUsers / 70))} 250,${Math.max(10, 65 - (targetMrr / 1400))} T 500,${Math.max(5, 25 - (targetMrr / 1800))}`}
                    fill="none"
                    stroke="#ec4899"
                    strokeWidth="3"
                  />
                  <path
                    d={`M 0,${Math.max(50, 140 - (targetMrr / 1000))} Q 125,${Math.max(25, 120 - (activeUsers / 90))} 250,${Math.max(20, 90 - (targetMrr / 1600))} T 500,${Math.max(10, 50 - (targetMrr / 2200))}`}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                  />
                </svg>
              </div>
              <div className="flex justify-between text-[11px] text-gray-500 mt-2 border-t border-purple-900/30 pt-2 font-mono">
                <span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span><span>Q5</span>
              </div>
            </div>

            <div className="bg-[#120F29]/90 border border-purple-900/50 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-2 text-purple-400 mb-4 border-b border-purple-900/40 pb-3">
                <Activity size={18} />
                <h2 className="text-sm font-bold tracking-wide uppercase">Financial Modeling Simulator</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-[#0a071e] p-4 rounded-2xl border border-purple-900/30">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-gray-300">Target MRR</label>
                    <span className="text-purple-400 font-bold text-sm">₹{targetMrr}</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={targetMrr}
                    onChange={(e) => setTargetMrr(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <div className="bg-[#0a071e] p-4 rounded-2xl border border-purple-900/30">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-gray-300">Active Users</label>
                    <span className="text-purple-400 font-bold text-sm">{activeUsers}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="10000"
                    step="50"
                    value={activeUsers}
                    onChange={(e) => setActiveUsers(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto mt-16 bg-[#120F29]/90 border border-purple-900/60 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-white mb-2">
              {authMode === "signin" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-xs text-gray-400">Sign in or sign up to access your secure Venture AI workspace.</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#0a071e] border border-purple-900/50 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0a071e] border border-purple-900/50 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            {authError && <p className="text-xs text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/30">{authError}</p>}
            {authMessage && <p className="text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">{authMessage}</p>}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-purple-600/30 text-sm mt-2"
            >
              {authMode === "signin" ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === "signin" ? "signup" : "signin");
                setAuthError("");
                setAuthMessage("");
              }}
              className="text-xs text-purple-400 hover:text-purple-300 transition"
            >
              {authMode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}