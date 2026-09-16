export interface DevicePreset {
  id: string;
  name: string;
  quality: number;
  maxDimension: number;
  note: string;
}

// Quality + longest-side limits tuned to each platform's display/upload caps.
// Format stays whatever the page is set to (JPEG, WebP, AVIF are all accepted).
export const DEVICE_PRESETS: DevicePreset[] = [
  { id: "instagram", name: "Instagram", quality: 90, maxDimension: 1080, note: "1080 px · feed post" },
  { id: "whatsapp", name: "WhatsApp", quality: 80, maxDimension: 1600, note: "1600 px · chat share" },
  { id: "discord", name: "Discord", quality: 85, maxDimension: 1920, note: "1920 px · inline embed" },
  { id: "twitter", name: "Twitter / X", quality: 90, maxDimension: 4096, note: "4096 px · timeline" },
  { id: "web", name: "Web", quality: 80, maxDimension: 1920, note: "1920 px · optimized" },
];
