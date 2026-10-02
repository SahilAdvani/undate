import React from 'react';

export default function RankingMatrix({ targetPerson, rankings, onSelectCandidate, onStartDate }) {
  if (!targetPerson || !rankings || rankings.length === 0) return null;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-pink-400">Agentic Dating Report</span>
          <h2 className="text-2xl font-black text-white mt-1">
            Top Compatibility Rankings for <span className="text-pink-400">{targetPerson.name}</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Agent synthesized rankings based on Instagram & LinkedIn profile cross-analysis.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
          <img src={targetPerson.avatar} alt={targetPerson.name} className="w-10 h-10 rounded-full object-cover border border-pink-500/80" />
          <div>
            <div className="text-xs font-bold text-white">{targetPerson.name}</div>
            <div className="text-xs text-pink-400">{targetPerson.matchVibe}</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {rankings.map((rankItem, index) => {
          const { candidate, score, summary, highlights } = rankItem;
          const isTop3 = index < 3;

          return (
            <div 
              key={candidate.id} 
              className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-2xl border transition-all duration-300 gap-4 ${
                index === 0 
                  ? 'bg-gradient-to-r from-pink-950/30 via-slate-900 to-slate-900 border-pink-500/60 shadow-lg shadow-pink-500/10' 
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-amber-500 text-slate-950 shadow-md' :
                  index === 1 ? 'bg-slate-300 text-slate-950' :
                  index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  #{index + 1}
                </div>

                <img src={candidate.avatar} alt={candidate.name} className="w-12 h-12 rounded-xl object-cover border border-slate-700" />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-base truncate">{candidate.name}</h4>
                    <span className="text-xs text-slate-400 font-medium hidden sm:inline">• {candidate.matchVibe}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate max-w-md mt-0.5">{summary}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800/80">
                <div className="text-right">
                  <div className="text-lg font-black text-pink-400">{score}%</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Match Score</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectCandidate(candidate)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  >
                    Analysis
                  </button>
                  <button
                    onClick={() => onStartDate(targetPerson, candidate)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-md transition-all"
                  >
                    Simulate Date 💕
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
