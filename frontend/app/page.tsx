"use client";
import React, { useState, useRef, useEffect } from "react";
import { Paperclip, Mic, Square, Send, X, TrendingUp, Sparkles, Activity, LogOut, Plus, FolderKanban } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [activeTab, setActiveTab] = useState<"home" | "about" | "projects" | "faq">("home");
  const [user, setUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState("");

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am Venture AI, your live AI-powered startup strategic advisor."
    }
  ]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [targetMrr, setTargetMrr] = useState(10000);
  const [activeUsers, setActiveUsers] = useState(500);
  const [cac, setCac] = useState(50);
  const [arpu, setArpu] = useState(100);

  const [projects, setProjects] = useState<Array<{ id: string; name: string; description: string; category: string }>>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProjects(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProjects(session.user.id);
      else setProjects([]);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProjects = async (userId: string) => {
    const { data } = await supabase.from("projects").select("*").eq("user_id", userId);
    if (data) setProjects(data);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
      if (error) setAuthError(error.message);
      else alert("Check your email for confirmation link!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) setAuthError(error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !user) return;
    const { data, error } = await supabase
      .from("projects")
      .insert([{ user_id: user.id, name: newProjectName, description: newProjectDesc, category: "SaaS Model" }])
      .select();

    if (error) alert("Error: " + error.message);
    else if (data) {
      setProjects([...projects, data[0]]);
      setNewProjectName("");
      setNewProjectDesc("");
    }
  };

  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioBlobUrl(URL.createObjectURL(blob));
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const fileToBase64 = (file: File): Promise<string> => new Promise((res, rej) => {
    const r = new FileReader();
    r.readAsDataURL(file);
    r.onload = () => res(r.result as string);
    r.onerror = rej;
  });

  const blobToBase64 = (blob: Blob): Promise<string> => new Promise((res, rej) => {
    const r = new FileReader();
    r.readAsDataURL(blob);
    r.onload = () => res(r.result as string);
    r.onerror = rej;
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !attachedFile && !audioBlob) return;

    let displayMessage = input;
    if (attachedFile) displayMessage += ` [Attached: ${attachedFile.name}]`;
    if (audioBlob) displayMessage += ` [Attached Voice Note]`;

    const updatedMessages = [...messages, { role: "user", content: displayMessage.trim() }];
    setMessages(updatedMessages);

    const currentFile = attachedFile;
    const currentAudio = audioBlob;
    setInput("");
    setAttachedFile(null);
    setAudioBlob(null);
    setAudioBlobUrl(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing Gemini API Key in .env.local");

      const parts: any[] = [{ text: input || "Analyze this file/audio." }];
      if (currentFile) {
        const b64 = await fileToBase64(currentFile);
        parts.push({ inlineData: { mimeType: currentFile.type || "application/octet-stream", data: b64.split(",")[1] } });
      }
      if (currentAudio) {
        const b64 = await blobToBase64(currentAudio);
        parts.push({ inlineData: { mimeType: "audio/webm", data: b64.split(",")[1] } });
      }

      const contents = updatedMessages.slice(0, -1).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
      contents.push({ role: 'user', parts });
      contents.unshift({ role: 'user', parts: [{ text: `System: Advisor for ${user?.email}. Projects: ${JSON.stringify(projects)}` }] });
      contents.unshift({ role: 'model', parts: [{ text: "Understood." }] });

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "API Error");

      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ Error: ${err.message}` }]);
    }
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#030712", color: "#f8fafc", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "16px 24px", borderBottom: "1px solid rgba(168,85,247,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#030712" }}>
        <h2 style={{ fontWeight: "bold", fontSize: "18px", color: "#c084fc" }}>VENTURE AI</h2>
        {user && (
          <button onClick={handleSignOut} style={{ background: "#ef4444", color: "white", padding: "6px 14px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "12px" }}>
            Sign Out
          </button>
        )}
      </header>

      {!user ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#0f172a", border: "1px solid #7e22ce", padding: "30px", borderRadius: "16px", width: "100%", maxWidth: "400px", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px", textAlign: "center" }}>{isSignUp ? "Create Account" : "Sign In"}</h2>
            {authError && <p style={{ color: "#f87171", fontSize: "12px", marginBottom: "12px" }}>{authError}</p>}
            
            <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", display: "block", marginBottom: "4px" }}>Email</label>
                <input type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} style={{ width: "100%", padding: "10px", background: "#020617", border: "1px solid #475569", color: "white", borderRadius: "8px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", display: "block", marginBottom: "4px" }}>Password</label>
                <input type="password" required value={authPassword} onChange={e => setAuthPassword(e.target.value)} style={{ width: "100%", padding: "10px", background: "#020617", border: "1px solid #475569", color: "white", borderRadius: "8px", boxSizing: "border-box" }} />
              </div>
              
              {/* EXPLICIT BUTTON STYLE GUARANTEED TO RENDER */}
              <button type="submit" style={{ width: "100%", padding: "12px", background: "linear-gradient(to right, #9333ea, #db2777)", color: "white", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", marginTop: "10px" }}>
                {isSignUp ? "Sign Up Now" : "Sign In Now"}
              </button>
            </form>

            <button onClick={() => setIsSignUp(!isSignUp)} style={{ background: "none", border: "none", color: "#c084fc", cursor: "pointer", fontSize: "12px", width: "100%", marginTop: "15px", textAlign: "center" }}>
              {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <nav style={{ display: "flex", gap: "10px", padding: "10px 20px", background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
            {(['home', 'projects', 'about', 'faq'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: activeTab === tab ? "#9333ea" : "transparent", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", textTransform: "capitalize", fontSize: "12px" }}>
                {tab}
              </button>
            ))}
          </nav>

          <div style={{ flex: 1, padding: "20px" }}>
            {activeTab === "home" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", height: "calc(100vh - 150px)" }}>
                <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={{ flex: 1, padding: "15px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {messages.map((m, i) => (
                      <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? '#9333ea' : '#1e293b', padding: "10px 14px", borderRadius: "8px", maxWidth: "80%", fontSize: "13px" }}>
                        {m.content}
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendMessage} style={{ display: "flex", padding: "10px", background: "#020617", borderTop: "1px solid #1e293b", gap: "10px" }}>
                    <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask Venture AI..." style={{ flex: 1, background: "#0f172a", border: "1px solid #475569", color: "white", padding: "8px 12px", borderRadius: "6px", fontSize: "13px" }} />
                    <button type="submit" style={{ background: "#9333ea", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>Send</button>
                  </form>
                </div>
                <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px" }}>
                  <h3>Metrics & Simulator</h3>
                  <p style={{ fontSize: "13px", color: "#94a3b8" }}>Target MRR: ₹{targetMrr}</p>
                  <input type="range" min="1000" max="100000" step="1000" value={targetMrr} onChange={e => setTargetMrr(Number(e.target.value))} style={{ width: "100%", marginTop: "10px" }} />
                </div>
              </div>
            )}

            {activeTab === "projects" && (
              <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <h2>Your Cloud Projects</h2>
                <form onSubmit={handleAddProject} style={{ display: "flex", gap: "10px", margin: "20px 0" }}>
                  <input type="text" placeholder="Project Name" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} style={{ flex: 1, padding: "8px", background: "#0f172a", border: "1px solid #475569", color: "white", borderRadius: "6px" }} />
                  <input type="text" placeholder="Description" value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} style={{ flex: 2, padding: "8px", background: "#0f172a", border: "1px solid #475569", color: "white", borderRadius: "6px" }} />
                  <button type="submit" style={{ background: "#9333ea", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>Save</button>
                </form>
                <div style={{ display: "grid", gap: "15px" }}>
                  {projects.map(p => (
                    <div key={p.id} style={{ background: "#0f172a", border: "1px solid #1e293b", padding: "15px", borderRadius: "8px" }}>
                      <h4>{p.name}</h4>
                      <p style={{ fontSize: "12px", color: "#94a3b8" }}>{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "about" && <div><h2>About Venture AI</h2><p>Cloud-synced AI startup advisor.</p></div>}
            {activeTab === "faq" && <div><h2>FAQ</h2><p>All data is saved securely in Supabase.</p></div>}
          </div>
        </div>
      )}
    </main>
  );
}