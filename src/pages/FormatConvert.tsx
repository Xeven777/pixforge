import { useState, useCallback } from "react";
import { convertImages, statFiles } from "../lib/tauri";
import DropZone from "../components/DropZone";
import FileQueue from "../components/FileQueue";
import type { QueueFile, ConvertOptions } from "../types";

function makeId() {
  return Math.random().toString(36).slice(2);
}

export default function FormatConvert() {
  const [files, setFiles] = useState<QueueFile[]>([]);
  const [format, setFormat] = useState<"webp" | "avif">("webp");
  const [quality, setQuality] = useState(80);
  const [effort, setEffort] = useState(4);
  const [running, setRunning] = useState(false);

  const addFiles = useCallback(async (paths: string[]) => {
    const stats = await statFiles(paths);
    setFiles((prev) => [
      ...prev,
      ...stats.map(({ path, size }) => ({
        id: makeId(),
        path,
        name: path.split("/").pop() ?? path,
        size,
        status: "pending" as const,
      })),
    ]);
  }, []);

  const run = async () => {
    if (!files.length || running) return;
    setRunning(true);
    const opts: ConvertOptions = { format, quality, effort };

    setFiles((prev) => prev.map((f) => ({ ...f, status: "processing", progress: 0 })));

    try {
      const results = await convertImages(files.map((f) => f.path), opts);
      setFiles((prev) =>
        prev.map((f) => {
          const r = results.find((x) => x.path === f.path);
          return r
            ? { ...f, status: "done", outputPath: r.outputPath, outputSize: r.outputSize, progress: 100 }
            : { ...f, status: "error", error: "Not found in results" };
        })
      );
    } catch (e) {
      setFiles((prev) => prev.map((f) => ({ ...f, status: "error", error: String(e) })));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Format Conversion</h1>

      <DropZone
        accept={{ "image/*": [".jpg", ".jpeg", ".png", ".gif"] }}
        onFiles={addFiles}
        label="Drop PNG / JPG / GIF files here or click to browse"
      />

      <div className="bg-surface-1 rounded-xl p-5 space-y-4">
        <div>
          <label className="text-sm block mb-2">Output format</label>
          <div className="flex gap-3">
            {(["webp", "avif"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors uppercase ${
                  format === f
                    ? "bg-accent text-white"
                    : "bg-surface-2 text-zinc-400 hover:text-white"
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

        <div>
          <label className="flex justify-between text-sm mb-1.5">
            <span>Effort {format === "avif" ? "(1=fast, 10=smallest)" : "(0=fast, 6=smallest)"}</span>
            <span className="text-zinc-400 font-mono">{effort}</span>
          </label>
          <input
            type="range" min={0} max={format === "avif" ? 10 : 6} value={effort}
            onChange={(e) => setEffort(+e.target.value)}
            className="w-full accent-violet-500"
          />
        </div>
      </div>

      <button
        onClick={run}
        disabled={!files.length || running}
        className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold transition-colors disabled:opacity-40"
      >
        {running ? "Converting…" : `Convert ${files.length} file${files.length !== 1 ? "s" : ""} to ${format.toUpperCase()}`}
      </button>

      <FileQueue files={files} />
    </div>
  );
}
