"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export function DownloadPdfButton({
  projectId,
  pdfUrl,
}: {
  projectId: string;
  pdfUrl: string | null;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    // If PDF was pre-generated, open it directly with no server round-trip
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
      return;
    }

    // Fallback: PDF generation failed at analysis time — trigger on-demand generation
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/pdf`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate PDF");
      }
      window.open(data.url, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {isLoading ? "Generating..." : "Download PDF"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
