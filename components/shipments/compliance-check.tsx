"use client";

import { useState } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { StatutoryDisclaimer } from "@/components/ui/statutory-disclaimer";

type RuleResult = {
  rule: string;
  description: string;
  passed: boolean;
  severity: 'BLOCKING' | 'WARNING';
  message: string;
};

type ComplianceResult = {
  complianceScore: number;
  issues: string[];
  recommendations: string[];
  verified?: {
    passed: boolean;
    failedRules: RuleResult[];
    passedRules: RuleResult[];
    allRules?: RuleResult[];
  };
  aiAdvisory?: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
};

export function ComplianceCheck({ shipmentId }: { shipmentId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComplianceResult | null>(null);

  const handleCheck = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/shipments/${shipmentId}/compliance`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || "Compliance check temporarily unavailable, please retry.");
        return;
      }
      setResult(data);
    } catch {
      setError("Compliance check service is temporarily unavailable. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) =>
    score >= 70 ? "text-emerald-600 dark:text-emerald-400" : score >= 40 ? "text-amber-600 dark:text-amber-400" : "text-destructive";

  const verified = result?.verified;
  const aiAdvisory = result?.aiAdvisory;
  const issues = aiAdvisory?.issues || result?.issues || [];
  const recommendations = aiAdvisory?.recommendations || result?.recommendations || [];
  const score = aiAdvisory?.score ?? result?.complianceScore ?? 0;

  return (
    <div className="space-y-3">
      <Button type="button" onClick={handleCheck} disabled={loading} className="bg-brand-orange text-brand-orange-foreground hover:opacity-90">
        <ShieldCheck className="w-4 h-4 mr-1.5" />
        {loading ? "Verifying Statutory Rules & Running AI..." : "Run Compliance Check"}
      </Button>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader />
          Checking statutory rules (IEC, Tariff, Sanctions, Docs) & running AI review...
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* SECTION 1: VERIFIED STATUTORY CHECKS (Deterministic Rules) */}
          <div className="border border-border rounded-lg p-4 bg-muted/30 space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Verified Statutory Checks (Ground Truth)
                </h4>
              </div>
              {verified && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${verified.passed ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' : 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30'}`}>
                  {verified.passed ? 'All Rules Passed' : `${verified.failedRules.length} Rule(s) Failed`}
                </span>
              )}
            </div>

            {verified?.allRules && verified.allRules.length > 0 ? (
              <div className="space-y-2">
                {verified.allRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 p-2.5 rounded-md border text-xs ${rule.passed ? 'bg-emerald-500/5 border-emerald-500/20 text-foreground' : 'bg-destructive/10 border-destructive/30 text-foreground'}`}
                  >
                    {rule.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <span>{rule.description}</span>
                        {!rule.passed && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-destructive/20 text-destructive font-mono uppercase">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground">{rule.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Statutory rule engine executed.</p>
            )}
          </div>

          {/* SECTION 2: AI ADVISORY & RECOMMENDATIONS (Soft Advisory Layer) */}
          <div className="border border-border rounded-lg p-4 bg-muted/15 space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  AI Recommendations (Advisory Only)
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Advisory Score:</span>
                <span className={`text-sm font-bold ${scoreColor(score)}`}>
                  {score}/100
                </span>
              </div>
            </div>

            {issues.length > 0 && (
              <div>
                <p className="text-xs font-medium text-foreground flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  AI Flagged Potential Issues
                </p>
                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                  {issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {recommendations.length > 0 && (
              <div>
                <p className="text-xs font-medium text-foreground mb-1">AI Actionable Suggestions</p>
                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                  {recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <StatutoryDisclaimer />
          </div>
        </div>
      )}
    </div>
  );
}