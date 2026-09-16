interface Props {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

export default function MaxDimensionInput({ value, onChange }: Props) {
  return (
    <div>
      <label className="flex justify-between text-sm mb-1.5">
        <span>Max dimension</span>
        <span className="text-zinc-400 font-mono">
          {value ? `${value} px` : "original"}
        </span>
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          placeholder="Original size"
          value={value ?? ""}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            onChange(Number.isFinite(n) && n > 0 ? n : undefined);
          }}
          className="flex-1 bg-surface-2 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-accent"
        />
        {value !== undefined && (
          <button
            onClick={() => onChange(undefined)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-zinc-400 hover:text-white transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <p className="text-xs text-zinc-500 mt-1">
        Longest side; images are only downscaled, never enlarged.
      </p>
    </div>
  );
}
