import React from 'react';

// Generates an inline SVG data URI avatar with initials matching the exact person's name
function getInitialsSvgDataUri(name) {
  const initials = (name || 'A')
    .split(' ')
    .map(w => w.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="100%" height="100%" fill="#1e293b"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#f43f5e" font-family="sans-serif" font-size="75" font-weight="bold">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function ProfileCard({ profile, onSelect, onStartDate, isSelected }) {
  const fallbackSvg = getInitialsSvgDataUri(profile.name);

  return (
    <div 
      className={`group relative rounded-2xl border transition-all duration-300 p-5 cursor-pointer backdrop-blur-md overflow-hidden ${
        isSelected 
          ? 'border-pink-500/80 bg-slate-900/90 shadow-lg shadow-pink-500/20 ring-2 ring-pink-500/40' 
          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80'
      }`}
      onClick={() => onSelect && onSelect(profile)}
    >
      <div className="flex items-start gap-4">
        <img 
          src={profile.avatar || fallbackSvg} 
          alt={profile.name} 
          className="w-16 h-16 rounded-xl object-cover border border-slate-700/80 shadow-md group-hover:scale-105 transition-transform duration-300 bg-slate-800"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallbackSvg;
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white truncate">{profile.name}</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20 whitespace-nowrap">
              {profile.matchVibe}
            </span>
          </div>
          <p className="text-xs text-slate-400 truncate mt-0.5">{profile.tagline}</p>

          <div className="flex gap-3 mt-2 text-xs text-slate-400">
            <a 
              href={profile.linkedin} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
            >
              LinkedIn ↗
            </a>
            <a 
              href={profile.instagram} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1"
            >
              Instagram ↗
            </a>
          </div>
        </div>
      </div>

      {/* Needs, Hobbies, Interests tags */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
        <div>
          <span className="text-slate-500 font-medium">Needs:</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {profile.needs?.map((need, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/50">
                {need}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span className="text-slate-500 font-medium">Hobbies & Interests:</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {profile.hobbies?.concat(profile.interests || []).slice(0, 4).map((item, idx) => (
              <span key={idx} className="px-2.5 py-0.5 rounded-md bg-pink-950/40 text-pink-300 border border-pink-900/30">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(profile);
          }}
          className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
        >
          View Agent Analysis
        </button>
        {onStartDate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartDate(profile);
            }}
            className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-md shadow-pink-500/20 transition-all"
          >
            Date this Agent 💕
          </button>
        )}
      </div>
    </div>
  );
}
