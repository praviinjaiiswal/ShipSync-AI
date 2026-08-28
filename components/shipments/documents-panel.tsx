"use client";

import { useState } from "react";
import { FileText, Download } from "lucide-react";
import { FileUpload } from "./file-upload";

type Doc = {
  id: string;
  docType: string;
  fileUrl: string | null;
  status: string;
};

export function DocumentsPanel({
  shipmentId,
  initialDocuments,
}: {
  shipmentId: string;
  initialDocuments: Doc[];
}) {
  const [documents, setDocuments] = useState<Doc[]>(initialDocuments);

  return (
    <div className="space-y-4">
      <FileUpload shipmentId={shipmentId} onUploaded={(doc) => setDocuments((prev) => [doc, ...prev])} />

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">Abhi tak koi document upload nahi hua.</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between text-sm border border-border rounded-md px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{doc.docType.replace(/_/g, " ")}</span>
                <span className="text-muted-foreground text-xs">({doc.status})</span>
              </div>
              {doc.fileUrl && (
                
                <a href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-brand-orange hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  View
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}