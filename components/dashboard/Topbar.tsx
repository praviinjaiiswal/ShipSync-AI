"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { Menu, Search, Bell, Sun, Moon } from "lucide-react";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex items-center gap-3 flex-1">
        <button
          className="md:hidden p-1 text-muted-foreground hover:text-foreground"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative hidden sm:block max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search shipments, documents..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted rounded-md border border-transparent focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted" aria-label="Notifications">
          <Bell className="w-5 h-5" />
        </button>

        {mounted && (
          <button
            className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        )}

        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}