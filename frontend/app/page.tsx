"use client";
import React, { useState, useRef, useEffect } from "react";
import { Paperclip, Mic, Square, Send, X, Sparkles, Activity, LogOut, Plus, FolderKanban } from "lucide-react";
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

  // Projects state
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
      if (session?.user) {
        fetchProjects(session.user.id);
      } else {
        setProjects([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProjects = async (userId: string) => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId);
    
    if (error) console.error("Error fetching projects:", error);
    else if (data) setProjects(data);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
      if (error) setAuthError(error.message);
      else alert("Check your email for confirmation link or try signing in!");
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
      .insert([
        { user_id: user.id, name: newProjectName, description: newProjectDesc, category: "SaaS Model" }
      ])
      .select();

    if (error) {
      alert("Error adding project: " + error.message);
    } else if (data) {
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

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioBlobUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
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
      if (!apiKey) throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is missing.");

      const parts: any[] = [{ text: input || "Please analyze this file or voice note." }];

      if (currentFile) {
        const base64File = await fileToBase64(currentFile);
        parts.push({ inlineData: { mimeType: currentFile.type || "application/octet-stream", data: base64File.split(",")[1] } });
      }

      if (currentAudio) {
        const base64Audio = await blobToBase64(currentAudio);
        parts.push({ inlineData: { mimeType: "audio/webm", data: base64Audio.split(",")[1] } });
      }

      const contents = updatedMessages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      contents.push({ role: 'user', parts });
      contents.unshift({ role: 'user', parts: [{ text: `System: You are Venture AI advisor for ${user?.email || 'Founder'}. Saved projects: ${JSON.stringify(projects)}` }] });
      contents.unshift({ role: 'model', parts: [{ text: "Understood. Ready with tailored advice." }] });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "API Error");

      const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";
      setMessages(prev => [...prev, { role: "assistant", content: aiReply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ Error: ${err.message}` }]);
    }
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#030712", color: "#f8fafc", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "16px 24px", borderBottom: "1px solid rgba(168,85,247,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#030712" }}>
        <div>
          <span style={{ fontWeight: "extrabold", letterSpacing: "1px", color: "#c084fc", fontSize: "16px" }}>VENTURE AI</span>
          <span style={{ fontSize: "10px", display: "block", color: "#a855f7", fontFamily: "monospace" }}>CLOUD DATABASE SECURED</span>
        </div>
        {user && (
          <button onClick={handleSignOut} style={{ background: "#ef4444", color: "white", padding: "6px 14px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "12px" }}>
            Sign Out ({user.email})
          </button>
        )}
      </header>

      {!user ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#0f172a", border: "1px solid #7e22ce", padding: "35px", borderRadius: "20px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}>
            <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "6px", textAlign: "center", color: "white" }}>{isSignUp ? "Create Account" : "Sign In to Venture AI"}</h2>
            <p style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center", marginBottom: "20px" }}>Access your cloud-saved projects from any device.</p>
            
            {authError && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", padding: "10px", borderRadius: "8px", color: "#f87171", fontSize: "12px", marginBottom: "15px" }}>{authError}</div>}
            
            <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontFamily: "monospace", display: "block", marginBottom: "6px", color: "#cbd5e1" }}>Email Address</label>
                <input type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="founder@venture.ai" style={{ width: "100%", padding: "12px", background: "#020617", border: "1px solid #475569", color: "white", borderRadius: "10px", boxSizing: "border-box", fontSize: "13px", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontFamily: "monospace", display: "block", marginBottom: "6px", color: "#cbd5e1" }}>Password</label>
                <input type="password" required value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="••••••••" style={{ width: "100%", padding: "12px", background: "#020617", border: "1px solid #475569", color: "white", borderRadius: "10px", boxSizing: "border-box", fontSize: "13px", outline: "none" }} />
              </div>
              
              <button type="submit" style={{ width: "100%", padding: "14px", background: "linear-gradient(to right, #9333ea, #db2777)", color: "white", fontWeight: "bold", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "14px", marginTop: "6px", boxShadow: "0 4px 15px rgba(147,51,234,0.4)" }}>
                {isSignUp ? "Sign Up Now" : "Sign In Now"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "20px", borderTop: "1px solid #1e293b", paddingTop: "15px" }}>
              <button onClick={() => setIsSignUp(!isSignUp)} style={{ background: "none", border: "none", color: "#c084fc", cursor: "pointer", fontSize: "12px", fontFamily: "monospace" }}>
                {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <nav style={{ display: "flex", gap: "10px", padding: "12px 24px", background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
            {(['home', 'projects', 'about', 'faq'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: activeTab === tab ? "linear-gradient(to right, #9333ea, #db2777)" : "transparent", color: "white", border: "none", padding: "8px 18px", borderRadius: "8px", cursor: "pointer", textTransform: "capitalize", fontSize: "12px", fontWeight: "600" }}>
                {tab === 'about' ? 'About Us' : tab}
              </button>
            ))}
          </nav>

          <div style={{ flex: 1, padding: "24px" }}>
            {activeTab === "home" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "24px", height: "calc(100vh - 160px)" }}>
                <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", background: "rgba(147,51,234,0.1)", borderBottom: "1px solid #1e293b", fontSize: "11px", fontFamily: "monospace", color: "#d8b4fe", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Sparkles size={14} /> AI Strategy Stream
                  </div>
                  <div style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                    {messages.map((m, i) => (
                      <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? '#9333ea' : '#1e293b', padding: "12px 16px", borderRadius: "12px", maxWidth: "85%", fontSize: "13px", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
                        {m.content}
                      </div>
                    ))}
                  </div>

                  {(attachedFile || audioBlobUrl) && (
                    <div style={{ padding: "10px 16px", background: "rgba(147,51,234,0.15)", borderTop: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#d8b4fe" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {attachedFile && <span>📎 {attachedFile.name}</span>}
                        {audioBlobUrl && <audio controls src={audioBlobUrl} style={{ height: "24px", width: "180px" }} />}
                      </div>
                      <button onClick={() => { setAttachedFile(null); setAudioBlobUrl(null); setAudioBlob(null); }} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSendMessage} style={{ display: "flex", padding: "12px", background: "#020617", borderTop: "1px solid #1e293b", gap: "10px", alignItems: "center" }}>
                    <label style={{ cursor: "pointer", color: "#94a3b8", padding: "6px" }}>
                      <Paperclip size={16} />
                      <input type="file" accept="image/*,.csv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) setAttachedFile(e.target.files[0]); }} />
                    </label>

                    {!isRecording ? (
                      <button type="button" onClick={startRecording} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "6px" }}>
                        <Mic size={16} />
                      </button>
                    ) : (
                      <button type="button" onClick={stopRecording} style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", cursor: "pointer", padding: "6px", borderRadius: "6px" }}>
                        <Square size={16} />
                      </button>
                    )}

                    <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask Venture AI..." style={{ flex: 1, background: "#0f172a", border: "1px solid #475569", color: "white", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", outline: "none" }} />
                    <button type="submit" style={{ background: "linear-gradient(to right, #9333ea, #db2777)", color: "white", border: "none", padding: "10px 16px", borderRadius: "8px", cursor: "pointer" }}>
                      <Send size={16} />
                    </button>
                  </form>
                </div>

                <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <h3 style={{ fontSize: "14px", fontFamily: "monospace", color: "#d8b4fe", textTransform: "uppercase" }}>Financial Simulator</h3>
                  <div style={{ background: "#020617", padding: "16px", borderRadius: "12px", border: "1px solid #1e293b", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontFamily: "monospace" }}>
                      <span>Target MRR</span><span style={{ color: "#c084fc", fontWeight: "bold" }}>₹{targetMrr}</span>
                    </div>
                    <input type="range" min="1000" max="100000" step="1000" value={targetMrr} onChange={e => setTargetMrr(Number(e.target.value))} style={{ width: "100%", accentColor: "#9333ea", cursor: "pointer" }} />
                  </div>
                  <div style={{ background: "#020617", padding: "16px", borderRadius: "12px", border: "1px solid #1e293b", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontFamily: "monospace" }}>
                      <span>Active Users</span><span style={{ color: "#c084fc", fontWeight: "bold" }}>{activeUsers}</span>
                    </div>
                    <input type="range" min="50" max="10000" step="50" value={activeUsers} onChange={e => setActiveUsers(Number(e.target.value))} style={{ width: "100%", accentColor: "#9333ea", cursor: "pointer" }} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "projects" && (
              <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "white" }}>Cloud-Synced Venture Projects</h2>
                  <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Stored permanently in your Supabase account database.</p>
                </div>

                <form onSubmit={handleAddProject} style={{ background: "#0f172a", border: "1px solid #1e293b", padding: "20px", borderRadius: "16px", display: "flex", gap: "12px" }}>
                  <input type="text" placeholder="Project Name" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} style={{ flex: 1, padding: "10px 14px", background: "#020617", border: "1px solid #475569", color: "white", borderRadius: "8px", fontSize: "13px", outline: "none" }} />
                  <input type="text" placeholder="Short Description" value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} style={{ flex: 2, padding: "10px 14px", background: "#020617", border: "1px solid #475569", color: "white", borderRadius: "8px", fontSize: "13px", outline: "none" }} />
                  <button type="submit" style={{ background: "linear-gradient(to right, #9333ea, #db2777)", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Plus size={14} /> Save to Cloud
                  </button>
                </form>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {projects.map(p => (
                    <div key={p.id} style={{ background: "#0f172a", border: "1px solid #1e293b", padding: "20px", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#c084fc", width: "fit-content", padding: "2px 8px", borderRadius: "999px", background: "rgba(147,51,234,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}>
                        <FolderKanban size={12} style={{ display: "inline", marginRight: "4px" }} /> Cloud Record
                      </span>
                      <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "white" }}>{p.name}</h3>
                      <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: "1.5" }}>{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "about" && (
              <div style={{ maxWidth: "800px", margin: "0 auto", background: "#0f172a", border: "1px solid #1e293b", padding: "30px", borderRadius: "16px" }}>
                <h2 style={{ fontSize: "22px", fontWeight: "bold", color: "white", marginBottom: "12px" }}>About Venture AI</h2>
                <p style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: "1.6" }}>Venture AI combines cutting-edge generative intelligence with robust PostgreSQL database storage via Supabase, ensuring absolute data permanence and multi-device accessibility.</p>
              </div>
            )}

            {activeTab === "faq" && (
              <div style={{ maxWidth: "800px", margin: "0 auto", background: "#0f172a", border: "1px solid #1e293b", padding: "24px", borderRadius: "16px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "white", marginBottom: "8px" }}>Are my projects permanently saved?</h2>
                <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: "1.5" }}>Yes! Because they are stored in a cloud database linked directly to your user account, you can log in on any computer and your portfolio will be right there.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}