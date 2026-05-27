use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use crate::processing::ffmpeg;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoCompressOptions {
    pub crf: u8,
    pub preset: String,
    pub output_dir: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoTrimOptions {
    pub start_sec: f64,
    pub end_sec: f64,
    pub output_dir: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoResult {
    pub output_path: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FramesResult {
    pub count: u32,
    pub output_dir: String,
}

fn resolve_output(input: &str, output_dir: &Option<String>, suffix: &str, ext: &str) -> PathBuf {
    let input_path = PathBuf::from(input);
    let stem = input_path.file_stem().unwrap_or_default().to_string_lossy();
    let filename = format!("{}_{}.{}", stem, suffix, ext);
    match output_dir {
        Some(dir) => PathBuf::from(dir).join(filename),
        None => input_path.parent().unwrap_or(&PathBuf::from(".")).join(filename),
    }
}

#[tauri::command]
pub async fn compress_video(path: String, options: VideoCompressOptions) -> Result<VideoResult, String> {
    let output = resolve_output(&path, &options.output_dir, "compressed", "mp4");
    ffmpeg::compress(&path, &output, options.crf, &options.preset).await?;
    Ok(VideoResult { output_path: output.to_string_lossy().into_owned() })
}

#[tauri::command]
pub async fn trim_video(path: String, options: VideoTrimOptions) -> Result<VideoResult, String> {
    let output = resolve_output(&path, &options.output_dir, "trimmed", "mp4");
    ffmpeg::trim(&path, &output, options.start_sec, options.end_sec).await?;
    Ok(VideoResult { output_path: output.to_string_lossy().into_owned() })
}

#[tauri::command]
pub async fn extract_frames(path: String, fps: f32, output_dir: String) -> Result<FramesResult, String> {
    let count = ffmpeg::extract_frames(&path, fps, &output_dir).await?;
    Ok(FramesResult { count, output_dir })
}

#[tauri::command]
pub async fn extract_audio(path: String, output_dir: String) -> Result<VideoResult, String> {
    let input_path = PathBuf::from(&path);
    let stem = input_path.file_stem().unwrap_or_default().to_string_lossy();
    let output = PathBuf::from(&output_dir).join(format!("{}.mp3", stem));
    ffmpeg::extract_audio(&path, &output).await?;
    Ok(VideoResult { output_path: output.to_string_lossy().into_owned() })
}
