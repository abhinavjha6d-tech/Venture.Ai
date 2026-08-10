"use client";

import React, { useState, useRef, useEffect } from "react";
import { Paperclip, Mic, Square, Send, X, Sparkles, Activity, LogOut, Plus, FolderKanban } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [activeTab, setActiveTab] = useState("Home");
  const [session, setSession] = useState<any>(null);
  
  // Auth state modals/inputs
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  // Chat and Simulator states
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am Venture AI, your live AI-powered startup strategic advisor. Ask me for startup ideas, upload pitch decks/spreadsheets, or record a voice note!" }
  ]);
  const [input, setInput] = useState("");
  const [targetMrr, setTargetMrr] = useState(10000);
  const [activeUsers, setActiveUsers] = useState(500);

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
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    // Simulated AI response loop
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Analyzing your query regarding "${userMessage}" based on target MRR of ₹${targetMrr}... Strategy looks optimal for growth!` }
      ]);
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-[#070514] text-white p-6 font-sans">
      {/* HEADER SECTION WITH LOGO & AUTH */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-purple-900/40 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-wider bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-400 bg-clip-text text-transparent">
            VENTURE AI
          </h1>
          <p className="text-[10px] tracking-widest text-purple-400 font-semibold">CLOUD DATABASE SECURED</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 bg-[#120F29] p-1.5 rounded-xl border border-purple-900/50">
          {["Home", "Projects", "About Us", "Faq"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === tab ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30" : "text-gray-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* User Auth Info / Profile Badge */}
        <div>
          {session ? (
            <div className="flex items-center gap-3 bg-[#120F29] border border-purple-900/50 px-4 py-2 rounded-xl">
              <span className="text-xs text-purple-300 truncate max-w-[160px]">{session.user.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 px-3 py-1.5 rounded-lg text-xs transition"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Secured Portal</span>
            </div>
          )}
        </div>
      </header>

      {/* MAIN LAYOUT */}
      {session ? (
        // --- LOGGED IN WORKSPACE UI ---
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* Left Panel: Chat Stream */}
          <div className="bg-[#120F29]/90 border border-purple-900/50 rounded-2xl p-5 flex flex-col h-[650px] shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 mb-4 text-purple-400 border-b border-purple-900/40 pb-3">
              <Sparkles size={18} />
              <h2 className="text-sm font-bold tracking-wide uppercase">AI Strategy Stream</h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white rounded-br-none"
                        : "bg-[#1a1638] border border-purple-900/40 text-gray-200 rounded-bl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="relative mt-auto">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Venture AI..."
                className="w-full bg-[#0a071e] border border-purple-900/50 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-500 p-2 rounded-lg text-white transition shadow-md shadow-purple-600/40"
              >
                <Send size={16} />
              </button>
            </form>
          </div>

          {/* Right Panel: Financial Simulator */}
          <div className="bg-[#120F29]/90 border border-purple-900/50 rounded-2xl p-6 flex flex-col gap-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-purple-400 border-b border-purple-900/40 pb-3">
              <Activity size={18} />
              <h2 className="text-sm font-bold tracking-wide uppercase">Financial Simulator</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-[#0a071e] p-4 rounded-xl border border-purple-900/30">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-300">Target MRR</label>
                  <span className="text-purple-400 font-bold">₹{targetMrr}</span>
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

              <div className="bg-[#0a071e] p-4 rounded-xl border border-purple-900/30">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-300">Active Users</label>
                  <span className="text-purple-400 font-bold">{activeUsers}</span>
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

              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/40">
                <h3 className="text-xs uppercase font-semibold text-purple-400 mb-1">Estimated Valuation Growth</h3>
                <p className="text-2xl font-black text-white">₹{(targetMrr * 12 * 5).toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">Projected at 5x ARR multiple based on current sliders.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // --- LOGGED OUT UI / LANDING & AUTH CARD ---
        <div className="max-w-md mx-auto mt-12 bg-[#120F29]/90 border border-purple-900/60 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
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

            {authError && <p className="text-xs text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/30">{authError}</p>}
            {authMessage && <p className="text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/30">{authMessage}</p>}

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-purple-600/30 text-sm mt-2"
            >
              {authMode === "signin" ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
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