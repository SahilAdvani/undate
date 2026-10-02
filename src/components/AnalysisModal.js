import React from 'react';

export default function AnalysisModal({ profile, onClose, onStartDate }) {
  if (!profile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl p-6 md:p-8 flex flex-col max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <img src={profile.avatar} alt={profile.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-700 shadow-md" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">{profile.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20">
                  {profile.matchVibe}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{profile.tagline}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Source Analysis Links */}
        <div className="py-4 border-b border-slate-800/80 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Sources Analyzed (2/2):</span>
          </div>
          <div className="flex gap-4">
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              Official LinkedIn ↗
            </a>
            <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
              Public Instagram ↗
            </a>
          </div>
        </div>

        {/* Agent Extracted Breakdown */}
        <div className="py-6 space-y-6">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400 mb-2">Agent Persona Summary</h4>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
              {profile.bio}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Core Needs & Values</h5>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {profile.needs.map((need, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-pink-400 mt-0.5">•</span>
                    <span>{need}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Hobbies & Interests</h5>
              <div className="flex flex-wrap gap-1.5">
                {profile.hobbies.concat(profile.interests).map((item, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-pink-950/40 text-pink-300 border border-pink-900/30 text-xs">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
              <h5 className="text-slate-500 font-semibold mb-1">Personality Profile:</h5>
              <p className="text-slate-300 font-medium">{profile.personality}</p>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
              <h5 className="text-slate-500 font-semibold mb-1">Preferred Dating Style:</h5>
              <p className="text-pink-300 font-medium">{profile.datingStyle}</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Close Analysis
          </button>
          {onStartDate && (
            <button
              onClick={() => {
                onClose();
                onStartDate(profile);
              }}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-lg shadow-pink-500/20 transition-all"
            >
              Simulate Date 💕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
