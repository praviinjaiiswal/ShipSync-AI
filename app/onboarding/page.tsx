'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Building2, Users2, UserCheck, Ship } from 'lucide-react';
import { CompanyForm } from '@/components/onboarding/CompanyForm';
import { JoinCompanyForm } from '@/components/onboarding/JoinCompanyForm';
import { ProfileForm } from '@/components/onboarding/ProfileForm';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

type OnboardingTab = 'create' | 'join';
type Step = 'company' | 'profile';

export default function OnboardingPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<OnboardingTab>('create');
  const [currentStep, setCurrentStep] = useState<Step>('company');
  const [isLoading, setIsLoading] = useState(false);

  // Check if user already has an active company
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.user?.companyId && data.user?.onboardingComplete) {
            router.push('/dashboard');
          }
        }
      } catch (err) {
        console.error('Failed to check profile status', err);
      }
    }
    if (isLoaded && clerkUser) {
      checkStatus();
    }
  }, [isLoaded, clerkUser, router]);

  const handleCreateCompany = async (companyData: {
    name: string;
    gstNumber?: string;
    ieCode?: string;
    panNumber?: string;
    address?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE',
          company: companyData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to create organization');
      }

      success('Organization registered successfully!');
      setCurrentStep('profile');
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCompany = async (inviteToken: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'JOIN',
          inviteToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Invalid or expired invitation token');
      }

      success(`Successfully joined ${data.company?.name || 'the team'}!`);
      setCurrentStep('profile');
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (profileData: {
    name: string;
    phone?: string;
    designation?: string;
    profileImageUrl?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to save profile');
      }

      success('Setup complete! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 800);
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center p-4 md:p-8">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
          <Ship className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            ShipSync <span className="text-blue-600">AI</span>
          </h1>
          <p className="text-xs text-slate-500">Autonomous Export Compliance Platform</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xl p-6 md:p-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                currentStep === 'company'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-emerald-500 text-white'
              )}
            >
              1
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Organization</div>
              <div className="text-[11px] text-slate-400">Create or join workspace</div>
            </div>
          </div>

          <div className="h-0.5 w-12 bg-slate-200 dark:bg-slate-700" />

          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                currentStep === 'profile'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              )}
            >
              2
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Profile</div>
              <div className="text-[11px] text-slate-400">Personal details & avatar</div>
            </div>
          </div>
        </div>

        {/* Step 1: Company (Create vs Join) */}
        {currentStep === 'company' && (
          <div className="space-y-6">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all',
                  activeTab === 'create'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                )}
              >
                <Building2 className="w-3.5 h-3.5" />
                Register New Exporter
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('join')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all',
                  activeTab === 'join'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                )}
              >
                <Users2 className="w-3.5 h-3.5" />
                Join with Invite Code
              </button>
            </div>

            {activeTab === 'create' ? (
              <CompanyForm onSubmit={handleCreateCompany} isLoading={isLoading} />
            ) : (
              <JoinCompanyForm onSubmit={handleJoinCompany} isLoading={isLoading} />
            )}
          </div>
        )}

        {/* Step 2: Personal Profile */}
        {currentStep === 'profile' && (
          <ProfileForm
            initialName={clerkUser?.fullName || ''}
            onSubmit={handleSaveProfile}
            isLoading={isLoading}
          />
        )}
      </div>

      <div className="mt-8 text-center text-xs text-slate-400">
        Need assistance? Contact our compliance support at <span className="underline">support@shipsync.ai</span>
      </div>
    </div>
  );
}
