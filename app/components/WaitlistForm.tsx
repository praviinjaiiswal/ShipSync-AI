'use client';

import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function WaitlistForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    category: 'engineering',
    volume: '6-20',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to join waitlist');
      }

      setIsJoined(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isJoined) {
    return (
      <div className="py-8 text-center space-y-3">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h3 className="text-2xl font-bold text-navy-deep">You're On The Priority List!</h3>
        <p className="text-sm text-ocean-muted max-w-md mx-auto">
          We've reserved your early access spot. Our team will reach out with your exclusive onboarding invitation shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="wl-name" className="text-xs font-semibold">Your Name *</Label>
          <Input
            id="wl-name"
            placeholder="Rajesh Kumar"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wl-email" className="text-xs font-semibold">Business Email *</Label>
          <Input
            id="wl-email"
            type="email"
            placeholder="rajesh@exporter.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="wl-company" className="text-xs font-semibold">Company Name *</Label>
        <Input
          id="wl-company"
          placeholder="Apex Exports Pvt Ltd"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="wl-category" className="text-xs font-semibold">Export Sector</Label>
          <select
            id="wl-category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="engineering">Engineering & Auto Components</option>
            <option value="textiles">Textiles & Apparel</option>
            <option value="pharma">Pharmaceuticals</option>
            <option value="chemicals">Chemicals & Allied</option>
            <option value="agriculture">Agro & Food Products</option>
            <option value="other">Other Manufacturing</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="wl-volume" className="text-xs font-semibold">Monthly Shipments</Label>
          <select
            id="wl-volume"
            value={formData.volume}
            onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="1-5">1 - 5 shipments / month</option>
            <option value="6-20">6 - 20 shipments / month</option>
            <option value="21-50">21 - 50 shipments / month</option>
            <option value="50+">50+ shipments / month</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full gap-2 font-semibold text-sm">
        {isSubmitting ? 'Securing Access...' : 'Request Early Access'}
        <ArrowRight className="w-4 h-4" />
      </Button>
    </form>
  );
}
