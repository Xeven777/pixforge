import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ImageCompress from "./pages/ImageCompress";
import FormatConvert from "./pages/FormatConvert";
import VideoTools from "./pages/VideoTools";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/compress" replace />} />
        <Route path="/compress" element={<ImageCompress />} />
        <Route path="/convert" element={<FormatConvert />} />
        <Route path="/video" element={<VideoTools />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
