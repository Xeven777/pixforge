import { useEffect, useRef, useState } from "react";
import { comparePreview, type PreviewResult } from "../lib/tauri";
import { registerLaunchTarget } from "../lib/launchBus";
import DropZone from "../components/DropZone";
import CompareSlider from "../components/CompareSlider";
import MaxDimensionInput from "../components/MaxDimensionInput";

function formatBytes(n: number): string {
  if (n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function Preview() {
  const [path, setPath] = useState<string | undefined>();
  const [name, setName] = useState<string>("");
  const [format, setFormat] = useState<"jpeg" | "webp">("jpeg");
  const [quality, setQuality] = useState(80);
  const [maxDimension, setMaxDimension] = useState<number | undefined>();
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFile = (paths: string[]) => {
    const p = paths[0];
    if (!p) return;
    setPath(p);
    setName(p.split("/").pop() ?? p);
    setResult(null);
    setError(null);
  };

  useEffect(() => registerLaunchTarget("preview", addFile), []);

  const reqId = useRef(0);
  useEffect(() => {
    if (!path) return;
    const id = ++reqId.current;
    setLoading(true);
    const t = setTimeout(() => {
      comparePreview(path, { format, quality, maxDimension })
        .then((r) => {
          if (id === reqId.current) {
            setResult(r);
            setError(null);
          }
        })
        .catch((e) => {
          if (id === reqId.current) setError(String(e));
        })
        .finally(() => {
          if (id === reqId.current) setLoading(false);
        });
    }, 350);
    return () => clearTimeout(t);
  }, [path, format, quality, maxDimension]);

  const reduction =
    result && result.originalSize > 0
      ? Math.round((1 - result.compressedSize / result.originalSize) * 100)
      : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Compression Preview</h1>

      <DropZone
        accept={{ "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif"] }}
        onFiles={addFile}
        label={name ? `Selected: ${name} — drop another to replace` : "Drop an image to preview compression"}
      />

      {path && (
        <>
          <div className="bg-surface-1 rounded-xl p-5 space-y-4">
            <div>
              <label className="text-sm block mb-2">Output format</label>
              <div className="flex gap-3">
                {(["jpeg", "webp"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors uppercase ${
                      format === f ? "bg-accent text-white" : "bg-surface-2 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex justify-between text-sm mb-1.5">
                <span>Quality</span>
                <span className="text-zinc-400 font-mono">{quality}</span>
              </label>
              <input
                type="range" min={1} max={100} value={quality}
                onChange={(e) => setQuality(+e.target.value)}
                className="w-full accent-violet-500"
              />
            </div>

            <MaxDimensionInput value={maxDimension} onChange={setMaxDimension} />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-4 text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <CompareSlider before={result.originalPreview} after={result.compressedPreview} />
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                <span className="text-zinc-400">
                  Original <span className="text-white font-mono">{formatBytes(result.originalSize)}</span>
                </span>
                <span className="text-zinc-400">
                  {format.toUpperCase()} <span className="text-white font-mono">{formatBytes(result.compressedSize)}</span>
                </span>
                <span className={reduction >= 0 ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                  {reduction >= 0 ? `${reduction}% smaller` : `${-reduction}% larger`}
                </span>
                <span className="text-zinc-500 font-mono">{result.width}×{result.height}</span>
                {loading && <span className="text-zinc-500">updating…</span>}
              </div>
            </div>
          )}

          {!result && loading && <p className="text-sm text-zinc-500">Rendering preview…</p>}
        </>
      )}
    </div>
  );
}
