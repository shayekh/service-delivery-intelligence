import { requireAuth } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import { SettingsClient } from "@/components/settings/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAuth();
  const settings = await getSettings();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Report delivery schedule and distribution list for SELISE Digital Platforms
        </p>
      </div>

      <SettingsClient initialSettings={settings} />
    </div>
  );
}
