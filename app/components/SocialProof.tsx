import React from "react";

export function SocialProof() {
  // Fix: Strictly static array. NO Math.random() allowed here.
  const avatars = [
    { bg: "bg-blue-100 text-blue-700", letter: "A" },
    { bg: "bg-emerald-100 text-emerald-700", letter: "P" },
    { bg: "bg-amber-100 text-amber-700", letter: "M" },
    { bg: "bg-purple-100 text-purple-700", letter: "V" },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 animate-fade-in">
      {/* Avatar Group */}
      <div className="flex -space-x-3">
        {avatars.map((avatar, i) => (
          <div
            key={i}
            className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold shadow-sm ${avatar.bg}`}
          >
            {avatar.letter}
          </div>
        ))}
      </div>

      {/* Text & Live Indicator */}
      <div className="flex flex-col items-center sm:items-start text-sm">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-navy-deep">
            Join 200+ Indian exporters
          </span>
        </div>
        <span className="text-ocean-muted">already on the priority waitlist.</span>
      </div>
    </div>
  );
}