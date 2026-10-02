'use client';

import React, { useState, useEffect } from 'react';
import profilesData from '../data/profiles.json';
import ProfileCard from '../components/ProfileCard';
import AgentDateArena from '../components/AgentDateArena';
import RankingMatrix from '../components/RankingMatrix';
import AnalysisModal from '../components/AnalysisModal';
import { calculateRankingsForPerson } from '../lib/datingEngine';

export default function Home() {
  const [profiles, setProfiles] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [activeDatePair, setActiveDatePair] = useState(null);
  const [rankingsTarget, setRankingsTarget] = useState(null);

  // Input states for custom link submission
  const [linkedinInput, setLinkedinInput] = useState('');
  const [instagramInput, setInstagramInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analyze initial 25 verified profile links on startup
  const initProfiles = async () => {
    setIsInitializing(true);
    try {
      const analyzedList = await Promise.all(
        profilesData.slice(0, 25).map(async (p) => {
          try {
            const res = await fetch('/api/agent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'analyze_person', personMeta: p, linkedinUrl: p.linkedin, instagramUrl: p.instagram })
            });
            const data = await res.json();
            return data.agent || {
              ...p,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=f43f5e&color=fff&size=512`,
              needs: ["Intellectual alignment", "Shared vision", "Authenticity"],
              hobbies: ["Tech innovation", "Travel", "Wellness"],
              interests: ["Leadership", "Growth", "Culture"],
              personality: "Driven, articulate, strategic",
              datingStyle: "Coffee discussion on long-term vision",
              matchVibe: "Visionary & Direct"
            };
          } catch {
            return {
              ...p,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=f43f5e&color=fff&size=512`,
              needs: ["Intellectual alignment", "Shared vision", "Authenticity"],
              hobbies: ["Tech innovation", "Travel", "Wellness"],
              interests: ["Leadership", "Growth", "Culture"],
              personality: "Driven, articulate, strategic",
              datingStyle: "Coffee discussion on long-term vision",
              matchVibe: "Visionary & Direct"
            };
          }
        })
      );
      setProfiles(analyzedList);
      setRankingsTarget(analyzedList[0]);
    } catch (err) {
      console.error("Init profiles error:", err);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    initProfiles();
  }, []);

  // Handle memory refresh action
  const handleRefreshMemory = async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_memory' })
      });
      await initProfiles();
    } catch (err) {
      console.error("Refresh memory error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Compute rankings for selected target person
  const currentRankings = rankingsTarget 
    ? calculateRankingsForPerson(rankingsTarget, profiles) 
    : [];

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!linkedinInput || !instagramInput) return;

    setIsAnalyzing(true);
    try {
      const extractName = (url) => {
        try {
          const parts = new URL(url).pathname.split('/').filter(Boolean);
          return parts[parts.length - 1].replace(/[-_.]/g, ' ') || 'New Agent';
        } catch { return 'New Agent'; }
      };

      const customName = extractName(linkedinInput);
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_person',
          personMeta: { name: customName, tagline: 'Custom Profile Agent' },
          linkedinUrl: linkedinInput,
          instagramUrl: instagramInput
        })
      });

      const data = await res.json();
      if (data.success && data.agent) {
        const newAgent = data.agent;
        setProfiles(prev => [newAgent, ...prev]);
        setRankingsTarget(newAgent);
        setSelectedProfile(newAgent);
        setLinkedinInput('');
        setInstagramInput('');
      }
    } catch (err) {
      console.error("Error analyzing custom links:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartRandomDate = () => {
    if (profiles.length < 2) return;
    const p1 = profiles[Math.floor(Math.random() * profiles.length)];
    let p2 = profiles[Math.floor(Math.random() * profiles.length)];
    while (p2.id === p1.id) {
      p2 = profiles[Math.floor(Math.random() * profiles.length)];
    }
    setActiveDatePair({ p1, p2 });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center font-black text-xl shadow-lg shadow-pink-500/30">
              U
            </div>
            <div>
              <h1 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
                UnDate <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 font-medium">Apify + Groq + Redis + Mem0</span>
              </h1>
              <p className="text-xs text-slate-400">Strictly 2 Sources: LinkedIn & Public Instagram Profiles</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshMemory}
              disabled={isRefreshing || isInitializing}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              🔄 {isRefreshing ? 'Re-scraping Apify...' : 'Reset Memory & Re-Scrape'}
            </button>
            <button
              onClick={handleStartRandomDate}
              disabled={profiles.length < 2}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-lg shadow-pink-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              ⚡ Watch AI Agents Date Live
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-12">

        {/* Hero & Link Scraper Section */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-8 md:p-12 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-xs font-semibold text-pink-400">
              <span>🤖 Apify Scrapers + Groq AI Agents + Redis & Mem0 Store</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Real AI Agents Dating <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400">
                On Behalf of Real People
              </span>
            </h2>
            <p className="text-base text-slate-300 leading-relaxed">
              Every person is represented by an autonomous AI agent created strictly from two official sources: 
              their <strong className="text-white">LinkedIn</strong> and public <strong className="text-white">Instagram</strong>. The agents read, analyze needs/hobbies/interests, go out on dates, and generate compatibility rankings.
            </p>

            {/* URL Input Form */}
            <form onSubmit={handleCustomSubmit} className="pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <input
                type="url"
                required
                placeholder="LinkedIn Profile URL..."
                value={linkedinInput}
                onChange={(e) => setLinkedinInput(e.target.value)}
                className="px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
              />
              <input
                type="url"
                required
                placeholder="Public Instagram URL..."
                value={instagramInput}
                onChange={(e) => setInstagramInput(e.target.value)}
                className="px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
              />
              <button
                type="submit"
                disabled={isAnalyzing}
                className="px-6 py-3 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-lg shadow-pink-500/25 transition-all disabled:opacity-50"
              >
                {isAnalyzing ? 'Apify Scraping & AI Profiling...' : 'Analyze & Deploy Agent 🚀'}
              </button>
            </form>
          </div>
        </section>

        {/* Loading State for initial profile analysis */}
        {(isInitializing || isRefreshing) && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 text-xs font-semibold">
            <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
            <span>
              {isRefreshing ? 'Clearing Memory & Re-scraping Apify Profiles...' : 'AI Agents Analyzing 25 Real LinkedIn & Instagram Profiles via Apify...'}
            </span>
          </div>
        )}

        {/* Dynamic Compatibility Rankings Section */}
        {!isInitializing && !isRefreshing && rankingsTarget && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                🏆 AI Compatibility Rankings Matrix
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Select person to view rankings:</span>
                <select
                  value={rankingsTarget?.id || ''}
                  onChange={(e) => {
                    const target = profiles.find(p => p.id === e.target.value);
                    setRankingsTarget(target);
                  }}
                  className="bg-slate-900 border border-slate-800 text-xs text-pink-400 font-semibold rounded-xl px-3 py-1.5 focus:outline-none"
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <RankingMatrix 
              targetPerson={rankingsTarget}
              rankings={currentRankings}
              onSelectCandidate={(candidate) => setSelectedProfile(candidate)}
              onStartDate={(p1, p2) => setActiveDatePair({ p1, p2 })}
            />
          </section>
        )}

        {/* 25 Real Profiles Roster */}
        {!isInitializing && !isRefreshing && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-white">Real Analyzed Profiles ({profiles.length})</h3>
                <p className="text-xs text-slate-400 mt-1">Each profile built strictly from public LinkedIn & Instagram URLs.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((profile) => (
                <ProfileCard 
                  key={profile.id}
                  profile={profile}
                  isSelected={rankingsTarget?.id === profile.id}
                  onSelect={(p) => {
                    setSelectedProfile(p);
                    setRankingsTarget(p);
                  }}
                  onStartDate={(p) => {
                    const candidate = profiles.find(item => item.id !== p.id);
                    setActiveDatePair({ p1: p, p2: candidate });
                  }}
                />
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-6 text-center text-xs text-slate-500">
        <p>UnDate Agentic Dating Platform • Powered by Apify Scrapers, Groq AI Agents, Upstash Redis & Mem0</p>
      </footer>

      {/* Modals & Overlays */}
      {selectedProfile && (
        <AnalysisModal 
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onStartDate={(p) => {
            const candidate = profiles.find(item => item.id !== p.id);
            setActiveDatePair({ p1: p, p2: candidate });
          }}
        />
      )}

      {activeDatePair && (
        <AgentDateArena 
          person1={activeDatePair.p1}
          person2={activeDatePair.p2}
          onClose={() => setActiveDatePair(null)}
        />
      )}

    </div>
  );
}
