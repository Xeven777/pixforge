import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { stat } from "@tauri-apps/plugin-fs";

export async function statFiles(paths: string[]): Promise<{ path: string; size: number }[]> {
  return Promise.all(
    paths.map(async (path) => {
      try {
        const s = await stat(path);
        return { path, size: s.size };
      } catch {
        return { path, size: 0 };
      }
    })
  );
}
import type {
  CompressOptions,
  ConvertOptions,
  VideoCompressOptions,
  VideoTrimOptions,
  Preset,
  AppSettings,
} from "../types";

export async function pickFiles(filters: { name: string; extensions: string[] }[]) {
  return open({ multiple: true, filters }) as Promise<string[] | null>;
}

export async function pickDirectory() {
  return open({ directory: true }) as Promise<string | null>;
}

export async function compressImages(
  paths: string[],
  options: CompressOptions
): Promise<{ path: string; outputPath: string; outputSize: number }[]> {
  return invoke("compress_images", { paths, options });
}

export async function convertImages(
  paths: string[],
  options: ConvertOptions
): Promise<{ path: string; outputPath: string; outputSize: number }[]> {
  return invoke("convert_images", { paths, options });
}

export async function compressVideo(
  path: string,
  options: VideoCompressOptions
): Promise<{ outputPath: string }> {
  return invoke("compress_video", { path, options });
}

export async function trimVideo(
  path: string,
  options: VideoTrimOptions
): Promise<{ outputPath: string }> {
  return invoke("trim_video", { path, options });
}

export async function extractFrames(
  path: string,
  fps: number,
  outputDir: string
): Promise<{ count: number; outputDir: string }> {
  return invoke("extract_frames", { path, fps, outputDir });
}

export async function extractAudio(
  path: string,
  outputDir: string
): Promise<{ outputPath: string }> {
  return invoke("extract_audio", { path, outputDir });
}

export async function savePreset(preset: Omit<Preset, "id" | "createdAt">): Promise<Preset> {
  return invoke("save_preset", { preset });
}

export async function loadPresets(): Promise<Preset[]> {
  return invoke("load_presets");
}

export async function deletePreset(id: string): Promise<void> {
  return invoke("delete_preset", { id });
}

export async function getSettings(): Promise<AppSettings> {
  return invoke("get_settings");
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  return invoke("save_settings", { settings });
}
