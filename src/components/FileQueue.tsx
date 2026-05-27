import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import type { QueueFile } from "../types";
import ProgressBar from "./ProgressBar";

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function savings(input: number, output: number) {
  const pct = ((input - output) / input) * 100;
  return `${pct > 0 ? "-" : "+"}${Math.abs(pct).toFixed(1)}%`;
}

interface Props {
  files: QueueFile[];
}

export default function FileQueue({ files }: Props) {
  if (files.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      {files.map((f) => (
        <div key={f.id} className="bg-surface-2 rounded-lg px-4 py-3">
          <div className="flex items-center gap-3">
            <StatusIcon status={f.status} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{f.name}</p>
              <p className="text-xs text-zinc-500">
                {formatBytes(f.size)}
                {f.outputSize ? ` → ${formatBytes(f.outputSize)} (${savings(f.size, f.outputSize)})` : ""}
              </p>
            </div>
          </div>
          {f.status === "processing" && (
            <ProgressBar value={f.progress ?? 0} className="mt-2" />
          )}
          {f.error && (
            <p className="mt-1 text-xs text-red-400">{f.error}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function StatusIcon({ status }: { status: QueueFile["status"] }) {
  switch (status) {
    case "done":
      return <CheckCircle2 size={16} className="text-green-400 shrink-0" />;
    case "error":
      return <XCircle size={16} className="text-red-400 shrink-0" />;
    case "processing":
      return <Loader2 size={16} className="text-accent animate-spin shrink-0" />;
    default:
      return <Clock size={16} className="text-zinc-500 shrink-0" />;
  }
}
