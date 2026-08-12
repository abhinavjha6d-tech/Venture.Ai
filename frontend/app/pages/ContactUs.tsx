import { Mail, Globe, Sparkles } from "lucide-react";

export default function ContactUs() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles size={14} /> Get in Touch
        </div>
        <h2 className="text-3xl font-black text-white">Connect With The Founders</h2>
        <p className="text-gray-400 text-xs mt-1">Have feedback, partnership inquiries, or need custom startup advice?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a 
          href="mailto:official.ventureai@gmail.com"
          className="bg-[#120F29]/90 hover:bg-purple-950/40 border border-purple-900/50 rounded-3xl p-6 shadow-xl backdrop-blur-xl transition group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition">
            <Mail size={22} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Official Gmail</span>
            <span className="text-sm font-bold text-white truncate">official.ventureai@gmail.com</span>
          </div>
        </a>

        <a 
          href="https://instagram.com/official.ventureai" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-[#120F29]/90 hover:bg-purple-950/40 border border-purple-900/50 rounded-3xl p-6 shadow-xl backdrop-blur-xl transition group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 group-hover:scale-110 transition">
            <Globe size={22} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Instagram Handle</span>
            <span className="text-sm font-bold text-white">@official.ventureai</span>
          </div>
        </a>
      </div>
    </div>
  );
}