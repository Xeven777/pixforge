import { useState } from "react";
import { compressVideo, trimVideo, extractFrames, extractAudio, pickDirectory, statFiles } from "../lib/tauri";
import DropZone from "../components/DropZone";
import type { QueueFile } from "../types";

type Tool = "compress" | "trim" | "frames" | "audio";

function makeId() {
  return Math.random().toString(36).slice(2);
}

export default function VideoTools() {
  const [tool, setTool] = useState<Tool>("compress");
  const [file, setFile] = useState<QueueFile | null>(null);
  const [crf, setCrf] = useState(23);
  const [startSec, setStartSec] = useState(0);
  const [endSec, setEndSec] = useState(30);
  const [fps, setFps] = useState(1);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addFile = async (paths: string[]) => {
    if (!paths[0]) return;
    const p = paths[0];
    const [{ size }] = await statFiles([p]);
    setFile({ id: makeId(), path: p, name: p.split("/").pop() ?? p, size, status: "pending" });
    setResult(null);
    setError(null);
  };

  const run = async () => {
    if (!file || running) return;
    setRunning(true);
    setResult(null);
    setError(null);

    try {
      const outDir = await pickDirectory();
      if (!outDir) return;

      if (tool === "compress") {
        const r = await compressVideo(file.path, { crf, preset: "medium", outputDir: outDir });
        setResult(r.outputPath);
      } else if (tool === "trim") {
        const r = await trimVideo(file.path, { startSec, endSec, outputDir: outDir });
        setResult(r.outputPath);
      } else if (tool === "frames") {
        const r = await extractFrames(file.path, fps, outDir);
        setResult(`${r.count} frames → ${r.outputDir}`);
      } else {
        const r = await extractAudio(file.path, outDir);
        setResult(r.outputPath);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setRunning(false);
    }
  };

  const tools: { id: Tool; label: string }[] = [
    { id: "compress", label: "Compress" },
    { id: "trim", label: "Trim" },
    { id: "frames", label: "Extract Frames" },
    { id: "audio", label: "Extract Audio" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Video Tools</h1>

      <div className="flex gap-2">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tool === t.id ? "bg-accent text-white" : "bg-surface-2 text-zinc-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DropZone
        accept={{ "video/*": [".mp4", ".webm", ".mkv", ".mov", ".avi"] }}
        onFiles={addFile}
        label={file ? file.name : "Drop a video file here"}
      />

      <div className="bg-surface-1 rounded-xl p-5 space-y-4">
        {tool === "compress" && (
          <div>
            <label className="flex justify-between text-sm mb-1.5">
              <span>CRF (quality) — lower = better</span>
              <span className="text-zinc-400 font-mono">{crf}</span>
            </label>
            <input
              type="range" min={0} max={51} value={crf}
              onChange={(e) => setCrf(+e.target.value)}
              className="w-full accent-violet-500"
            />
          </div>
        )}

        {tool === "trim" && (
          <>
            <div>
              <label className="flex justify-between text-sm mb-1.5">
                <span>Start (seconds)</span>
                <span className="text-zinc-400 font-mono">{startSec}s</span>
              </label>
              <input
                type="number" min={0} value={startSec}
                onChange={(e) => setStartSec(+e.target.value)}
                className="w-full bg-surface-2 px-3 py-2 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="flex justify-between text-sm mb-1.5">
                <span>End (seconds)</span>
                <span className="text-zinc-400 font-mono">{endSec}s</span>
              </label>
              <input
                type="number" min={1} value={endSec}
                onChange={(e) => setEndSec(+e.target.value)}
                className="w-full bg-surface-2 px-3 py-2 rounded-lg text-sm"
              />
            </div>
          </>
        )}

        {tool === "frames" && (
          <div>
            <label className="flex justify-between text-sm mb-1.5">
              <span>Frames per second</span>
              <span className="text-zinc-400 font-mono">{fps}</span>
            </label>
            <input
              type="range" min={1} max={30} value={fps}
              onChange={(e) => setFps(+e.target.value)}
              className="w-full accent-violet-500"
            />
          </div>
        )}

        {tool === "audio" && (
          <p className="text-sm text-zinc-400">Extracts audio stream as MP3 from the dropped video.</p>
        )}
      </div>

      <button
        onClick={run}
        disabled={!file || running}
        className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold transition-colors disabled:opacity-40"
      >
        {running ? "Processing…" : "Choose output folder & run"}
      </button>

      {result && (
        <div className="bg-green-900/20 border border-green-700 rounded-xl px-4 py-3 text-sm text-green-300">
          Done: {result}
        </div>
      )}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-xl px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
