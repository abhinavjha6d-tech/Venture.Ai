import { History, FolderKanban, Sparkles } from "lucide-react";

export function HistoryPage({ chatHistory }: { chatHistory: { id: string; title: string }[] }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-cyan-400">
        <History size={20} />
        <h2 className="text-2xl font-black text-white">Strategy History Vault</h2>
      </div>
      <div className="space-y-3">
        {chatHistory.map(chat => (
          <div key={chat.id} className="bg-[#120F29]/90 border border-purple-900/50 p-4 rounded-2xl flex justify-between items-center">
            <span className="text-sm text-gray-200 font-medium">{chat.title}</span>
            <span className="text-[10px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded-full">Encrypted Session</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-pink-400">
        <FolderKanban size={20} />
        <h2 className="text-2xl font-black text-white">Projects Vault</h2>
      </div>
      <div className="bg-[#120F29]/90 border border-purple-900/50 p-6 rounded-3xl space-y-3">
        <h3 className="text-lg font-bold text-white">Ventura AI Core Model</h3>
        <p className="text-xs text-gray-300 leading-relaxed">
          Your flagship AI-driven startup advisor and financial simulator built with Next.js, Supabase, and the Gemini API.
        </p>
        <span className="inline-block text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-3 py-1 rounded-full font-bold">ACTIVE DEPLOYMENT</span>
      </div>
    </div>
  );
}