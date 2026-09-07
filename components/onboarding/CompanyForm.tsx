'use client';

import React, { useState } from 'react';
import { Building2, FileText, MapPin, Hash, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CompanyFormProps {
  onSubmit: (data: {
    name: string;
    gstNumber?: string;
    ieCode?: string;
    panNumber?: string;
    address?: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export function CompanyForm({ onSubmit, isLoading }: CompanyFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    gstNumber: '',
    ieCode: '',
    panNumber: '',
    address: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.length < 2) {
      newErrors.name = 'Company name is required (min 2 characters)';
    }
    if (formData.gstNumber) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(formData.gstNumber.trim().toUpperCase())) {
        newErrors.gstNumber = 'Valid 15-character GSTIN required (e.g., 27AAPFU0939F1ZV)';
      }
    }
    if (formData.ieCode) {
      const iecRegex = /^[0-9]{10}$/;
      if (!iecRegex.test(formData.ieCode.trim())) {
        newErrors.ieCode = 'IEC must be exactly 10 digits';
      }
    }
    if (formData.panNumber) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(formData.panNumber.trim().toUpperCase())) {
        newErrors.panNumber = 'Valid 10-character PAN required (e.g., ABCDE1234F)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      name: formData.name.trim(),
      gstNumber: formData.gstNumber.trim().toUpperCase() || undefined,
      ieCode: formData.ieCode.trim() || undefined,
      panNumber: formData.panNumber.trim().toUpperCase() || undefined,
      address: formData.address.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-primary font-medium text-sm">
          <Building2 className="w-4 h-4" />
          <span>Organization Profile</span>
        </div>
        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Register Your Export Company
        </h3>
        <p className="text-xs text-slate-500">
          Set up your organization to activate export compliance, HS code automation, and DGFT benefit tracking.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="companyName" className="text-xs font-semibold">
            Company / Entity Name <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              id="companyName"
              placeholder="e.g. Apex Precision Exports Pvt Ltd"
              className="pl-9 text-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="gstNumber" className="text-xs font-semibold">
              GSTIN (15 Digits)
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="gstNumber"
                placeholder="27AAPFU0939F1ZV"
                maxLength={15}
                className="pl-9 uppercase font-mono text-xs"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
              />
            </div>
            {errors.gstNumber && <p className="text-xs text-red-500">{errors.gstNumber}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ieCode" className="text-xs font-semibold">
              Import Export Code (IEC)
            </Label>
            <div className="relative">
              <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="ieCode"
                placeholder="0388012345 (10 digits)"
                maxLength={10}
                className="pl-9 font-mono text-xs"
                value={formData.ieCode}
                onChange={(e) => setFormData({ ...formData, ieCode: e.target.value })}
              />
            </div>
            {errors.ieCode && <p className="text-xs text-red-500">{errors.ieCode}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="panNumber" className="text-xs font-semibold">
            Company PAN
          </Label>
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              id="panNumber"
              placeholder="AAPFU0939F"
              maxLength={10}
              className="pl-9 uppercase font-mono text-xs"
              value={formData.panNumber}
              onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
            />
          </div>
          {errors.panNumber && <p className="text-xs text-red-500">{errors.panNumber}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address" className="text-xs font-semibold">
            Registered Business Address
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              id="address"
              placeholder="Plot 42, MIDC Industrial Area, Pune, Maharashtra 411019"
              className="pl-9 text-sm"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full gap-2 text-sm font-semibold" disabled={isLoading}>
        {isLoading ? 'Creating Company...' : 'Continue to Profile'}
        <ArrowRight className="w-4 h-4" />
      </Button>
    </form>
  );
}
