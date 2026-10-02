import React, { useState, useEffect } from 'react';
import { simulateAgentDate } from '../lib/datingEngine';

export default function AgentDateArena({ person1, person2, onClose }) {
  const [session, setSession] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoadingAgent, setIsLoadingAgent] = useState(false);

  useEffect(() => {
    async function loadDateSession() {
      if (person1 && person2) {
        setIsLoadingAgent(true);
        try {
          // Attempt Groq AI Agent live date harness
          const res = await fetch('/api/agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'simulate_date', agent1: person1, agent2: person2 })
          });
          const data = await res.json();
          if (data.success && data.dateSession) {
            setSession({
              person1,
              person2,
              ...data.dateSession
            });
          } else {
            // Local dynamic fallback harness
            setSession(simulateAgentDate(person1, person2));
          }
        } catch (err) {
          console.error("Failed to load Groq Agent date, using fallback:", err);
          setSession(simulateAgentDate(person1, person2));
        } finally {
          setIsLoadingAgent(false);
          setCurrentStep(0);
          setIsPlaying(true);
        }
      }
    }
    loadDateSession();
  }, [person1, person2]);

  useEffect(() => {
    let timer;
    if (isPlaying && session && session.dialogue && currentStep < session.dialogue.length - 1) {
      timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 2500);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, session]);

  if (!person1 || !person2) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl p-6 md:p-8 flex flex-col max-h-[90vh]">
        
        {/* Header with Profiles & Match Score */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img src={person1.avatar} alt={person1.name} className="w-12 h-12 rounded-full border-2 border-pink-500/80 object-cover" />
            <div>
              <h4 className="font-bold text-white text-sm md:text-base">{person1.name}</h4>
              <p className="text-xs text-pink-400">Agent Alpha</p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-500/20 text-pink-400 border border-pink-500/30 animate-pulse">
              {isLoadingAgent ? 'GROQ AGENT HARNESS THINKING...' : 'LIVE AGENT DATE'}
            </span>
            {session && (
              <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 mt-1">
                {session.score}% Match
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <h4 className="font-bold text-white text-sm md:text-base">{person2.name}</h4>
              <p className="text-xs text-purple-400">Agent Beta</p>
            </div>
            <img src={person2.avatar} alt={person2.name} className="w-12 h-12 rounded-full border-2 border-purple-500/80 object-cover" />
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoadingAgent && (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3 text-slate-400 text-xs font-semibold">
              <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
              <span>AI Agents Orchestrating Live Date Dialogue...</span>
            </div>
          </div>
        )}

        {/* Real-time Dialogue Feed */}
        {!isLoadingAgent && session && session.dialogue && (
          <div className="flex-1 overflow-y-auto py-6 space-y-4 pr-2">
            {session.dialogue.slice(0, currentStep + 1).map((msg, index) => {
              const isPerson1 = msg.speaker === person1.name;
              return (
                <div 
                  key={index} 
                  className={`flex gap-3 items-start animate-in slide-in-from-bottom-2 duration-300 ${isPerson1 ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <img src={msg.avatar || (isPerson1 ? person1.avatar : person2.avatar)} alt={msg.speaker} className="w-9 h-9 rounded-full object-cover border border-slate-700 mt-1" />
                  <div 
                    className={`max-w-[75%] p-4 rounded-2xl text-sm ${
                      isPerson1 
                        ? 'bg-pink-950/40 border border-pink-800/40 text-pink-100 rounded-tl-none' 
                        : 'bg-purple-950/40 border border-purple-800/40 text-purple-100 rounded-tr-none'
                    }`}
                  >
                    <p className="text-xs font-semibold mb-1 opacity-75">{msg.speaker}&apos;s Agent</p>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Highlights & Controls */}
        {!isLoadingAgent && session && (
          <div className="pt-4 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2 text-xs">
              {session.highlights?.map((h, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  ✨ {h}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                {isPlaying ? 'Pause Date ⏸' : 'Resume Date ▶'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-pink-600 hover:bg-pink-500 text-white transition-colors"
              >
                Close Arena
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
