"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send, X } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(v: string) {
  return EMAIL_RE.test(v.trim());
}

export function SendReportButton({
  projectId,
  recipientEmails,
  manualEmailSentAt,
}: {
  projectId: string;
  recipientEmails: string[];
  manualEmailSentAt: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [chips, setChips] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [apiError, setApiError] = useState("");
  const [lastSentAt, setLastSentAt] = useState<string | null>(manualEmailSentAt);
  const inputRef = useRef<HTMLInputElement>(null);

  function openDialog() {
    setChips([...recipientEmails]);
    setInputValue("");
    setInputError("");
    setApiError("");
    setSent(false);
    setOpen(true);
  }

  function closeDialog() {
    if (loading) return;
    setOpen(false);
  }

  function addChip(raw: string) {
    const email = raw.trim().replace(/,+$/, "");
    if (!email) return;
    if (!isValidEmail(email)) {
      setInputError("Invalid email address.");
      return;
    }
    if (chips.includes(email)) {
      setInputError("Already in the list.");
      return;
    }
    setChips((prev) => [...prev, email]);
    setInputValue("");
    setInputError("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addChip(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && chips.length > 0) {
      setChips((prev) => prev.slice(0, -1));
    }
  }

  function removeChip(email: string) {
    setChips((prev) => prev.filter((c) => c !== email));
  }

  async function handleSend() {
    if (chips.length === 0 || loading) return;
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients: chips }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setApiError(body.error ?? "Failed to send. Please try again.");
        return;
      }
      setSent(true);
      setLastSentAt(new Date().toISOString());
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const formattedLastSent = lastSentAt
    ? new Date(lastSentAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={openDialog}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 active:bg-blue-800"
        >
          <Send className="h-4 w-4" />
          {lastSentAt ? "Resend Report" : "Send Report"}
        </button>
        {formattedLastSent && (
          <p className="text-xs text-slate-400">
            Last sent manually on {formattedLastSent}
          </p>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => e.target === e.currentTarget && closeDialog()}
        >
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            {sent ? (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Send className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-800">
                  Report sent!
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  The PDF has been emailed to {chips.length} recipient
                  {chips.length !== 1 ? "s" : ""}.
                </p>
                <button
                  onClick={closeDialog}
                  className="mt-6 w-full rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-100 px-6 py-5">
                  <h2 className="text-lg font-semibold text-slate-800">
                    Send Report
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Recipients are pre-filled from project settings — add or
                    remove as needed for this send.
                  </p>
                </div>

                <div className="px-6 py-5">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Recipients
                  </label>

                  {/* Chip container */}
                  <div
                    className="flex min-h-[44px] cursor-text flex-wrap gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"
                    onClick={() => inputRef.current?.focus()}
                  >
                    {chips.map((email) => (
                      <span
                        key={email}
                        className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeChip(email);
                          }}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-blue-200"
                          aria-label={`Remove ${email}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      ref={inputRef}
                      type="email"
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        setInputError("");
                      }}
                      onKeyDown={handleKeyDown}
                      onBlur={() => {
                        if (inputValue.trim()) addChip(inputValue);
                      }}
                      placeholder={chips.length === 0 ? "Add email address…" : ""}
                      className="min-w-[160px] flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                    />
                  </div>

                  {inputError && (
                    <p className="mt-1.5 text-xs text-red-500">{inputError}</p>
                  )}
                  {chips.length === 0 && !inputError && (
                    <p className="mt-1.5 text-xs text-amber-600">
                      At least one recipient is required.
                    </p>
                  )}

                  <p className="mt-2 text-xs text-slate-400">
                    Press Enter or comma to add. These recipients are for this
                    send only — project settings are not changed.
                  </p>

                  {apiError && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {apiError}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
                  <button
                    onClick={closeDialog}
                    disabled={loading}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={chips.length === 0 || loading}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                          />
                        </svg>
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Confirm &amp; Send
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
