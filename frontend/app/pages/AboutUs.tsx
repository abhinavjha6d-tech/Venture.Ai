import { Sparkles, Users, Rocket, ShieldCheck } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="bg-gradient-to-r from-purple-900/40 via-pink-900/20 to-indigo-900/40 border border-purple-800/50 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-2 text-purple-400 mb-3">
          <Sparkles size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">Our Genesis</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Empowering Startups with Next-Gen Intelligence</h2>
        <p className="text-gray-300 text-sm md:text-base leading-relaxed">
          Venture AI was founded by three visionary teenagers—<strong className="text-purple-300">Abhinav Jha</strong>, <strong className="text-pink-300">Dev Kamra</strong>, and <strong className="text-indigo-300">Anurag Gulati</strong>. United by a passion for technology and entrepreneurship, they set out to solve the critical gaps and decision-making bottlenecks faced by founders in the startup society.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#120F29]/90 border border-purple-900/50 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 font-bold">AJ</div>
          <h3 className="text-lg font-bold text-white mb-1">Abhinav Jha</h3>
          <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-3">Co-Founder & Developer</p>
          <p className="text-xs text-gray-400">Architecting core logic, AI pipelines, and seamless user experiences.</p>
        </div>

        <div className="bg-[#120F29]/90 border border-purple-900/50 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
          <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-4 font-bold">DK</div>
          <h3 className="text-lg font-bold text-white mb-1">Dev Kamra</h3>
          <p className="text-xs text-pink-400 font-semibold uppercase tracking-wider mb-3">Co-Founder & Strategist</p>
          <p className="text-xs text-gray-400">Driving market positioning, financial simulators, and growth telemetry.</p>
        </div>

        <div className="bg-[#120F29]/90 border border-purple-900/50 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 font-bold">AG</div>
          <h3 className="text-lg font-bold text-white mb-1">Anurag Gulati</h3>
          <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-3">Co-Founder & Visionary</p>
          <p className="text-xs text-gray-400">Refining product features and shaping futuristic co-pilot capabilities.</p>
        </div>
      </div>
    </div>
  );
}