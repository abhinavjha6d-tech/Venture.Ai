import { Sparkles, Check, Zap, Shield } from "lucide-react";

export default function Pricing() {
  return (
    <div className="max-w-4xl mx-auto text-center space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
          <Zap size={14} /> Future Roadmap
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-white">Advanced Tiers Are Coming Soon</h2>
        <p className="text-gray-400 text-sm mt-2 max-w-lg mx-auto">
          We are building cutting-edge predictive financial models, team collaboration workspaces, and autonomous agent features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-2xl mx-auto">
        <div className="bg-[#120F29]/90 border border-purple-900/50 rounded-3xl p-6 shadow-xl backdrop-blur-xl relative">
          <span className="absolute top-6 right-6 text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-full font-bold">CURRENT</span>
          <h3 className="text-xl font-bold text-white mb-1">Standard Core</h3>
          <p className="text-xs text-gray-400 mb-4">Essential co-pilot advisory for early founders.</p>
          <div className="text-3xl font-black text-white mb-6">₹0 <span className="text-xs text-gray-400 font-normal">/ forever free</span></div>
          <ul className="space-y-3 text-xs text-gray-300 mb-6">
            <li className="flex items-center gap-2"><Check size={14} className="text-purple-400" /> Unlimited strategy chat</li>
            <li className="flex items-center gap-2"><Check size={14} className="text-purple-400" /> Basic financial simulator</li>
            <li className="flex items-center gap-2"><Check size={14} className="text-purple-400" /> File & image analysis</li>
          </ul>
        </div>

        <div className="bg-gradient-to-b from-purple-950/60 to-[#120F29] border border-pink-500/40 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-pink-500 text-white text-[9px] font-black tracking-widest px-4 py-1 rounded-bl-2xl uppercase">COMING SOON</div>
          <h3 className="text-xl font-bold text-white mb-1">Venture Pro AI</h3>
          <p className="text-xs text-purple-300 mb-4">Autonomous intelligence & deep market telemetry.</p>
          <div className="text-3xl font-black text-white mb-6">TBD <span className="text-xs text-pink-300 font-normal">/ launching soon</span></div>
          <ul className="space-y-3 text-xs text-gray-200 mb-6">
            <li className="flex items-center gap-2"><Check size={14} className="text-pink-400" /> Multi-agent startup advisor</li>
            <li className="flex items-center gap-2"><Check size={14} className="text-pink-400" /> Advanced predictive valuation</li>
            <li className="flex items-center gap-2"><Check size={14} className="text-pink-400" /> Priority neural processing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}