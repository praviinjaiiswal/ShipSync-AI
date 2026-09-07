'use client';

import React, { useState } from 'react';
import { User, Phone, Briefcase, Camera, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileFormProps {
  initialName?: string;
  onSubmit: (data: {
    name: string;
    phone?: string;
    designation?: string;
    profileImageUrl?: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export function ProfileForm({ initialName = '', onSubmit, isLoading }: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, or WebP images are allowed');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      // Step 1: Request signed upload url
      const res = await fetch('/api/profile/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to get upload URL');
      }

      if (data.uploadUrl) {
        // Step 2: Upload directly to Supabase storage signed url
        await fetch(data.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        setAvatarUrl(data.uploadUrl.split('?')[0]);
      } else {
        // Local preview fallback
        setAvatarUrl(URL.createObjectURL(file));
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.length < 2) {
      setError('Name is required (min 2 characters)');
      return;
    }
    setError('');

    await onSubmit({
      name: name.trim(),
      phone: phone.trim() || undefined,
      designation: designation.trim() || undefined,
      profileImageUrl: avatarUrl || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-primary font-medium text-sm">
          <User className="w-4 h-4" />
          <span>Personal Information</span>
        </div>
        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Complete Your Profile
        </h3>
        <p className="text-xs text-slate-500">
          This information will be displayed on shipment documents, team audit logs, and compliance filings.
        </p>
      </div>

      {/* Avatar Picker */}
      <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="relative h-16 w-16 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center border-2 border-slate-300 dark:border-slate-700">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <User className="h-8 w-8 text-slate-400" />
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs text-white">
              Uploading...
            </div>
          )}
        </div>
        <div className="flex-1 space-y-1">
          <label
            htmlFor="avatar-upload"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shadow-sm transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            Upload Photo
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <p className="text-[11px] text-slate-400">JPG, PNG or WebP under 2MB</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-xs font-semibold">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              id="fullName"
              placeholder="e.g. Rajesh Sharma"
              className="pl-9 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs font-semibold">
            Phone / WhatsApp Number
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              id="phone"
              placeholder="+91 98765 43210"
              className="pl-9 text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="designation" className="text-xs font-semibold">
            Job Title / Designation
          </Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              id="designation"
              placeholder="e.g. Export Compliance Manager"
              className="pl-9 text-sm"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Button type="submit" className="w-full gap-2 text-sm font-semibold" disabled={isLoading || isUploading}>
        {isLoading ? 'Saving Profile...' : 'Complete Setup & Go to Dashboard'}
        <CheckCircle2 className="w-4 h-4" />
      </Button>
    </form>
  );
}
