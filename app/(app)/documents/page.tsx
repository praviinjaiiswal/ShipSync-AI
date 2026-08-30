"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Download } from "lucide-react";

type Doc = {
  id: string;
  docType: string;
  fileUrl: string | null;
  status: string;
  createdAt: string;
  shipment: { id: string; buyerName: string };
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/documents")
      .then((res) => res.json())
      .then(setDocuments)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Documents</h1>
        <p className="text-sm text-muted-foreground mt-1">Saari shipments ke uploaded documents ek jagah</p>
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted rounded-md animate-pulse" />
          ))}
        </div>
      )}

      {!loading && documents.length === 0 && (
        <div className="border border-border rounded-lg p-10 text-center text-sm text-muted-foreground">
          Abhi tak koi document upload nahi hua. Kisi shipment ke andar jaake document upload karo.
        </div>
      )}

      {!loading && documents.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="text-left font-medium px-4 py-3">Document</th>
                <th className="text-left font-medium px-4 py-3">Shipment</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-right font-medium px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    {doc.docType.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/shipments/${doc.shipment.id}`} className="text-brand-orange hover:underline">
                      {doc.shipment.buyerName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{doc.status}</td>
                  <td className="px-4 py-3 text-right">
                    {doc.fileUrl && (
                      
                    <a href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-brand-orange hover:underline"
                    >
                        <Download className="w-3.5 h-3.5" />
                        View
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}