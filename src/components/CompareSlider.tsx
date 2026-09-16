import { useCallback, useRef, useState } from "react";

interface Props {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function CompareSlider({
  before,
  after,
  beforeLabel = "Original",
  afterLabel = "Compressed",
}: Props) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const update = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pct = ((clientX - r.left) / r.width) * 100;
    setPos(Math.min(100, Math.max(0, pct)));
  }, []);

  return (
    <div
      ref={ref}
      className="relative w-full select-none overflow-hidden rounded-xl bg-surface-2 cursor-ew-resize"
      onPointerDown={(e) => {
        dragging.current = true;
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
        update(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && update(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
    >
      <img src={before} alt={beforeLabel} className="block w-full h-auto pointer-events-none" />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <img src={after} alt={afterLabel} className="block w-full h-auto" />
      </div>

      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white/90 pointer-events-none"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-zinc-700 text-xs">
          ⇆
        </div>
      </div>

      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-xs font-medium">
        {afterLabel}
      </span>
      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-xs font-medium">
        {beforeLabel}
      </span>
    </div>
  );
}
