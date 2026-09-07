'use client';

import React, { useState } from 'react';
import { KeyRound, ArrowRight, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface JoinCompanyFormProps {
  onSubmit: (token: string) => Promise<void>;
  isLoading: boolean;
}

export function JoinCompanyForm({ onSubmit, isLoading }: JoinCompanyFormProps) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please enter your invitation token or link');
      return;
    }
    setError('');
    // Extract token if user pasted full URL
    let cleanToken = token.trim();
    if (cleanToken.includes('token=')) {
      cleanToken = cleanToken.split('token=')[1].split('&')[0];
    }
    await onSubmit(cleanToken);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-primary font-medium text-sm">
          <Users2 className="w-4 h-4" />
          <span>Join Existing Workspace</span>
        </div>
        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Join with Invitation
        </h3>
        <p className="text-xs text-slate-500">
          If your team administrator sent you an invitation token or link, paste it below to link your account.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="inviteToken" className="text-xs font-semibold">
            Invitation Token or URL <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              id="inviteToken"
              placeholder="Paste invitation token here"
              className="pl-9 font-mono text-xs"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setError('');
              }}
              required
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full gap-2 text-sm font-semibold" disabled={isLoading}>
        {isLoading ? 'Verifying Invite...' : 'Join Company'}
        <ArrowRight className="w-4 h-4" />
      </Button>
    </form>
  );
}
