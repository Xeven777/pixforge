import clsx from "clsx";
import { DEVICE_PRESETS, type DevicePreset } from "../lib/presets";

interface Props {
  active: string | null;
  onSelect: (preset: DevicePreset) => void;
}

export default function DevicePresets({ active, onSelect }: Props) {
  return (
    <div>
      <label className="text-sm block mb-2">Device presets</label>
      <div className="flex flex-wrap gap-2">
        {DEVICE_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            title={p.note}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              active === p.id
                ? "bg-accent text-white"
                : "bg-surface-2 text-zinc-400 hover:text-white"
            )}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
