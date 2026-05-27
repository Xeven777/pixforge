import { useState, useEffect } from "react";
import { getSettings, saveSettings, pickDirectory } from "../lib/tauri";
import type { AppSettings } from "../types";

const defaults: AppSettings = {
  defaultOutputDir: "",
  concurrencyLimit: 4,
  filenamePattern: "{name}_compressed",
  theme: "dark",
};

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings).catch(() => {});
  }, []);

  const save = async () => {
    await saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="bg-surface-1 rounded-xl p-5 space-y-5">
        <div>
          <label className="block text-sm mb-1.5">Default output directory</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={settings.defaultOutputDir}
              className="flex-1 bg-surface-2 px-3 py-2 rounded-lg text-sm text-zinc-400"
            />
            <button
              onClick={async () => {
                const dir = await pickDirectory();
                if (dir) setSettings((s) => ({ ...s, defaultOutputDir: dir }));
              }}
              className="px-3 py-2 bg-surface-2 hover:bg-surface-3 rounded-lg text-sm transition-colors"
            >
              Browse
            </button>
          </div>
        </div>

        <div>
          <label className="flex justify-between text-sm mb-1.5">
            <span>Concurrency limit</span>
            <span className="text-zinc-400 font-mono">{settings.concurrencyLimit}</span>
          </label>
          <input
            type="range" min={1} max={16} value={settings.concurrencyLimit}
            onChange={(e) => setSettings((s) => ({ ...s, concurrencyLimit: +e.target.value }))}
            className="w-full accent-violet-500"
          />
        </div>

        <div>
          <label className="block text-sm mb-1.5">Filename pattern</label>
          <input
            value={settings.filenamePattern}
            onChange={(e) => setSettings((s) => ({ ...s, filenamePattern: e.target.value }))}
            className="w-full bg-surface-2 px-3 py-2 rounded-lg text-sm font-mono"
          />
          <p className="mt-1 text-xs text-zinc-500">{"{name}"} → original filename without extension</p>
        </div>
      </div>

      <button
        onClick={save}
        className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold transition-colors"
      >
        {saved ? "Saved!" : "Save settings"}
      </button>
    </div>
  );
}
