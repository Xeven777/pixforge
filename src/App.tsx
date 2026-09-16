import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import ImageCompress from "./pages/ImageCompress";
import FormatConvert from "./pages/FormatConvert";
import Preview from "./pages/Preview";
import VideoTools from "./pages/VideoTools";
import Settings from "./pages/Settings";
import { takeLaunchFiles, onLaunchFiles, type LaunchPayload } from "./lib/tauri";
import { dispatchLaunch } from "./lib/launchBus";

const TOOL_ROUTES: Record<string, string> = {
  compress: "/compress",
  convert: "/convert",
};

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const handle = (payload: LaunchPayload) => {
      if (!payload.files.length) return;
      const tool = payload.tool && TOOL_ROUTES[payload.tool] ? payload.tool : "compress";
      navigate(TOOL_ROUTES[tool]);
      dispatchLaunch(tool, payload.files);
    };

    takeLaunchFiles().then(handle).catch(() => {});
    const unlisten = onLaunchFiles(handle);
    return () => {
      unlisten.then((u) => u()).catch(() => {});
    };
  }, [navigate]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/compress" replace />} />
        <Route path="/compress" element={<ImageCompress />} />
        <Route path="/convert" element={<FormatConvert />} />
        <Route path="/preview" element={<Preview />} />
        <Route path="/video" element={<VideoTools />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
