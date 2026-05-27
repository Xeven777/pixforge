import { useState, useCallback } from "react";
import { compressImages, statFiles } from "../lib/tauri";
import DropZone from "../components/DropZone";
import FileQueue from "../components/FileQueue";
import type { QueueFile, CompressOptions } from "../types";

function makeId() {
  return Math.random().toString(36).slice(2);
}

export default function ImageCompress() {
  const [files, setFiles] = useState<QueueFile[]>([]);
  const [quality, setQuality] = useState(80);
  const [lossless, setLossless] = useState(false);
  const [preserveExif, setPreserveExif] = useState(true);
  const [outputDir, setOutputDir] = useState<string | undefined>();
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
    const opts: CompressOptions = { quality, lossless, preserveExif, outputDir };
    const paths = files.map((f) => f.path);

    setFiles((prev) => prev.map((f) => ({ ...f, status: "processing", progress: 0 })));

    try {
      const results = await compressImages(paths, opts);
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
      <h1 className="text-2xl font-bold">Image Compression</h1>

      <DropZone
        accept={{ "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"] }}
        onFiles={addFiles}
      />

      <div className="bg-surface-1 rounded-xl p-5 space-y-4">
        <div>
          <label className="flex justify-between text-sm mb-1.5">
            <span>Quality</span>
            <span className="text-zinc-400 font-mono">{quality}</span>
          </label>
          <input
            type="range" min={1} max={100} value={quality}
            onChange={(e) => setQuality(+e.target.value)}
            disabled={lossless}
            className="w-full accent-violet-500 disabled:opacity-40"
          />
        </div>

        <label className="flex items-center gap-3 text-sm cursor-pointer">
          <input
            type="checkbox" checked={lossless}
            onChange={(e) => setLossless(e.target.checked)}
            className="w-4 h-4 accent-violet-500"
          />
          Lossless
        </label>

        <label className="flex items-center gap-3 text-sm cursor-pointer">
          <input
            type="checkbox" checked={preserveExif}
            onChange={(e) => setPreserveExif(e.target.checked)}
            className="w-4 h-4 accent-violet-500"
          />
          Preserve EXIF metadata
        </label>

        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              const { pickDirectory } = await import("../lib/tauri");
              const dir = await pickDirectory();
              if (dir) setOutputDir(dir);
            }}
            className="text-sm px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors"
          >
            Output folder
          </button>
          {outputDir && (
            <span className="text-xs text-zinc-400 truncate flex-1">{outputDir}</span>
          )}
        </div>
      </div>

      <button
        onClick={run}
        disabled={!files.length || running}
        className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold transition-colors disabled:opacity-40"
      >
        {running ? "Compressing…" : `Compress ${files.length} file${files.length !== 1 ? "s" : ""}`}
      </button>

      <FileQueue files={files} />
    </div>
  );
}
