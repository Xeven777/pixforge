use std::path::Path;
use std::process::Command;

fn ffmpeg_bin() -> String {
    std::env::var("FFMPEG_PATH").unwrap_or_else(|_| "ffmpeg".to_string())
}

pub async fn compress(input: &str, output: &Path, crf: u8, preset: &str) -> Result<(), String> {
    let status = Command::new(ffmpeg_bin())
        .args([
            "-y", "-i", input,
            "-c:v", "libx264",
            "-crf", &crf.to_string(),
            "-preset", preset,
            "-c:a", "copy",
            &output.to_string_lossy(),
        ])
        .status()
        .map_err(|e| format!("ffmpeg error: {e}"))?;
    if !status.success() {
        return Err(format!("ffmpeg exited with {}", status.code().unwrap_or(-1)));
    }
    Ok(())
}

pub async fn trim(input: &str, output: &Path, start: f64, end: f64) -> Result<(), String> {
    let duration = end - start;
    let status = Command::new(ffmpeg_bin())
        .args([
            "-y", "-i", input,
            "-ss", &start.to_string(),
            "-t", &duration.to_string(),
            "-c", "copy",
            &output.to_string_lossy(),
        ])
        .status()
        .map_err(|e| format!("ffmpeg error: {e}"))?;
    if !status.success() {
        return Err(format!("ffmpeg exited with {}", status.code().unwrap_or(-1)));
    }
    Ok(())
}

pub async fn extract_frames(input: &str, fps: f32, output_dir: &str) -> Result<u32, String> {
    std::fs::create_dir_all(output_dir).map_err(|e| e.to_string())?;
    let pattern = format!("{}/frame_%06d.jpg", output_dir);
    let status = Command::new(ffmpeg_bin())
        .args([
            "-y", "-i", input,
            "-vf", &format!("fps={}", fps),
            "-q:v", "2",
            &pattern,
        ])
        .status()
        .map_err(|e| format!("ffmpeg error: {e}"))?;
    if !status.success() {
        return Err(format!("ffmpeg exited with {}", status.code().unwrap_or(-1)));
    }
    let count = std::fs::read_dir(output_dir)
        .map(|d| d.count() as u32)
        .unwrap_or(0);
    Ok(count)
}

pub async fn extract_audio(input: &str, output: &Path) -> Result<(), String> {
    let status = Command::new(ffmpeg_bin())
        .args([
            "-y", "-i", input,
            "-q:a", "0",
            "-map", "a",
            &output.to_string_lossy(),
        ])
        .status()
        .map_err(|e| format!("ffmpeg error: {e}"))?;
    if !status.success() {
        return Err(format!("ffmpeg exited with {}", status.code().unwrap_or(-1)));
    }
    Ok(())
}
