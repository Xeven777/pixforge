export type FileStatus = "pending" | "processing" | "done" | "error";

export interface QueueFile {
  id: string;
  path: string;
  name: string;
  size: number;
  status: FileStatus;
  outputPath?: string;
  outputSize?: number;
  error?: string;
  progress?: number;
}

export interface CompressOptions {
  quality: number;
  lossless: boolean;
  preserveExif: boolean;
  outputDir?: string;
}

export interface ConvertOptions {
  format: "webp" | "avif";
  quality: number;
  effort: number;
  outputDir?: string;
}

export interface VideoCompressOptions {
  crf: number;
  preset: string;
  outputDir?: string;
}

export interface VideoConvertOptions {
  format: "mp4" | "webm" | "mkv";
  codec: string;
  outputDir?: string;
}

export interface VideoTrimOptions {
  startSec: number;
  endSec: number;
  outputDir?: string;
}

export interface Preset {
  id: string;
  name: string;
  tool: "compress" | "convert" | "video";
  options: CompressOptions | ConvertOptions | VideoCompressOptions;
  createdAt: number;
}

export interface AppSettings {
  defaultOutputDir: string;
  concurrencyLimit: number;
  filenamePattern: string;
  theme: "dark" | "light" | "system";
}

export interface ProgressEvent {
  fileId: string;
  progress: number;
  inputSize?: number;
  outputSize?: number;
}
