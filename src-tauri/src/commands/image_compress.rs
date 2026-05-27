use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use rayon::prelude::*;
use crate::processing::image_ops;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompressOptions {
    pub quality: u8,
    pub lossless: bool,
    pub preserve_exif: bool,
    pub output_dir: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompressResult {
    pub path: String,
    pub output_path: String,
    pub output_size: u64,
}

#[tauri::command]
pub fn compress_images(
    paths: Vec<String>,
    options: CompressOptions,
) -> Result<Vec<CompressResult>, String> {
    paths
        .par_iter()
        .map(|path| {
            let input = PathBuf::from(path);
            let output = image_ops::output_path(&input, &options.output_dir, None)?;
            image_ops::compress(&input, &output, options.quality, options.lossless, options.preserve_exif)?;
            let output_size = std::fs::metadata(&output)
                .map(|m| m.len())
                .unwrap_or(0);
            Ok(CompressResult {
                path: path.clone(),
                output_path: output.to_string_lossy().into_owned(),
                output_size,
            })
        })
        .collect::<Result<Vec<_>, String>>()
}
