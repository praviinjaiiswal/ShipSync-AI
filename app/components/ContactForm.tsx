'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: 'general',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to send message');
      }

      setSuccess(true);
      setFormData({ name: '', email: '', company: '', subject: 'general', message: '' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 text-center space-y-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
        <h3 className="text-xl font-bold text-slate-100">Message Sent!</h3>
        <p className="text-sm text-slate-400">
          Thank you for reaching out. Our compliance specialists will get back to you within 24 hours.
        </p>
        <Button variant="outline" onClick={() => setSuccess(false)}>
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="contactName" className="text-xs">Your Name *</Label>
          <Input
            id="contactName"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Rajesh Kumar"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactEmail" className="text-xs">Work Email *</Label>
          <Input
            id="contactEmail"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="rajesh@exporter.com"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="contactCompany" className="text-xs">Company Name</Label>
          <Input
            id="contactCompany"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="Apex Exports Ltd"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactSubject" className="text-xs">Subject</Label>
          <select
            id="contactSubject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="general">General Inquiry</option>
            <option value="partnership">Custom Enterprise & Partnership</option>
            <option value="media">Media & Press</option>
            <option value="support">Technical Support</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contactMessage" className="text-xs">Your Message *</Label>
        <textarea
          id="contactMessage"
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Tell us about your export operations or compliance questions..."
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/30 p-3 rounded-lg border border-rose-500/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
        <Send className="w-4 h-4" />
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
}
