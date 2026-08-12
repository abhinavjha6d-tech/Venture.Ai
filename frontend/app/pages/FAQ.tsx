import { ShieldCheck, HelpCircle, Lock, Cpu } from "lucide-react";

export default function FAQ() {
  const faqs = [
    {
      q: "Is my startup data secure and private?",
      a: "Yes, absolutely! All your startup documents, financial telemetry, and chat interactions are fully encrypted with end-to-end security protocols. We maintain a strict zero-tolerance policy against notorious use, data selling, or unauthorized third-party sharing."
    },
    {
      q: "How does Venture AI act as a decision partner?",
      a: "Venture AI combines advanced language models with live unit economic simulators (MRR, CAC, ARPU) to deliver real-time, context-aware co-founder advice and strategic roadmaps."
    },
    {
      q: "Can I upload PDFs, financial sheets, and voice notes?",
      a: "Yes! You can seamlessly attach PDFs, pitch deck images, data sheets, or record voice notes directly in the workspace for instant AI analysis."
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
          <HelpCircle size={14} /> Knowledge Base
        </div>
        <h2 className="text-3xl font-black text-white">Frequently Asked Questions</h2>
        <p className="text-gray-400 text-xs mt-1">Everything you need to know about security, privacy, and features.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-[#120F29]/90 border border-purple-900/50 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
              {faq.q}
            </h3>
            <p className="text-xs md:text-sm text-gray-300 leading-relaxed pl-4 border-l border-purple-900/50">
              {faq.a}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}