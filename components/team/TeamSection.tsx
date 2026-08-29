"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["ADMIN", "EXPORTER", "COMPLIANCE_OFFICER"]),
});
type InviteFormData = z.infer<typeof inviteSchema>;

const ROLES = ["ADMIN", "EXPORTER", "COMPLIANCE_OFFICER"];

type Member = { id: string; name: string | null; email: string; role: string };
type Invite = { id: string; email: string; role: string; createdAt: string };

export function TeamSection() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [canInvite, setCanInvite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "EXPORTER" },
  });

  useEffect(() => {
    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => {
        setMembers(data.members ?? []);
        setInvites(data.pendingInvites ?? []);
        setCanInvite(data.isOwnerOrAdmin ?? false);
      })
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data: InviteFormData) => {
    setSubmitError("");
    setSubmitSuccess(false);

    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      setSubmitError("Invite bhejne me error aaya, dobara try karo.");
      return;
    }

    const invite = await res.json();
    setInvites((prev) => [...prev, invite]);
    setSubmitSuccess(true);
    reset({ email: "", role: "EXPORTER" });
  };

  if (loading) {
    return <div className="h-24 bg-muted rounded-md animate-pulse" />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xs font-medium text-muted-foreground mb-2">Team Members</h3>
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between text-sm border border-border rounded-md px-3 py-2">
              <div>
                <p className="text-foreground font-medium">{m.name ?? m.email}</p>
                <p className="text-xs text-muted-foreground">{m.email}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                {m.role.replace(/_/g, " ")}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {invites.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-2">Pending Invites</h3>
          <ul className="space-y-2">
            {invites.map((inv) => (
              <li key={inv.id} className="flex items-center gap-2 text-sm text-muted-foreground border border-dashed border-border rounded-md px-3 py-2">
                <Mail className="w-3.5 h-3.5" />
                {inv.email} — {inv.role.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {canInvite && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-2 border-t border-border">
          <h3 className="text-xs font-medium text-muted-foreground pt-3">Invite New Member</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="invite-email">Email</Label>
              <Input id="invite-email" {...register("email")} placeholder="colleague@company.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select defaultValue="EXPORTER" onValueChange={(v) => setValue("role", v as InviteFormData["role"])}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {submitError && <p className="text-xs text-destructive">{submitError}</p>}
          {submitSuccess && <p className="text-xs text-emerald-600 dark:text-emerald-400">Invite bhej diya gaya!</p>}

          <Button type="submit" disabled={isSubmitting} size="sm" className="bg-brand-orange text-brand-orange-foreground hover:opacity-90">
            <UserPlus className="w-4 h-4 mr-1.5" />
            {isSubmitting ? "Sending..." : "Send Invite"}
          </Button>
        </form>
      )}
    </div>
  );
}