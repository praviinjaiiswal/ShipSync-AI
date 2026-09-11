"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Ship } from "lucide-react";
import { WaitlistForm } from "./WaitlistForm";

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-border shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close waitlist modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-ocean-deep/10 text-ocean-deep flex items-center justify-center">
            <Ship className="w-5 h-5 text-ocean-deep" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-ocean-deep bg-ocean-deep/10 px-2.5 py-1 rounded-full">
            Early Access
          </span>
        </div>

        <h3 className="font-heading text-2xl font-bold text-navy-deep dark:text-white mb-2">
          Join the ShipSync AI Waitlist
        </h3>
        <p className="text-sm text-ocean-muted mb-6">
          Get priority onboarding to automated DGFT filings, tariff tracking, and statutory compliance intelligence.
        </p>

        <WaitlistForm />
      </div>
    </div>
  );
}
