"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Activity, 
  Send, 
  Sparkles, 
  LogOut, 
  LogIn, 
  BarChart2, 
  PieChart, 
  Save, 
  Paperclip, 
  Mic, 
  Square, 
  X 
} from "lucide-react";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from "recharts";
import { auth, db, storage, googleProvider, signInWithPopup, signOut } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" });

export default function VentureDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState([
    { 
      role: "assistant", 
      content: "Hello! I am Venture.ai, your live Gemini-powered startup strategic advisor. Sign in to save your history, upload financial sheets, or ask me anything about your unit economics." 
    }
  ]);
  const [input, setInput] = useState("");

  // Multimedia upload states
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Simulator states
  const [cac, setCac] = useState(50);
  const [arpu, setArpu] = useState(100);
  const [lifespan, setLifespan] = useState(12);
  const [mrr, setMrr] = useState(10000);
  const [activeUsers, setActiveUsers] = useState(500);

  // Track authentication & load user data from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.chats) setMessages(data.chats);
          if (data.simulator) {
            setMrr(data.simulator.mrr || 10000);
            setActiveUsers(data.simulator.activeUsers || 500);
            setCac(data.simulator.cac || 50);
            setArpu(data.simulator.arpu || 100);
            setLifespan(data.simulator.lifespan || 12);
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Upload file or voice blob to Firebase Storage
  const uploadFileToCloud = async (fileOrBlob: File | Blob, filename: string) => {
    try {
      const storageRef = ref(storage, `venture_uploads/${Date.now()}_${filename}`);
      const snapshot = await uploadBytes(storageRef, fileOrBlob);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (error) {
      console.error("Upload failed:", error);
      return null;
    }
  };

  // Save state & chat history to Firestore
  const saveUserData = async (newMessages: any[]) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        name: user.displayName,
        chats: newMessages,
        simulator: { mrr, activeUsers, cac, arpu, lifespan },
        lastUpdated: new Date()
      }, { merge: true });
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
  };

  const ltv = arpu * lifespan;
  const roiPercentage = cac > 0 ? ((ltv - cac) / cac) * 100 : 0;

  const growthData = [
    { month: "Jan", revenue: Math.round(mrr * 0.2), users: Math.round(activeUsers * 0.2) },
    { month: "Feb", revenue: Math.round(mrr * 0.35), users: Math.round(activeUsers * 0.35) },
    { month: "Mar", revenue: Math.round(mrr * 0.5), users: Math.round(activeUsers * 0.5) },
    { month: "Apr", revenue: Math.round(mrr * 0.65), users: Math.round(activeUsers * 0.65) },
    { month: "May", revenue: Math.round(mrr * 0.8), users: Math.round(activeUsers * 0.8) },
    { month: "Jun", revenue: Math.round(mrr * 0.9), users: Math.round(activeUsers * 0.9) },
    { month: "Jul", revenue: mrr, users: activeUsers },
  ];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !attachedFile && !audioBlobUrl) return;

    let fileUrl = "";
    let contentSummary = input;

    if (attachedFile) {
      fileUrl = await uploadFileToCloud(attachedFile, attachedFile.name) || "";
      contentSummary += ` [Uploaded File: ${attachedFile.name} at ${fileUrl}]`;
    }

    if (audioBlobUrl) {
      const response = await fetch(audioBlobUrl);
      const audioBlob = await response.blob();
      fileUrl = await uploadFileToCloud(audioBlob, "voice_note.webm") || "";
      contentSummary += ` [Voice Note Uploaded at ${fileUrl}]`;
    }

    const updatedMessages = [...messages, { role: "user", content: contentSummary }];
    setMessages(updatedMessages);
    setInput("");
    setAttachedFile(null);
    setAudioBlobUrl(null);

    if (user) await saveUserData(updatedMessages);

    // Call Gemini API
    try {
      const promptContext = `You are Venture.ai, an elite VC mentor and startup strategic advisor. 
      The user's current startup telemetry (in Indian Rupees ₹) is:
      - Monthly Recurring Revenue (MRR): ₹${mrr}
      - Active Users: ${activeUsers}
      - Customer Acquisition Cost (CAC): ₹${cac}
      - Average Revenue Per User (ARPU): ₹${arpu}
      - Customer Lifespan: ${lifespan} months
      - Projected LTV: ₹${ltv}
      - Estimated ROI: ${roiPercentage.toFixed(1)}%

      Provide strategic, actionable startup advice based on this telemetry and the user query: "${contentSummary}"`;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptContext,
      });

      const botReply = aiResponse.text || "I have analyzed your request.";
      const finalMessages = [
        ...updatedMessages,
        { role: "assistant", content: botReply }
      ];
      setMessages(finalMessages);
      if (user) await saveUserData(finalMessages);
    } catch (error) {
      console.error("Gemini API Error:", error);
      const errorMessages = [
        ...updatedMessages,
        { role: "assistant", content: "Error communicating with Gemini AI. Please ensure your API key in .env.local is valid." }
      ];
      setMessages(errorMessages);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans selection:bg-pink-500 selection:text-white">
      {/* LEFT SIDEBAR: Chat, Auth & Uploads */}
      <div className="w-1/3 border-r border-purple-900/30 flex flex-col bg-slate-950/80 backdrop-blur-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-pink-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Sidebar Header */}
        <div className="p-4 border-b border-purple-900/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Venture.ai Logo" 
              className="w-8 h-8 object-contain rounded-lg border border-purple-500/30 bg-slate-900/80"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Venture.ai
            </h1>
          </div>

          <div>
            {!user ? (
              <button
                onClick={handleGoogleSignIn}
                className="flex items-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <img src={user.photoURL || ""} alt="Profile" className="w-7 h-7 rounded-full border border-purple-500" />
                <button onClick={handleSignOut} className="text-slate-400 hover:text-rose-400 transition-colors p-1" title="Sign Out">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-lg whitespace-pre-wrap ${
                msg.role === "user" 
                  ? "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-br-none shadow-purple-500/20 font-medium" 
                  : "bg-slate-900/90 border border-purple-500/20 text-slate-200 rounded-bl-none shadow-black/40"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Attachment & Voice Preview Drawer */}
        {(attachedFile || audioBlobUrl) && (
          <div className="px-4 py-2 bg-slate-900/90 border-t border-purple-900/30 flex items-center justify-between text-xs text-purple-300">
            <div className="flex items-center gap-2 truncate">
              {attachedFile && <span>📎 {attachedFile.name}</span>}
              {audioBlobUrl && <audio controls src={audioBlobUrl} className="h-6 w-48" />}
            </div>
            <button onClick={() => { setAttachedFile(null); setAudioBlobUrl(null); }} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Form */}
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
            placeholder={isRecording ? "Recording voice note..." : "Ask Gemini advisor..."}
            disabled={isRecording}
            className="flex-1 bg-slate-900/80 border border-purple-500/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-all text-white placeholder-slate-500"
          />

          <button type="submit" className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white px-4 py-2.5 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-purple-500/20 cursor-pointer">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* RIGHT MAIN CONTENT: Interactive Dashboard */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gradient-to-br from-slate-950 via-indigo-950/40 to-purple-950/40 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none -z-10" />

        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight">
              Executive Intelligence & Growth
            </h2>
            <p className="text-sm text-purple-300/80 mt-1">Real-time telemetry and Gemini-backed ROI projections.</p>
          </div>
          {user && (
            <button onClick={() => saveUserData(messages)} className="flex items-center gap-2 bg-slate-900 border border-purple-500/30 hover:border-pink-500 text-purple-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer">
              <Save className="w-4 h-4 text-pink-400" /> Save Simulator State
            </button>
          )}
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-purple-500/20 hover:border-pink-500/40 transition-all p-5 rounded-2xl backdrop-blur-xl">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target MRR</span>
            <div className="text-2xl font-black mt-2 text-white">₹{mrr.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900/60 border border-purple-500/20 hover:border-pink-500/40 transition-all p-5 rounded-2xl backdrop-blur-xl">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Users</span>
            <div className="text-2xl font-black mt-2 text-white">{activeUsers.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900/60 border border-purple-500/20 hover:border-pink-500/40 transition-all p-5 rounded-2xl backdrop-blur-xl">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Projected LTV</span>
            <div className="text-2xl font-black mt-2 text-white">₹{ltv.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900/60 border border-purple-500/20 hover:border-pink-500/40 transition-all p-5 rounded-2xl backdrop-blur-xl">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated ROI</span>
            <div className="text-2xl font-black mt-2 text-pink-400">{roiPercentage.toFixed(1)}%</div>
          </div>
        </div>

        {/* Growth Chart */}
        <div className="bg-slate-900/60 border border-purple-500/20 p-6 rounded-2xl backdrop-blur-xl shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-purple-400" /> Revenue Trajectory (₹)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4c1d95" opacity={0.3} />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#6b21a8", borderRadius: "0.75rem", color: "#fff" }} formatter={(value: any) => [`₹${value}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={3} fill="#a855f7" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Simulator Controls */}
        <div className="bg-slate-900/60 border border-purple-500/20 p-6 rounded-2xl backdrop-blur-xl shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-pink-400" /> Unit Economics Simulator
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
            <div className="bg-slate-950/50 p-4 rounded-xl border border-purple-500/10">
              <label className="text-xs font-bold text-purple-200 block mb-2">Target MRR: ₹{mrr}</label>
              <input type="range" min="0" max="100000" step="1000" value={mrr} onChange={(e) => setMrr(Number(e.target.value))} className="w-full accent-blue-500 bg-slate-900 h-2 rounded-lg cursor-pointer" />
            </div>
            <div className="bg-slate-950/50 p-4 rounded-xl border border-purple-500/10">
              <label className="text-xs font-bold text-purple-200 block mb-2">Active Users: {activeUsers}</label>
              <input type="range" min="0" max="10000" step="100" value={activeUsers} onChange={(e) => setActiveUsers(Number(e.target.value))} className="w-full accent-purple-500 bg-slate-900 h-2 rounded-lg cursor-pointer" />
            </div>
            <div className="bg-slate-950/50 p-4 rounded-xl border border-purple-500/10">
              <label className="text-xs font-bold text-purple-200 block mb-2">CAC: ₹{cac}</label>
              <input type="range" min="0" max="500" value={cac} onChange={(e) => setCac(Number(e.target.value))} className="w-full accent-pink-500 bg-slate-900 h-2 rounded-lg cursor-pointer" />
            </div>
            <div className="bg-slate-950/50 p-4 rounded-xl border border-purple-500/10">
              <label className="text-xs font-bold text-purple-200 block mb-2">ARPU: ₹{arpu}</label>
              <input type="range" min="0" max="1000" step="10" value={arpu} onChange={(e) => setArpu(Number(e.target.value))} className="w-full accent-blue-500 bg-slate-900 h-2 rounded-lg cursor-pointer" />
            </div>
            <div className="bg-slate-950/50 p-4 rounded-xl border border-purple-500/10">
              <label className="text-xs font-bold text-purple-200 block mb-2">Lifespan: {lifespan} mo</label>
              <input type="range" min="1" max="60" step="1" value={lifespan} onChange={(e) => setLifespan(Number(e.target.value))} className="w-full accent-purple-500 bg-slate-900 h-2 rounded-lg cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}