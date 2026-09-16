import { NavLink } from "react-router-dom";
import { ImageDown, RefreshCw, Columns2, Video, Settings } from "lucide-react";
import clsx from "clsx";

const nav = [
  { to: "/compress", label: "Compress", icon: ImageDown },
  { to: "/convert", label: "Convert", icon: RefreshCw },
  { to: "/preview", label: "Preview", icon: Columns2 },
  { to: "/video", label: "Video", icon: Video },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-surface-1 border-r border-surface-2 flex flex-col py-6">
      <div className="px-5 mb-8">
        <span className="text-lg font-bold tracking-tight text-white">
          Pix<span className="text-accent">forge</span>
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-white"
                  : "text-zinc-400 hover:text-white hover:bg-surface-2"
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
