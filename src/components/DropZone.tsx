import { useEffect, useMemo, useRef, useState } from "react";
import { Upload } from "lucide-react";
import clsx from "clsx";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { pickFiles } from "../lib/tauri";

interface Props {
  accept?: Record<string, string[]>;
  onFiles: (paths: string[]) => void;
  label?: string;
}

function acceptToFilters(accept?: Record<string, string[]>) {
  if (!accept) return { filters: [{ name: "All files", extensions: ["*"] }], exts: null as Set<string> | null };
  const exts = new Set<string>();
  for (const list of Object.values(accept)) {
    for (const e of list) exts.add(e.replace(/^\./, "").toLowerCase());
  }
  const flat = [...exts];
  return {
    filters: [{ name: "Supported", extensions: flat }],
    exts,
  };
}

export default function DropZone({ accept, onFiles, label = "Drop files here or click to browse" }: Props) {
  const [hover, setHover] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { filters, exts } = useMemo(() => acceptToFilters(accept), [accept]);

  useEffect(() => {
    const unlistenPromise = getCurrentWebview().onDragDropEvent((event) => {
      const payload = event.payload;
      if (payload.type === "over") {
        setHover(true);
      } else if (payload.type === "leave") {
        setHover(false);
      } else if (payload.type === "drop") {
        setHover(false);
        const el = rootRef.current;
        if (!el) return;
        // Only accept drops that landed on this zone
        const { x, y } = payload.position;
        const r = el.getBoundingClientRect();
        const scale = window.devicePixelRatio || 1;
        const cx = x / scale;
        const cy = y / scale;
        if (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return;

        const paths = (payload.paths ?? []).filter((p) => {
          if (!exts) return true;
          const dot = p.lastIndexOf(".");
          if (dot < 0) return false;
          return exts.has(p.slice(dot + 1).toLowerCase());
        });
        if (paths.length) onFiles(paths);
      }
    });
    return () => {
      unlistenPromise.then((u) => u());
    };
  }, [exts, onFiles]);

  const browse = async () => {
    const result = await pickFiles(filters);
    if (!result) return;
    const paths = Array.isArray(result) ? result : [result];
    if (paths.length) onFiles(paths);
  };

  return (
    <div
      ref={rootRef}
      onClick={browse}
      className={clsx(
        "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors",
        hover
          ? "border-accent bg-accent/10 text-white"
          : "border-surface-3 hover:border-zinc-500 text-zinc-500 hover:text-zinc-300"
      )}
    >
      <Upload size={28} />
      <p className="text-sm text-center">{label}</p>
    </div>
  );
}
