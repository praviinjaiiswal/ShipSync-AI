'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Mail, Shield, Trash2, Copy, Check, Clock, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['ADMIN', 'COMPLIANCE_OFFICER', 'OPS_EXECUTIVE', 'VIEWER']),
});
type InviteFormData = z.infer<typeof inviteSchema>;

const INVITABLE_ROLES = [
  { value: 'ADMIN', label: 'Admin (Full management except ownership)' },
  { value: 'COMPLIANCE_OFFICER', label: 'Compliance Officer (Approvals & Audits)' },
  { value: 'OPS_EXECUTIVE', label: 'Operations Executive (Create shipments)' },
  { value: 'VIEWER', label: 'Viewer (Read-only access)' },
];

const ALL_ROLES = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'COMPLIANCE_OFFICER', label: 'Compliance Officer' },
  { value: 'OPS_EXECUTIVE', label: 'Operations Executive' },
  { value: 'VIEWER', label: 'Viewer' },
];

type Member = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  designation?: string | null;
  profileImageUrl?: string | null;
  createdAt: string;
};

type Invite = {
  id: string;
  email: string;
  role: string;
  token?: string;
  createdAt: string;
  expiresAt: string;
};

export function TeamSection() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [currentUserRole, setCurrentRole] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { success, error, info } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'OPS_EXECUTIVE' },
  });

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/team');
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members ?? []);
        setInvites(data.pendingInvites ?? []);
        setCanManage(data.isOwnerOrAdmin ?? false);
        setCurrentRole(data.currentUserRole ?? '');
        setCurrentUserId(data.currentUserId ?? '');
      }
    } catch {
      error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const onInvite = async (data: InviteFormData) => {
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData?.error?.message || 'Failed to send invite');
      }

      success(`Invitation sent to ${data.email}`);
      reset({ email: '', role: 'OPS_EXECUTIVE' });
      fetchTeam();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Error sending invitation');
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/team/${targetUserId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData?.error?.message || 'Failed to change role');
      }

      success('Member role updated successfully');
      fetchTeam();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleRemoveMember = async (targetUserId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the organization?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/team/${targetUserId}`, {
        method: 'DELETE',
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData?.error?.message || 'Failed to remove member');
      }

      success(`${memberName} has been removed`);
      fetchTeam();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const copyInviteLink = (token: string, id: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const inviteUrl = `${origin}/accept-invite?token=${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedId(id);
    info('Invitation link copied to clipboard');
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (loading) {
    return <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />;
  }

  return (
    <div className="space-y-8">
      {/* Team Members List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Team Members ({members.length})
            </h3>
            <p className="text-xs text-slate-500">Active users in your export organization</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
          {members.map((m) => {
            const isSelf = m.id === currentUserId;
            const isOwner = m.role === 'OWNER';

            return (
              <div
                key={m.id}
                className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm">
                    {m.name ? m.name.charAt(0).toUpperCase() : m.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {m.name ?? m.email}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{m.email}</div>
                    {m.designation && (
                      <div className="text-[11px] text-slate-400">{m.designation}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Role Selector or Badge */}
                  {canManage && !isSelf && !isOwner ? (
                    <div className="w-40">
                      <Select
                        defaultValue={m.role}
                        onValueChange={(val) => handleRoleChange(m.id, val)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_ROLES.map((r) => (
                            <SelectItem key={r.value} value={r.value} className="text-xs">
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-blue-500" />
                      {m.role.replace(/_/g, ' ')}
                    </span>
                  )}

                  {/* Remove Member Button */}
                  {canManage && !isSelf && (!isOwner || currentUserRole === 'OWNER') && (
                    <button
                      onClick={() => handleRemoveMember(m.id, m.name || m.email)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Pending Invitations ({invites.length})
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{inv.email}</p>
                  <p className="text-xs text-slate-400">
                    Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-medium">
                    {inv.role.replace(/_/g, ' ')}
                  </span>
                  {inv.token && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyInviteLink(inv.token!, inv.id)}
                      className="gap-1.5 text-xs h-8"
                    >
                      {copiedId === inv.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Link
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Member Form */}
      {canManage && (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <UserPlus className="w-4 h-4" />
            <span>Invite New Member</span>
          </div>
          <form onSubmit={handleSubmit(onInvite)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="inviteEmail" className="text-xs font-semibold">
                  Colleague's Work Email <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="inviteEmail"
                    placeholder="colleague@yourcompany.com"
                    type="email"
                    className="pl-9 text-sm"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Role & Permissions</Label>
                <Select
                  defaultValue="OPS_EXECUTIVE"
                  onValueChange={(val) =>
                    setValue('role', val as 'ADMIN' | 'COMPLIANCE_OFFICER' | 'OPS_EXECUTIVE' | 'VIEWER')
                  }
                >
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVITABLE_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value} className="text-xs">
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="gap-2 text-xs font-semibold">
              <UserCheck className="w-4 h-4" />
              {isSubmitting ? 'Sending Invitation...' : 'Send Team Invitation'}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}