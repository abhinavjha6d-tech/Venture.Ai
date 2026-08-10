"use client";

import React, { useState, useRef, useEffect } from "react";
import { Paperclip, Mic, Square, Send, X, Sparkles, Activity, LogOut, ShieldCheck, User } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  // Chat and Simulator states
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! 👋 I am Venture AI, your live startup strategic advisor. What would you like to discuss today — a new idea, pitch deck, or growth trajectory?" }
  ]);
  const [input, setInput] = useState("");
  const [targetMrr, setTargetMrr] = useState(10000);
  const [activeUsers, setActiveUsers] = useState(500);
  const [cac, setCac] = useState(50);
  const [arpu, setArpu] = useState(100);
  
  // Voice & Attachment states
  const [isRecording, setIsRecording] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !attachment) return;

    const userText = input.trim();
    const userMessage = userText || (attachment ? `[Uploaded file: ${attachment.name}]` : "");
    setInput("");
    setAttachment(null);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    setTimeout(() => {
      let reply = "";
      const lowerInput = userText.toLowerCase();
      
      const isHindiOrHinglish = 
        /[\u0900-\u097F]/.test(userText) || 
        ["kya", "kaise", "batao", "hai", "hain", "karna", "yeh", "mera", "mujhe", "kuch", "bhai", "or"].some(word => lowerInput.includes(word));

      if (isHindiOrHinglish) {
        if (lowerInput.includes("hi") || lowerInput.includes("hello") || lowerInput.includes("hey")) {
          reply = "Arre hello! 👋 Kaise ho? Batao aaj kis startup idea ya growth trajectory pe kaam karna hai?";
        } else if (lowerInput.includes("trajectory") || lowerInput.includes("growth") || lowerInput.includes("mrr") || lowerInput.includes("revenue") || lowerInput.includes("metrics")) {
          reply = `Teri current growth trajectory aur telemetry check kar raha hoon: Target MRR ₹${targetMrr.toLocaleString()} hai, Active Users ${activeUsers.toLocaleString()} hain, CAC ₹${cac} aur ARPU ₹${arpu} hai. Unit economics kaafi solid lag rahe hain! Right panel ke sliders se numbers change karke growth simulate karke dekh sakte ho. 🚀`;
        } else if (lowerInput.includes("idea") || lowerInput.includes("startup")) {
          reply = "Ekdum mast soch hai! Ek successful startup banane ke liye target market, clear monetization model aur unique value proposition hona zaroori hai. Batao, kis industry ya domain mein dive in kar rahe ho?";
        } else {
          reply = `Badiya point uthaya hai! Tera current financial model (MRR: ₹${targetMrr.toLocaleString()}, Users: ${activeUsers}) kaafi promising hai. Isko aur scale karne ke liye batao, go-to-market strategy ya pitch deck mein kuch help chahiye kya?`;
        }
      } else {
        if (lowerInput.includes("hi") || lowerInput.includes("hello") || lowerInput.includes("hey")) {
          reply = "Hello! 👋 How can I help you with your startup strategy or growth metrics today?";
        } else if (lowerInput.includes("trajectory") || lowerInput.includes("growth") || lowerInput.includes("mrr") || lowerInput.includes("revenue") || lowerInput.includes("metrics")) {
          reply = `Analyzing your current growth trajectory and telemetry: Target MRR is ₹${targetMrr.toLocaleString()}, Active Users are ${activeUsers.toLocaleString()}, CAC is ₹${cac}, and ARPU is ₹${arpu}. Your unit economics look quite solid! You can modify the numbers using the right-panel sliders to simulate growth. 🚀`;
        } else if (lowerInput.includes("idea") || lowerInput.includes("startup")) {
          reply = "That's a solid concept! To build a successful startup, you need a defined target market, a clear monetization model, and a strong unique value proposition. Which industry or domain are you targeting?";
        } else {
          reply = `That's a great point! Your current financial model (MRR: ₹${targetMrr.toLocaleString()}, Users: ${activeUsers}) looks promising. To scale further, would you like to look into go-to-market strategies or pitch deck optimization?`;
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply }
      ]);
    }, 1000);
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setMessages((prev) => [...prev, { role: "assistant", content: "Listening... Parsing your voice input! 🎙️" }]);
      setTimeout(() => {
        setIsRecording(false);
        setMessages((prev) => [...prev, { role: "user", content: "[Voice Note Recorded]" }]);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Voice note received! I have factored your audio query into your growth trajectory and financial models. 📈` }
        ]);
      }, 3000);
    } else {
      setIsRecording(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070514] text-white p-4 md:p-8 font-sans selection:bg-purple-500 selection:text-white">
      
      {/* CUSTOM LOGO HEADER */}
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

        {/* AUTHENTICATION BADGE / SIGN OUT BUTTON */}
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

      {/* MAIN CONTAINER */}
      {session ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LEFT COLUMN: CHAT STREAM */}
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

            <form onSubmit={handleSendMessage} className="relative mt-auto flex items-center gap-2">
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
                title="Attach file"
              >
                <Paperclip size={18} />
              </button>

              <button
                type="button"
                onClick={toggleRecording}
                className={`border p-3 rounded-xl transition ${isRecording ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse" : "bg-[#0a071e] hover:bg-purple-950/50 border-purple-900/50 text-purple-400"}`}
                title="Record Voice Note"
              >
                {isRecording ? <Square size={18} /> : <Mic size={18} />}
              </button>

              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question or type 'trajectory'..."
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

          {/* RIGHT COLUMN: METRICS, LIVE GRAPH & SIMULATOR */}
          <div className="flex flex-col gap-6">
            
            {/* Telemetry Matrices Header Card */}
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

            {/* LIVE REVENUE & LTV TRAJECTORY GRAPH CARD */}
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

            {/* FINANCIAL MODELING SIMULATOR SLIDERS */}
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