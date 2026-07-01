"use client";

import { useState, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Settings } from "@/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(v: string) {
  return EMAIL_RE.test(v.trim());
}

// ─── Email chip input ────────────────────────────────────────────────────────

function EmailChipInput({
  emails,
  onChange,
}: {
  emails: string[];
  onChange: (emails: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function commit() {
    const val = input.trim().toLowerCase();
    if (!val) return;
    if (!isValidEmail(val)) {
      setInputError("Invalid email address.");
      return;
    }
    if (emails.includes(val)) {
      setInputError("Already in the list.");
      return;
    }
    onChange([...emails, val]);
    setInput("");
    setInputError(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    }
    if (e.key === "Backspace" && input === "" && emails.length > 0) {
      onChange(emails.slice(0, -1));
    }
  }

  function remove(email: string) {
    onChange(emails.filter((e) => e !== email));
  }

  return (
    <div
      className="flex min-h-[44px] cursor-text flex-wrap gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
      onClick={() => inputRef.current?.focus()}
    >
      {emails.map((email) => (
        <span
          key={email}
          className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
        >
          {email}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              remove(email);
            }}
            className="ml-0.5 rounded-full p-0.5 hover:bg-blue-100"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setInputError(null);
        }}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={emails.length === 0 ? "Add email and press Enter" : ""}
        className="flex-1 min-w-[160px] border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
      />
      {inputError && (
        <p className="w-full text-xs text-red-500 mt-1">{inputError}</p>
      )}
    </div>
  );
}

// ─── Schedule section ────────────────────────────────────────────────────────

function ScheduleSection({ initialSettings }: { initialSettings: Settings }) {
  const [cadence, setCadence] = useState<"monthly" | "quarterly">(
    initialSettings.delivery_cadence
  );
  const [sendDay, setSendDay] = useState(initialSettings.send_on_day);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const changed =
    cadence !== initialSettings.delivery_cadence ||
    sendDay !== initialSettings.send_on_day;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delivery_cadence: cadence, send_on_day: sendDay }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save.");
        return;
      }
      setToast("Schedule saved.");
      setTimeout(() => setToast(null), 3000);
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="mb-1 text-base font-semibold text-slate-800">Schedule</h2>
      <p className="mb-5 text-sm text-slate-500">
        Controls when automated reports are sent.
      </p>

      <div className="mb-5">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Delivery Cadence
        </label>
        <div className="flex gap-2">
          {(["monthly", "quarterly"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCadence(c)}
              className={`rounded-lg border px-5 py-2 text-sm font-medium capitalize transition ${
                cadence === c
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Send on Day of Month
        </label>
        <input
          type="number"
          min={1}
          max={28}
          value={sendDay}
          onChange={(e) => setSendDay(Number(e.target.value))}
          className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1.5 text-xs text-slate-400">
          {cadence === "quarterly"
            ? "Quarterly reports are sent in Jan / Apr / Jul / Oct on this day."
            : "Monthly reports are sent every month on this day."}
        </p>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {toast && <p className="mb-3 text-sm text-green-600">{toast}</p>}

      <Button
        onClick={save}
        disabled={!changed || saving}
        className="bg-blue-600 text-white hover:bg-blue-600/90 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Schedule"}
      </Button>
    </div>
  );
}

// ─── Distribution list section ───────────────────────────────────────────────

function DistributionSection({ initialSettings }: { initialSettings: Settings }) {
  const [emails, setEmails] = useState<string[]>(
    initialSettings.recipient_emails ?? []
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const changed =
    JSON.stringify(emails) !==
    JSON.stringify(initialSettings.recipient_emails ?? []);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_emails: emails }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save.");
        return;
      }
      setToast("Distribution list saved.");
      setTimeout(() => setToast(null), 3000);
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="mb-1 text-base font-semibold text-slate-800">
        Distribution List
      </h2>
      <p className="mb-1 text-sm text-slate-500">
        Recipients for scheduled reports.
      </p>
      <p className="mb-5 text-xs text-slate-400">
        These recipients receive every report on the schedule above. This is
        separate from each project&apos;s individual stakeholders.
      </p>

      <div className="mb-5">
        <EmailChipInput emails={emails} onChange={setEmails} />
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {toast && <p className="mb-3 text-sm text-green-600">{toast}</p>}

      <Button
        onClick={save}
        disabled={!changed || saving}
        className="bg-blue-600 text-white hover:bg-blue-600/90 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Distribution List"}
      </Button>
    </div>
  );
}

// ─── Root export ─────────────────────────────────────────────────────────────

export function SettingsClient({
  initialSettings,
}: {
  initialSettings: Settings;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ScheduleSection initialSettings={initialSettings} />
      <DistributionSection initialSettings={initialSettings} />
    </div>
  );
}
