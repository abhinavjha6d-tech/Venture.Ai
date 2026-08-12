"use client";

import React, { useState } from "react";
import { MessageSquare, Plus, History, FolderKanban, Info, HelpCircle, DollarSign, Mail, Menu, X, Search, ChevronRight } from "lucide-react";

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  chatHistory: { id: string; title: string }[];
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
}

export default function Sidebar({ currentView, setCurrentView, chatHistory, onNewChat, onSelectChat }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHistory = chatHistory.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-[#120F29] border border-purple-900/50 p-2.5 rounded-xl text-purple-300 shadow-lg"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Container */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-[#0c091d]/95 backdrop-blur-2xl border-r border-purple-900/40 p-4 flex flex-col transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 mb-6">
          <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain rounded-xl shadow-lg shadow-purple-600/30" />
          <div>
            <h1 className="text-base font-black tracking-wider bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-400 bg-clip-text text-transparent">
              VENTURE AI
            </h1>
            <p className="text-[8px] tracking-widest text-purple-400 font-semibold uppercase">STRATEGIC CO-PILOT</p>
          </div>
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => { onNewChat(); setCurrentView("chat"); }}
          className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 text-white font-semibold px-4 py-3 rounded-2xl transition shadow-lg shadow-purple-600/30 text-xs mb-4 group"
        >
          <span className="flex items-center gap-2">
            <Plus size={16} /> New Strategy Chat
          </span>
          <ChevronRight size={14} className="group-hover:translate-x-1 transition" />
        </button>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
          <input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a071e] border border-purple-900/50 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        {/* Navigation Menu */}
        <div className="space-y-1 mb-6 border-b border-purple-900/40 pb-4 text-xs font-medium">
          <button
            onClick={() => setCurrentView("chat")}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${currentView === "chat" ? "bg-purple-600/20 text-purple-300 border border-purple-500/30" : "text-gray-400 hover:text-white hover:bg-purple-950/30"}`}
          >
            <MessageSquare size={16} className="text-purple-400" /> Chat Workspace
          </button>
          <button
            onClick={() => setCurrentView("history")}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${currentView === "history" ? "bg-purple-600/20 text-purple-300 border border-purple-500/30" : "text-gray-400 hover:text-white hover:bg-purple-950/30"}`}
          >
            <History size={16} className="text-cyan-400" /> Strategy History
          </button>
          <button
            onClick={() => setCurrentView("projects")}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${currentView === "projects" ? "bg-purple-600/20 text-purple-300 border border-purple-500/30" : "text-gray-400 hover:text-white hover:bg-purple-950/30"}`}
          >
            <FolderKanban size={16} className="text-pink-400" /> Projects Vault
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-purple-900 mb-4">
          <p className="text-[10px] font-bold tracking-wider text-purple-400 uppercase px-3 mb-2">Recent Sessions</p>
          {filteredHistory.map((chat) => (
            <button
              key={chat.id}
              onClick={() => { onSelectChat(chat.id); setCurrentView("chat"); }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs text-gray-300 hover:bg-purple-950/40 hover:text-white truncate transition"
            >
              {chat.title}
            </button>
          ))}
        </div>

        {/* Footer Pages Navigation */}
        <div className="pt-3 border-t border-purple-900/40 space-y-1 text-xs">
          <button
            onClick={() => setCurrentView("about")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${currentView === "about" ? "bg-purple-600/20 text-purple-300" : "text-gray-400 hover:text-white"}`}
          >
            <Info size={15} className="text-indigo-400" /> About Us
          </button>
          <button
            onClick={() => setCurrentView("faq")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${currentView === "faq" ? "bg-purple-600/20 text-purple-300" : "text-gray-400 hover:text-white"}`}
          >
            <HelpCircle size={15} className="text-amber-400" /> FAQ
          </button>
          <button
            onClick={() => setCurrentView("pricing")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${currentView === "pricing" ? "bg-purple-600/20 text-purple-300" : "text-gray-400 hover:text-white"}`}
          >
            <DollarSign size={15} className="text-emerald-400" /> Pricing
          </button>
          <button
            onClick={() => setCurrentView("contact")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${currentView === "contact" ? "bg-purple-600/20 text-purple-300" : "text-gray-400 hover:text-white"}`}
          >
            <Mail size={15} className="text-rose-400" /> Contact Us
          </button>
        </div>

      </aside>
    </>
  );
}