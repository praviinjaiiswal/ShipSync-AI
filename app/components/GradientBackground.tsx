'use client';

import React from 'react';

export function GradientBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-500/10 dark:bg-blue-600/15 blur-[120px] rounded-full" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[400px] bg-indigo-500/10 dark:bg-indigo-600/10 blur-[140px] rounded-full" />
      <div className="absolute bottom-0 left-10 w-[600px] h-[400px] bg-cyan-500/10 dark:bg-cyan-600/10 blur-[130px] rounded-full" />
    </div>
  );
}
