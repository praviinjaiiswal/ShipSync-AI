"use client";

import { useState } from "react";
import { FileText, Download, History, Lock, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { FileUpload } from "./file-upload";
import { Button } from "@/components/ui/button";

type Doc = {
  id: string;
  docType: string;
  fileName?: string | null;
  fileUrl: string | null;
  status: string;
  version?: number;
  isLatest?: boolean;
  finalizedAt?: string | Date | null;
  createdAt?: string | Date;
};

export function DocumentsPanel({
  shipmentId,
  initialDocuments,
}: {
  shipmentId: string;
  initialDocuments: Doc[];
}) {
  const [documents, setDocuments] = useState<Doc[]>(initialDocuments);
  const [expandedDocType, setExpandedDocType] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<Record<string, Doc[]>>({});
  const [loadingHistory, setLoadingHistory] = useState<string | null>(null);

  const toggleHistory = async (docType: string) => {
    if (expandedDocType === docType) {
      setExpandedDocType(null);
      return;
    }

    setExpandedDocType(docType);
    if (!historyData[docType]) {
      setLoadingHistory(docType);
      try {
        const res = await fetch(`/api/documents/${shipmentId}/${docType}/history`);
        const json = await res.json();
        if (res.ok && json.history) {
          setHistoryData((prev) => ({ ...prev, [docType]: json.history }));
        }
      } catch (err) {
        console.error("Failed to load document history:", err);
      } finally {
        setLoadingHistory(null);
      }
    }
  };

  // Group latest documents
  const latestDocs = documents.filter((d) => d.isLatest !== false);

  return (
    <div className="space-y-4">
      <FileUpload
        shipmentId={shipmentId}
        onUploaded={(doc) => setDocuments((prev) => [doc, ...prev])}
      />

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents uploaded or generated yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {latestDocs.map((doc) => {
            const isHistoryOpen = expandedDocType === doc.docType;
            const history = historyData[doc.docType] || [];
            const hasMultipleVersions = (doc.version && doc.version > 1) || history.length > 1;

            return (
              <li key={doc.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm border border-border rounded-lg px-3.5 py-2.5 bg-card/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-medium text-foreground truncate">
                        {doc.docType.replace(/_/g, " ")}
                      </span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-semibold shrink-0">
                        v{doc.version || 1}
                      </span>
                      {doc.finalizedAt && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium shrink-0">
                          <Lock className="w-2.5 h-2.5" /> Filed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleHistory(doc.docType)}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                    >
                      <History className="w-3 h-3" />
                      <span className="hidden sm:inline">History</span>
                      {isHistoryOpen ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </Button>

                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        View PDF
                      </a>
                    )}
                  </div>
                </div>

                {/* Version History Drawer */}
                {isHistoryOpen && (
                  <div className="ml-6 pl-3 border-l-2 border-slate-200 dark:border-slate-800 space-y-1.5 py-1">
                    {loadingHistory === doc.docType ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Loading version audit chain...
                      </div>
                    ) : history.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Version 1 is the initial and only version.
                      </p>
                    ) : (
                      history.map((ver) => (
                        <div
                          key={ver.id}
                          className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-md ${
                            ver.isLatest
                              ? "bg-slate-100 dark:bg-slate-800/60 font-medium"
                              : "text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800/30"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold">v{ver.version}</span>
                            <span>{ver.isLatest ? "(Current / Latest)" : "(Superseded)"}</span>
                            {ver.finalizedAt && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400">
                                [Filed]
                              </span>
                            )}
                          </div>
                          {ver.fileUrl && (
                            <a
                              href={ver.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-orange hover:underline inline-flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" /> Download
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}