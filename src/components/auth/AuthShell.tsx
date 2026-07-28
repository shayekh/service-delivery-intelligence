import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-white">
      <header className="flex items-center px-6 py-4 sm:px-10">
        <Link href="/login" className="text-lg font-semibold tracking-wide">
          Service Delivery Intelligence
        </Link>
      </header>

      <main className="flex flex-1 items-center bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 py-12 sm:px-10 lg:grid-cols-2">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs font-medium tracking-wide text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              BUILT FOR SELISE TEAMS
            </span>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Service Delivery Intelligence
            </h1>
            <p className="max-w-md text-lg text-slate-300">
              Agentic quarterly reviews for Product Managers and Tech
              Leads — AI-analysed and delivered automatically.
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">{children}</div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs tracking-widest text-slate-500">
        SELISE DIGITAL PLATFORMS
      </footer>
    </div>
  );
}
